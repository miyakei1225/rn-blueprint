# DB スキーマ管理

## 運用方針

**DDL の SoT は `db/sql/` の `.sql` ファイル。** TypeScript 側にスキーマ定義を持たない。

スキーマの型は書かずに生成する。`kysely-codegen` が実際の DB に接続して introspect し、`src/infra/db/schema.ts` を書き出す。「SQL が正、型はその写像」という向きを保つ。

`src/infra/db/schema.ts` は **手で編集しない**。カラムを変えたいときは `db/sql/` に新しい SQL を足し、DB に当ててから再生成する。

## ファイルの命名規則

```
YYYYMMDD_NN_<説明>.sql
```

- `YYYYMMDD` — 作成日（ゼロ埋め）
- `NN` — 同日複数ファイルを区別する連番（01 から始める）
- `<説明>` — スネークケースで何をしているかを書く

例:

```
20260101_01_create_users.sql
20260101_02_create_posts.sql
20260115_01_add_users_deleted_at.sql
```

## DB への適用手順

### ローカル（初回）

```bash
# Postgres を起動する。compose.yaml は db/sql/ を
# /docker-entrypoint-initdb.d/ にマウントしているため、
# 初回起動時にファイル名の昇順で自動的に流し込まれる。
pnpm db:up
```

### ローカル（ファイルを追加した後）

```bash
# コンテナを一度落として再起動すると DDL が再適用される（データも消える）。
pnpm db:down
pnpm db:up
```

本番（Cloud SQL）はマイグレーションツールを導入するか、手動で `psql -f` を使って適用する。

## スキーマ型の再生成

DDL を DB に適用した後、型を再生成する。

```bash
pnpm --filter @rn-blueprint/server generate:schema
```

再生成後は `tsc --noEmit` でコンパイルエラーが無いことを確認する。

```bash
pnpm --filter @rn-blueprint/server typecheck
```

## シード

`db/seed.sql` にローカル確認用のサンプルデータを書く。本番 Cloud SQL には **絶対に流し込まない**。

```bash
pnpm --filter @rn-blueprint/server db:seed
```
