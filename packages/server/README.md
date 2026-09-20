# @rn-blueprint/server

Hono + Cloud Run の API サーバー雛形。

## ローカル実行手順

### 前提

- Node.js 22.18 以上
- Docker（Postgres 用）
- pnpm

### 初回セットアップ

```bash
# モノレポルートで依存をインストール
pnpm install

# 環境変数ファイルを用意する
# env.example を .env にコピーして内容を確認する
cp packages/server/env.example packages/server/.env
```

### Postgres の起動

`compose.yaml` は `db/sql/` を `/docker-entrypoint-initdb.d/` にマウントしている。
初回起動時にファイル名の昇順で DDL が自動的に流し込まれる。

```bash
pnpm --filter @rn-blueprint/server db:up
```

### サーバー起動

```bash
pnpm --filter @rn-blueprint/server dev
```

起動後に `http://localhost:3000/health` でヘルスチェック、
`http://localhost:3000/doc` で Swagger UI が確認できる（`NODE_ENV=production` のときは無効）。

### シードデータの投入

```bash
pnpm --filter @rn-blueprint/server db:seed
```

### Postgres の停止

```bash
# -v でボリュームも削除する（テーブルが再作成される）
pnpm --filter @rn-blueprint/server db:down
```

### DB スキーマの型を再生成

DDL を変更して DB に適用した後、`kysely-codegen` でスキーマの型を生成する。

```bash
pnpm --filter @rn-blueprint/server generate:schema
```

詳細は `db/README.md` を参照。

### 型チェック

```bash
pnpm --filter @rn-blueprint/server typecheck
```

---

## Cloud Run デプロイ手順

### 前提

- Google Cloud SDK (`gcloud`) がインストール済みで認証済み
- Cloud Run API、Cloud SQL Admin API が有効化済み
- Cloud SQL for PostgreSQL インスタンスが作成済み

### 設定

`packages/server/deploy.sh` の以下の変数をプロジェクトに合わせて書き換える。

| 変数                | 説明                           | 例           |
| ------------------- | ------------------------------ | ------------ |
| `SERVICE_NAME`      | Cloud Run のサービス名         | `my-app-api` |
| `DEV_PROJECT_ID`    | dev 環境の GCP プロジェクト ID | `my-app-dev` |
| `PRD_PROJECT_ID`    | prd 環境の GCP プロジェクト ID | `my-app-prd` |
| `SQL_INSTANCE_NAME` | Cloud SQL のインスタンス名     | `my-app-db`  |
| `DB_USER`           | DB ユーザー名                  | `app`        |
| `DB_NAME`           | DB 名                          | `blueprint`  |

### 秘匿情報

DB パスワードは Secret Manager に登録し、`--set-secrets` で注入する。

```bash
# Secret Manager にパスワードを登録する（初回のみ）
echo -n "your-db-password" | gcloud secrets create blueprint-db-password \
  --data-file=- \
  --project your-project-dev

# Cloud Run のサービスアカウントに Secret へのアクセス権を付与する
gcloud secrets add-iam-policy-binding blueprint-db-password \
  --member="serviceAccount:YOUR_SERVICE_ACCOUNT@your-project-dev.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project your-project-dev
```

### デプロイ

```bash
# deploy.sh に実行権限を付与する（初回のみ）
chmod +x packages/server/deploy.sh

# ドライランで確認
pnpm --filter @rn-blueprint/server deploy:dev -- --dry-run

# 開発環境にデプロイ
pnpm --filter @rn-blueprint/server deploy:dev

# 本番環境にデプロイ（確認プロンプトあり）
pnpm --filter @rn-blueprint/server deploy:prd

# 確認をスキップして本番にデプロイ（CI 用）
pnpm --filter @rn-blueprint/server deploy:prd -- --yes
```

### デプロイ状況の確認

```bash
pnpm --filter @rn-blueprint/server deploy:dev -- status dev
pnpm --filter @rn-blueprint/server deploy:prd -- status prd
```

### Cloud SQL への接続

Cloud Run では `--add-cloudsql-instances` を付けてデプロイすると、コンテナ内の
`/cloudsql/<接続名>` にソケットが生える。`pg` はホスト名が `/` で始まるとソケットとして扱う。

`deploy.sh` が `INSTANCE_CONNECTION_NAME` 環境変数を自動で設定するので、
`src/config/config.ts` で自動的にソケット接続に切り替わる。

---

## アーキテクチャ

```
presentation  ──▶  usecase  ──▶  domain  ◀──  infra
```

レイヤーの依存は一方向。`usecase` から上に `pg` / `kysely` の型を漏らさない。

```
src/
├── index.ts                     エントリポイント（listen するだけ）
├── app.ts                       依存の組み立てとルーティング
├── config/config.ts             環境変数の読み取りと検証
├── presentation/
│   ├── handler/                 HTTP ハンドラ（入力の検証と usecase 呼び出し）
│   │   ├── system-handler.ts    GET /health
│   │   ├── docs-handler.ts      GET /openapi.yaml, GET /doc (Swagger UI)
│   │   └── errors.ts            usecase エラー → HTTP ステータスの変換
│   └── middleware/
│       └── auth.ts              認証ミドルウェアの雛形（導入時に実装する）
├── usecase/
│   ├── errors.ts                usecase が投げるエラーの定義
│   └── health-usecase.ts        ヘルスチェックのユースケース
├── domain/
│   ├── model/health.ts          ドメインモデル
│   └── repository/              リポジトリの型（契約）。実装は置かない
│       └── health-repository.ts
└── infra/
    ├── db/
    │   ├── db.ts                kysely + pg の接続
    │   └── schema.ts            kysely-codegen の生成物（手で編集しない）
    └── repository/
        └── health-repository-impl.ts  リポジトリの実装
```

新しいリソースの追加手順は `src/app.ts` のコメントを参照。
