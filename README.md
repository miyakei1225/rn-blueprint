# rn-blueprint

新規 React Native (Expo) アプリを始めるためのスケルトンリポジトリ。アプリ・ API 仕様・ API サーバーを 1 つの pnpm workspace にまとめてある。

## 構成

| パッケージ                             | 内容                                                       |
| -------------------------------------- | ---------------------------------------------------------- |
| [packages/api-spec](packages/api-spec) | API 仕様の SoT。TypeSpec で書き、`openapi.yaml` を生成する |
| [packages/mobile](packages/mobile)     | Expo (SDK 57) + Expo Router の React Native アプリ         |
| [packages/server](packages/server)     | Hono + Cloud Run の API サーバー                           |
| [openapi.yaml](openapi.yaml)           | `packages/api-spec` からの生成物。手で編集しない           |

技術選定とその理由は [TECH_STACK.md](TECH_STACK.md) にまとめている。

## セットアップ

```bash
mise install    # Node / pnpm を .mise.toml のバージョンに揃える
pnpm install    # リポジトリルートで 1 回
```

アプリの接続先を `packages/mobile/.env` に置く（このファイルはコミットしない）。

```bash
# packages/mobile/.env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

```bash
pnpm ios                # iOS シミュレータで起動 (Metro も同時に起動する)
pnpm run dev:server     # API サーバーをローカル起動 (http://localhost:3000)
```

**Expo Go では起動しない**（`expo-dev-client` などネイティブモジュールを依存に含むため）。`pnpm ios` / `pnpm android` の開発ビルドを使う。Web (`pnpm web`) はネイティブビルド不要で動く。

## コマンド

ルートから使える主なスクリプト。

| コマンド                                 | 内容                                                         |
| ---------------------------------------- | ------------------------------------------------------------ |
| `pnpm ios` / `pnpm android` / `pnpm web` | アプリを起動                                                 |
| `pnpm start`                             | Metro (Expo Dev Server) だけを起動                           |
| `pnpm run dev:server`                    | API サーバーを watch 起動                                    |
| `pnpm generate:openapi`                  | `packages/api-spec` の TypeSpec から `openapi.yaml` を再生成 |
| `pnpm generate:api`                      | 上に続けて `packages/mobile/src/generated/` まで再生成       |
| `pnpm lint`                              | TypeSpec のコンパイルチェック + oxlint                       |
| `pnpm typecheck`                         | 全パッケージの `tsc --noEmit`                                |
| `pnpm format`                            | Prettier で全パッケージを整形                                |
| `pnpm run format:check`                  | 整形済みかを検査（差分があれば失敗する）                     |

個別に動かす場合は `pnpm --filter @rn-blueprint/mobile <script>` / `pnpm --filter @rn-blueprint/server <script>`。

## このリポジトリから新しいプロジェクトを始める

1. **リネーム** — `rn-blueprint` / `@rn-blueprint/*` をプロジェクト名に置き換える（ルートと各パッケージの `package.json`、`packages/mobile/app.json` の `name` / `slug` / `scheme` / `bundleIdentifier` / `package`、`.github/workflows/*.yml` の `--filter`、`release-please-config.json`、`packages/api-spec` の `namespace`）。
2. **不要なパッケージを消す** — サーバーを別リポジトリで持つなら `packages/server` と `Dockerfile` を、API 仕様が外部から与えられるなら `packages/api-spec` を削除し、`packages/mobile/openapi-ts.config.ts` の `input` をその仕様の URL / パスに向ける。`.github/filters.yml` と `.github/workflows/ci.yml` の対応するジョブも消す。
3. **アイコン・スプラッシュを差し替える** — `packages/mobile/assets/images/`。雛形のものはプレースホルダー。
4. **CI の前提を揃える** — release-please を使う場合はリポジトリの Secrets に `RELEASE_GITHUB_APP_CLIENT_ID` / `RELEASE_GITHUB_APP_PRIVATE_KEY` を登録する。ブランチ保護の必須チェックには CI の `checks` ジョブだけを指定する。
5. **EAS プロジェクトを作る** — `packages/mobile` で `eas init`。払い出された projectId を `EAS_PROJECT_ID` として渡す（[docs/build.md](docs/build.md)）。

## ドキュメント

| ファイル                                                   | 内容                                                          |
| ---------------------------------------------------------- | ------------------------------------------------------------- |
| [TECH_STACK.md](TECH_STACK.md)                             | 技術選定、モノレポ構成、CI / リリース、バージョン管理の方針   |
| [docs/directory-structure.md](docs/directory-structure.md) | `packages/mobile` の構成と「どこに何を置くか」の判断基準      |
| [docs/coding-guideline.md](docs/coding-guideline.md)       | エクスポート形式、ファイル名、import 順など Lint 外の取り決め |
| [docs/server-architecture.md](docs/server-architecture.md) | `packages/server` のレイヤー構成とエラーの扱い                |
| [docs/build.md](docs/build.md)                             | ビルドコマンド、EAS プロファイル、トラブルシュート            |
| [packages/server/README.md](packages/server/README.md)     | API サーバーのローカル実行・ Cloud Run デプロイ手順           |
| [CLAUDE.md](CLAUDE.md)                                     | AI コーディングエージェント向けの開発ルール                   |
