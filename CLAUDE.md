# rn-blueprint

新規 React Native (Expo) アプリを始めるためのスケルトンのモノレポ。`packages/mobile` が Expo (SDK 57) + Expo Router の React Native アプリ、`packages/api-spec` が API 仕様の SoT (TypeSpec)、`packages/server` が Hono + Cloud Run の API サーバー。

## 必ず守ること

- パッケージマネージャは **pnpm**。`npm` / `npx` / `yarn` は使わない。一時実行は `pnpm dlx`
- 依存のバージョンは `^` `~` を使わず固定する。追加は `pnpm add <pkg>@<version> --save-exact`
- 依存を追加・更新するときは、リリースから 14 日以上経過したバージョンを採用する（`pnpm-workspace.yaml` の `minimumReleaseAge` で強制している）
- パッケージをグローバルインストールしない。恒久的に必要なツールは `.mise.toml` に固定する
- **`pnpm install` はリポジトリルートで行う**。パッケージ個別の依存追加は `pnpm --filter @rn-blueprint/<name> add ...`
- ルートの npm script に pnpm の組み込みコマンドと同じ名前を付けない（`server` / `list` / `link` / `why` / `env` など）。組み込みが優先されてスクリプトが無言で無視される。API サーバーの起動が `dev:server` なのはこのため
- `pnpm-workspace.yaml` の `nodeLinker: hoisted` は外さない。React Native の autolinking がフラットな `node_modules` を前提にしているため
- API 仕様の SoT は `packages/api-spec` の `.tsp` (TypeSpec)。ルートの `openapi.yaml` はそこからの生成物なので手で編集しない。エンドポイントを足すときは `.tsp` → `pnpm generate:api` → `packages/server` 実装 の順で進める
- DB スキーマ (DDL) の SoT は `packages/server/db/sql/` の `.sql`。TypeScript 側にスキーマ定義を持たせない
- 生成物は手で編集しない。`openapi.yaml`（TypeSpec）、`packages/mobile/src/generated/`（openapi-ts）、`packages/server/src/infra/db/schema.ts`（kysely-codegen）
- `packages/server` は presentation → usecase → domain ← infra の一方向。`usecase` から上に `pg` / `kysely` の型を漏らさない
- `babel.config.js` に足すパッケージは `packages/mobile/package.json` にも宣言する（宣言漏れは EAS ビルドだけが失敗する）
- `@react-navigation/*` を直接 import しない。`expo-router/react-navigation` を経由する
- ネイティブ設定の SoT は `packages/mobile/app.json` と config plugin。`ios/` `android/` は `expo prebuild` の生成物なので直接編集せず、コミットもしない
- アプリのバージョンの SoT は `packages/mobile/package.json` の `version`（release-please が更新し、`app.config.ts` が読む）。`app.json` に書かない
- 認証情報やクライアント ID をコードに直書きせず、`.env` の `EXPO_PUBLIC_` 変数を経由する。`EXPO_PUBLIC_` 付きの値はバンドルに平文で入るため、秘密情報はこの経路で渡さない
- GitHub Actions の `uses` は commit SHA で固定する（タグ指定のみは禁止）
- 画面に出る文字列は i18next のキー経由にし、`ja.ts` と `en.ts` の両方に同じ構造で足す

## ディレクトリ構成

@docs/directory-structure.md

## コーディング規約

@docs/coding-guideline.md

## 技術構成

@TECH_STACK.md

## サーバーのアーキテクチャ

@docs/server-architecture.md

## その他のドキュメント（必要になったら読む）

- `packages/server/README.md` — API サーバーのローカル実行・ Cloud Run デプロイ手順
- `docs/build.md` — ビルドコマンド、EAS プロファイル、トラブルシュート
