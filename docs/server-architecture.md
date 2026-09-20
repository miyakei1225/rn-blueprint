# サーバーアーキテクチャ

`packages/server` の内部構成と、どこに何を置くかの判断基準をまとめる。モノレポ全体の構成は [TECH_STACK.md](../TECH_STACK.md)、ローカル実行と Cloud Run へのデプロイ手順は [packages/server/README.md](../packages/server/README.md) を参照。

Clean Architecture を採る。レイヤーの切り方・依存の向き・ Repository パターンは言語に依存しないので、TypeScript でもこの構造を保つ。

## レイヤーと依存の向き

```
presentation  ──▶  usecase  ──▶  domain  ◀──  infra
```

- **`domain` は何にも依存しない。** ビジネスの語彙（モデル）と、外界に求める契約（リポジトリの型）だけを持つ
- **`infra` は `domain` に依存する。** リポジトリの実装を提供する側であって、`domain` から参照されることはない（依存性逆転）
- `presentation` → `usecase` → `domain` の一方向。逆流させない

この向きを守ると、DB を差し替えても `usecase` から上は変わらない。逆に `usecase` が `pg` や `kysely` の型を引数・戻り値に持ち始めたら、それは依存が漏れているサイン。

## ディレクトリ構成

```
packages/server/
├── db/
│   └── sql/                    DDL の SoT。YYYYMMDD_NN_<説明>.sql
├── compose.yaml                ローカル開発用 Postgres
└── src/
    ├── index.ts                エントリポイント（listen するだけ）
    ├── app.ts                  依存の組み立てとルーティング
    │
    ├── config/                 環境変数の読み込みと検証
    │
    ├── presentation/
    │   ├── handler/            HTTP ハンドラ。入力の検証と usecase 呼び出しのみ
    │   └── middleware/         認証など横断的な処理
    │
    ├── usecase/                ビジネスロジック。複数リポジトリの組み合わせとトランザクション境界
    │
    ├── domain/
    │   ├── model/              ドメインモデル
    │   ├── repository/         リポジトリの型（契約）。実装は置かない
    │   └── gateway/            外部サービスの型（契約）。永続化以外の外向きの呼び出し
    │
    └── infra/
        ├── db/                 接続の管理と、DB から生成したスキーマ型
        ├── repository/         リポジトリの実装
        └── gateway/            外部サービスの実装
```

`gateway` を `repository` と分けるのは、プッシュ通知やメール送信のように**永続化ではない外向きの一方向の呼び出し**があるため。`<entity>-repository.ts` の命名と「行 → モデルの変換」という役割に載せると Repository パターンの意味が薄まる。依存の向きは repository と同じで、`domain` が契約を持ち `infra` が実装する。

## 各レイヤーの責務

### presentation

HTTP の入出力だけを扱う。パスパラメータやクエリの検証、usecase の呼び出し、結果とエラーの HTTP へのマッピングまで。**ビジネスロジックを書かない。** `if` が増えてきたら usecase に移す合図。

ドメインモデルをそのまま JSON で返さず、レスポンス用の形に詰め替える。モデルの変更が API 仕様の破壊に直結するのを避けるため。API 仕様の SoT は [packages/api-spec](../packages/api-spec) の TypeSpec で、レスポンスの形はそちらに合わせる。

### usecase

「1 つのユースケース = 1 メソッド」で書く。リポジトリを組み合わせ、必要ならトランザクションの境界を張るのがここ。

呼び出し側（presentation）が HTTP ステータスを決められるよう、失敗はドメインの語彙のエラーに変換して投げる（`usecase/errors.ts`）。`pg` のエラーをそのまま presentation まで伝播させない。

### domain

モデルと、リポジトリの型。**外部ライブラリを import しない。**

DB の行の形とドメインモデルの形は一致しなくてよい。カラムから導出できる状態はカラムに持たせず `domain/model` 側で計算する。「DB の都合」と「ビジネスの語彙」を分けるのがこの層の役目。

### infra

リポジトリの実装。SQL を書き、**取得した行をドメインモデルに変換して返す**。行の型（`snake_case` のカラム名がそのまま出てくる）を層の外に漏らさない。

## Repository パターン

契約と実装をファイルで分ける。

|            | 置き場所                                           |
| ---------- | -------------------------------------------------- |
| 型（契約） | `src/domain/repository/<entity>-repository.ts`     |
| 実装       | `src/infra/repository/<entity>-repository-impl.ts` |

実装は `class` ではなくファクトリ関数で作り、戻り値の型を契約側の型にする。こうすると呼び出し側は実装の存在を知らないまま組み立てられる。

```ts
// domain/repository/item-repository.ts — 契約
export type ItemRepository = {
  findById(id: string): Promise<Item | null>;
};

// infra/repository/item-repository-impl.ts — 実装
export function newItemRepository(db: Database): ItemRepository { ... }
```

依存の注入は [src/app.ts](../packages/server/src/app.ts) で一度だけ行う。ここが唯一「実装を知っている」場所になる。

## エラーの扱い

層ごとにエラーの語彙を分け、境界で翻訳する。**SQL のエラーがそのまま presentation まで届く状態にしない。**

| 層             | 失敗の表し方                     | 定義場所                         |
| -------------- | -------------------------------- | -------------------------------- |
| infra / domain | 「見つからない」は `null` を返す | —                                |
| usecase        | ドメインの語彙の例外を投げる     | `usecase/errors.ts`              |
| presentation   | 例外を HTTP ステータスに落とす   | `presentation/handler/errors.ts` |

「見つからない」を sentinel error で表す言語・ライブラリもあるが、Kysely では `executeTakeFirst()` が `undefined` を返すだけなので、**「無い」は例外ではなく値（`null`）で表す**。ユースケース上それが異常なとき（詳細取得など）に初めて usecase が `NotFoundError` を投げる。一覧取得のように 0 件が正常なケースで例外を作らずに済む。

`usecase/errors.ts` の語彙と HTTP ステータスの対応は次のとおり。**新しい失敗を増やすときは、既存のどれかに寄せられないかを先に考える**（ステータスが増えると `.tsp` の返り値のユニオンとアプリ側の分岐も増える）。

| エラー            | ステータス | 使う場面                                         |
| ----------------- | ---------- | ------------------------------------------------ |
| `ValidationError` | 400        | 値の形は正しいが業務ルールに反する               |
| `ForbiddenError`  | 403        | 認証は通っているが、その操作を行う権限が無い     |
| `NotFoundError`   | 404        | 対象が存在しない                                 |
| `ConflictError`   | 409        | 対象の現在の状態では実行できない（二重実行など） |

入力の検証エラーは presentation で完結させ、400 を直接返す（usecase まで持ち込まない）。`ValidationError` は「形は正しいので presentation では判断できない」ものだけに使う。

## トランザクション

**複数行にまたがる更新は 1 つのリポジトリのメソッドに閉じ込め、その中で `db.transaction()` を張る。** usecase 側でトランザクションの境界を持とうとすると `Kysely` のトランザクションオブジェクトを usecase の引数に通すことになり、`infra` の型が上の層へ漏れる。

そのため、原子性が要る操作は「1 つのユースケース = 1 つのリポジトリメソッド」になるようにモデルを切る。**2 つのテーブルを同時に更新しないと表せない状態は、片方を導出値にできないかを先に検討する。**

## Cloud SQL への接続

Cloud SQL for PostgreSQL を使う場合、接続経路は実行環境で変わるが、**アプリのコードは分岐を 1 箇所（[src/infra/db/db.ts](../packages/server/src/infra/db/db.ts)）に閉じ込める。**

| 環境      | 経路                                                         |
| --------- | ------------------------------------------------------------ |
| ローカル  | `compose.yaml` の Postgres に TCP 接続                       |
| Cloud Run | Unix ドメインソケット `/cloudsql/<INSTANCE_CONNECTION_NAME>` |

Cloud Run では `--add-cloudsql-instances` を付けてデプロイすると、コンテナ内の `/cloudsql/<接続名>` にソケットが生える。`pg` はホスト名が `/` で始まるとソケットとして扱うため、`host` にそのパスを渡すだけでよく、プロキシのサイドカーは要らない。

接続プールは**インスタンスごとに 1 つ**持つ。Cloud Run は同時実行数の上限までリクエストを 1 インスタンスに詰めるので、`max-instances × プールの max` が Cloud SQL の最大接続数を超えないようにする。デプロイ設定を変えるときはここも見直すこと。

DB のパスワードは環境変数に直書きせず Secret Manager に置き、`--set-secrets` で注入する。

## スキーマと型

**DDL の SoT は `db/sql/` の `.sql` ファイル。** TypeScript 側にスキーマ定義を持たない。

スキーマの型は書かずに生成する。`kysely-codegen` が実際の DB に接続して introspect し、`src/infra/db/schema.ts` を吐く。**「SQL が正、型はその写像」** という向きを保つ。

```bash
pnpm --filter @rn-blueprint/server generate:schema
```

生成物は**手で編集しない**。カラムを変えたいときは `db/sql/` に新しい SQL を足し、DB に当ててから再生成する。`packages/mobile/src/generated/` と同じ扱い。

## エンティティを 1 つ足す手順

1. `db/sql/` に DDL を追加し、DB に当てる
2. `pnpm --filter @rn-blueprint/server generate:schema` でスキーマ型を再生成
3. `domain/model/` にモデル、`domain/repository/` に契約を書く
4. `infra/repository/` に実装を書く（行 → モデルの変換はここ）
5. `usecase/` にユースケースを書く
6. `packages/api-spec` の `.tsp` に仕様を足し、`pnpm generate:api` で `openapi.yaml` とアプリ側の型を再生成
7. `presentation/handler/` にハンドラを書き、`src/app.ts` で配線する

3 〜 5 は下の層から順に書くと、上の層で「何が足りないか」が型として現れるので手戻りが少ない。
