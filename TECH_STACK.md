# 技術構成

このリポジトリが採っている技術選定と、その理由・制約をまとめる。セットアップ手順は [README.md](README.md)、コードの置き場所は [docs/directory-structure.md](docs/directory-structure.md) を参照。

## 技術スタック

- [Expo](https://docs.expo.dev/) (SDK 57) + [Expo Router](https://docs.expo.dev/router/introduction/) — ファイルベースルーティング
- React Native 0.86 / React 19.2 (New Architecture / bridgeless)
- TypeScript (strict)
- [Native Tabs](https://docs.expo.dev/router/advanced/native-tabs/) + [expo-glass-effect](https://docs.expo.dev/versions/latest/sdk/glass-effect/) — iOS 26 の Liquid Glass 対応
- [NativeWind](https://www.nativewind.dev/) (Tailwind CSS)
- [TypeSpec](https://typespec.io/) — API 仕様の SoT。`openapi.yaml` を生成する
- [TanStack Query](https://tanstack.com/query) + [@hey-api/openapi-ts](https://heyapi.dev/) — OpenAPI 仕様から型付き API クライアントを自動生成
- [i18next](https://www.i18next.com/) / react-i18next — ja / en 切り替え
- サーバー: [Hono](https://hono.dev/) + Cloud Run / PostgreSQL + [Kysely](https://kysely.dev/)（スキーマ型は [kysely-codegen](https://github.com/RobinBlomberg/kysely-codegen) が DB から生成）
- Lint: [Oxlint](https://oxc.rs/) (`oxlint-config-universe/native`) / Format: Prettier (`prettier-plugin-tailwindcss`)
- パッケージマネージャ: **pnpm** (`packageManager` フィールドと [.mise.toml](.mise.toml) で固定)
- CI / リリース: GitHub Actions + [release-please](https://github.com/googleapis/release-please)

## ディレクトリ構成

pnpm workspace のモノレポ。

```
openapi.yaml                    packages/api-spec からの生成物。mobile / server 双方がこれに従う
pnpm-workspace.yaml             workspace 定義 + pnpm 設定 (nodeLinker など)
Dockerfile                      packages/server 専用 (mobile はコンテナ管理しない)
packages/
  api-spec/                     API 仕様の SoT (TypeSpec)
  mobile/                       Expo アプリ (詳細は docs/directory-structure.md)
  server/                       Hono + Cloud Run の API サーバー (詳細は packages/server/README.md)
```

`packages/mobile` 内部の構成と「どこに何を置くか」の判断基準は [docs/directory-structure.md](docs/directory-structure.md) に、`packages/server` のレイヤー構成は [docs/server-architecture.md](docs/server-architecture.md) にまとめている。

**使わないパッケージは削除してよい。** サーバーを別リポジトリで持つなら `packages/server` と `Dockerfile` を、API 仕様が外部から与えられるなら `packages/api-spec` を消し、`packages/mobile/openapi-ts.config.ts` の `input` をその仕様の URL / パスに向ける。

## モノレポ (pnpm workspace)

[pnpm-workspace.yaml](pnpm-workspace.yaml) で `nodeLinker: hoisted` を指定している。**これは外さないこと。** React Native の autolinking と Metro は `node_modules` がフラットに並んでいる前提で動くため、pnpm 既定の isolated linker では `expo prebuild` / EAS ビルドがネイティブモジュールを解決できない。

[packages/mobile/metro.config.js](packages/mobile/metro.config.js) では Expo 公式のモノレポ手順に従い、`watchFolders` にワークスペースルートを、`nodeModulesPaths` にパッケージ側とルート側の `node_modules` を指定し、`disableHierarchicalLookup` で親ディレクトリを遡る解決を止めている。

`pnpm install` は**リポジトリルートで行う**。個別パッケージへの依存追加は `pnpm --filter @rn-blueprint/<name> add <pkg>@<version> --save-exact`。

ルートの npm script に pnpm の組み込みコマンドと同じ名前を付けないこと（`server` / `list` / `link` / `why` / `env` など）。組み込みが優先されてスクリプトが無言で無視される。API サーバーの起動が `dev:server` なのはこのため。

## Liquid Glass (iOS 26)

タブバーは `expo-router/unstable-native-tabs` の `NativeTabs` を使っている。ネイティブのタブバー (iOS では `UITabBarController`) をそのまま使うため、iOS 26 以降では OS 標準の Liquid Glass タブバーになる。react-navigation のタブ (`Tabs`) は JS 描画なので Liquid Glass にはならない。

```tsx
// src/app/(tabs)/_layout.tsx
<NativeTabs minimizeBehavior="onScrollDown" tintColor={Colors[colorScheme].tint}>
  <NativeTabs.Trigger name="index">
    <NativeTabs.Trigger.Icon sf={{ default: "house", selected: "house.fill" }} md="home" />
    <NativeTabs.Trigger.Label>{t("home.title")}</NativeTabs.Trigger.Label>
  </NativeTabs.Trigger>
</NativeTabs>
```

- アイコンは `sf` に [SF Symbols](https://developer.apple.com/sf-symbols/)、`md` に [Material Symbols](https://fonts.google.com/icons) の名前を渡す。`{ default, selected }` で選択時のアイコンを分けられる。ベクターアイコンライブラリを使いたい場合は `NativeTabs.Trigger.VectorIcon` を経由する。
- `minimizeBehavior` は iOS 26 以降でスクロールに応じてタブバーを最小化する。`blurEffect` / `disableTransparentOnScrollEdge` などで見た目を調整できる。
- **`unstable_` 付きのエントリポイントなのでマイナーバージョンで API が変わる可能性がある。** 更新時は [Native Tabs のドキュメント](https://docs.expo.dev/router/advanced/native-tabs/) を確認すること。

タブバー以外のガラス表面には [components/glass-card.tsx](packages/mobile/src/components/glass-card.tsx) を使う。`expo-glass-effect` の `GlassView` をラップし、`isLiquidGlassAvailable()` が false になる環境 (Android / Web / iOS 25 以下) では半透明の背景にフォールバックする。

Liquid Glass の見た目を確認するには **iOS 26 以降のシミュレータ** が必要（`xcrun simctl list devices available` で確認）。iOS 25 以下では従来のタブバーとして描画されるだけで、エラーにはならない。

## API 仕様 (TypeSpec)

**リクエスト / レスポンスの型の SoT は [packages/api-spec](packages/api-spec) の `.tsp`。** ルートの `openapi.yaml` はここからの生成物なので**手で編集しない**。YAML を直接書くより型の再利用が効き、`tsp compile` が仕様の矛盾（未定義モデルの参照、パスパラメータの過不足など）をコンパイルエラーとして落としてくれる。

```
packages/api-spec/
├── main.tsp            @service / @info と routes の import をまとめる
├── tspconfig.yaml      openapi3 emitter の設定。出力先はリポジトリルート
├── models/             リクエスト / レスポンスのモデルと enum
│   ├── error.tsp       Error と、それを包む ErrorResponse<Status>
│   └── health.tsp
└── routes/             エンドポイント定義 (interface = @route のグループ)
    └── system.tsp
```

書き方の取り決め。

- **1 リソース = `models/<resource>.tsp` + `routes/<resource>.tsp`** の 2 ファイル。モデルはルートから分離し、複数のエンドポイントで使い回す
- ルートは `interface XxxController` にまとめ、共通のパスプレフィックスを `@route` でインターフェース側に付ける
- **各オペレーションに `@operationId` を明示する。** interface に属するオペレーションの operationId は既定で `インターフェース名_オペレーション名` になり、そのまま生成 SDK の関数名（`itemControllerListItems`）に化けるため
- エラーレスポンスは [models/error.tsp](packages/api-spec/models/error.tsp) の `BadRequestError` / `NotFoundError` などを返り値のユニオンに足す。`@error` を付けたモデルは openapi-ts 側でエラー型として扱われる
- モデル名が生成 SDK の型名とぶつかると `Xxx2` のような名前が生えるので避ける。一覧レスポンスは `ListItemsResponse` ではなく `ItemListResponse` のように、openapi-ts が operationId から作る名前と衝突しない形にする
- `main.tsp` に `servers` を書かない。生成クライアントに既定 baseUrl が焼き込まれ、`apiClient.ts` を経由し忘れたときに別ホストへ黙って飛ぶため

`.tsp` の整形はルートの `pnpm format` に含まれる（`@typespec/prettier-plugin-typespec` を使う）。`pnpm lint` は `tsp compile . --no-emit` も走らせるので、仕様の構文エラーはここで落ちる。

## API クライアント

エンドポイントを足すときは次の順で進める。

1. `packages/api-spec/models/` にモデルを、`packages/api-spec/routes/` にエンドポイントを追加する。
2. ルートで `pnpm generate:api` を実行する。`openapi.yaml` と `packages/mobile/src/generated/` がまとめて再生成される（`pnpm generate:openapi` だけなら `openapi.yaml` まで）。
3. `packages/server` に実装を足す（レイヤーの分け方は [docs/server-architecture.md](docs/server-architecture.md)）。
4. 生成された SDK 関数を `useQuery` / `useMutation` でラップしたフックを追加する。機能に紐づくものは `features/<機能>/hooks/` に、どの機能にも属さないものだけ [hooks/](packages/mobile/src/hooks/) に置く（[useHealthCheck.ts](packages/mobile/src/hooks/useHealthCheck.ts) が最小の例）。

認証ヘッダーの付与など、クライアント共通の設定は [services/apiClient.ts](packages/mobile/src/services/apiClient.ts) に書く。接続先は `EXPO_PUBLIC_API_URL`（未設定なら `http://localhost:3000`）で、プロファイルごとの値は [eas.json](packages/mobile/eas.json) の環境が持つ。

**`apiClient.ts` は `process.env.EXPO_PUBLIC_API_URL` を直接読むこと。** `EXPO_PUBLIC_` 付きの変数は Babel がバンドル時にリテラルへ展開するため、この経路だけが EAS ビルドに確実に届く。`Constants.expoConfig.extra.apiUrl`（[app.config.ts](packages/mobile/app.config.ts) が入れる値）だけに頼ると、`expo export` した成果物が `http://localhost:3000` を向いたままになることがある。

生成 SDK の関数は既定で失敗時に throw せず `{ data: undefined, error }` を返す。`useQuery` の `queryFn` から呼ぶ場合は `getHealth({ throwOnError: true })` のように `throwOnError` を指定すること。指定しないと `data` が `undefined` のまま返り、TanStack Query が「queryFn が undefined を返した」とエラーにする。

## Expo Router と react-navigation

SDK 56 以降、expo-router は react-navigation を内部にフォークして同梱しており、アプリコードから `@react-navigation/*` を直接 import できない（起動時に非互換エラーになる）。テーマなど react-navigation 由来の API は `expo-router/react-navigation` から import する。

```tsx
import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router/react-navigation";
```

移行の詳細は [SDK 55 → 56 の移行ガイド](https://docs.expo.dev/router/migrate/sdk-55-to-56/) を参照。

## NativeWind と pnpm

`react-native-css-interop` を直接 dependencies に入れている。NativeWind は Babel 変換でアプリコードに `react-native-css-interop/jsx-runtime` への import を注入するが、pnpm の既定 (isolated node_modules) ではプロジェクトルートから解決できずバンドルが失敗するため。`nodeLinker: hoisted` にした現在は直接依存がなくても解決できるはずだが、暗黙のホイスティングに依存する形になるため明示のままにしている。NativeWind を更新する際は `react-native-css-interop` も同じ組み合わせのバージョンに揃えること（NativeWind の `dependencies` が固定バージョンで指定している）。

`babel.config.js` に足すパッケージは `packages/mobile/package.json` にも宣言すること。宣言漏れはローカルではホイスティングで動いてしまい、EAS ビルドだけが失敗する。

## Lint (Oxlint)

`pnpm lint` で実行する。[oxlint.config.ts](packages/mobile/oxlint.config.ts) で Expo 公式の `oxlint-config-universe/native` プリセットを利用している。ESLint より高速だが以下の制約がある。

- フォーマット系ルール（改行・セミコロン等）は含まれない。整形は引き続き Prettier が担当する。
- `import/order` など一部の ESLint ルールは未実装（[oxlint-config-universe の README](https://github.com/expo/oxlint-config-universe) 参照）。
- 型を利用するルール（`no-floating-promises` 等）を使う場合は `oxlint-config-universe/typescript-analysis` を追加で `extends` し、type-aware linting を有効化する必要がある。

Lint で強制していない書き方の取り決め（エクスポート形式、ファイル名、import 順、型の書き方）は [docs/coding-guideline.md](docs/coding-guideline.md) にまとめている。

## Format (Prettier)

`pnpm format` で全パッケージをまとめて整形する。CI で検査するなら `pnpm run format:check`。

**設定はリポジトリルートの [.prettierrc.json](.prettierrc.json) 1 つに集約している。** パッケージごとに置くと prettier 本体が二重にインストールされ、整形コマンドも分裂するため。プラグインは対象で切り替える。

| 対象                                | プラグイン                                                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `packages/mobile` の `.ts` / `.tsx` | `prettier-plugin-tailwindcss`（`tailwindConfig` に mobile の設定を明示しないとカスタムカラーを解釈できない） |
| `.tsp`                              | `@typespec/prettier-plugin-typespec`                                                                         |

`printWidth` は 100。整形対象から外すものは [.prettierignore](.prettierignore) に書く。生成物（`openapi.yaml`、`src/generated/`、`schema.ts`）は手で編集しない方針なので整形もしない。

## CI とリリース

[.github/workflows/ci.yml](.github/workflows/ci.yml) が [dorny/paths-filter](https://github.com/dorny/paths-filter) で変更のあったパッケージを判定し、該当する再利用ワークフロー（`spec_ci` / `mobile_ci` / `server_ci`）だけを呼ぶ。**ブランチ保護の必須チェックには最後の `checks` ジョブだけを指定する**（スキップされたジョブを成功扱いにまとめている。個別ジョブを必須にすると、変更の無いパッケージがあるたびに保護が通らなくなる）。

- `spec_ci` — TypeSpec のコンパイルと、`openapi.yaml` の再生成差分チェック（生成物のコミット漏れを落とす）
- `mobile_ci` — `oxlint` と `tsc --noEmit`
- `server_ci` — `tsc --noEmit`

**Actions は必ず commit SHA で固定する**（社内ポリシー）。タグは付け替えられるため、バージョンはコメントで補う。

バージョンは [release-please](https://github.com/googleapis/release-please) が Conventional Commits から決める。`packages/mobile/package.json` の `version` が SoT で、[app.config.ts](packages/mobile/app.config.ts) がそれを読んで `expo.version` に入れる（`app.json` には書かない）。PR タイトルの形式は `lint-pr-title.yml` が検査する。

`release.yml` は GitHub App のトークンで動く。リポジトリの Secrets に `RELEASE_GITHUB_APP_CLIENT_ID` / `RELEASE_GITHUB_APP_PRIVATE_KEY` を登録しないと動かない（`GITHUB_TOKEN` で作った PR には他のワークフローが反応しないため、App を使っている）。

## 依存パッケージのバージョン管理

- Node / pnpm 自体のバージョンは [.mise.toml](.mise.toml) で固定する。CI も [jdx/mise-action](https://github.com/jdx/mise-action) で同じ版を使う
- パッケージのバージョンは `^` `~` を使わず固定（社内ポリシー）。更新は `pnpm add <pkg>@<version> --save-exact`
- リリースから 14 日以上経過したバージョンを採用する（社内ポリシー）。[pnpm-workspace.yaml](pnpm-workspace.yaml) の `minimumReleaseAge` で強制しており、違反すると `ERR_PNPM_NO_MATURE_MATCHING_VERSION` で落ちる。この設定は pnpm 10.16.0 以降でのみ機能するため、`packageManager` を下げないこと。Expo 関連が最新パッチではなくその時点で 14 日を満たす最新版に固定されているのはこのため。`expo start` が「更新があります」と表示するのは想定どおり
- lockfile (`pnpm-lock.yaml`) は必ずコミットする。CI は `pnpm install --frozen-lockfile`
- Expo が管理するパッケージのバージョン整合性は `pnpm exec expo install --check` で確認できる。`--fix` は最新パッチを取るため、実行後に 14 日ルールを満たすバージョンへ落とし直すこと
- 依存を大きく入れ替えた後は `rm -rf node_modules && pnpm install` でクリーンインストールする。pnpm は peer 依存の解決結果を残すため、古い解決が混ざるとネイティブモジュールが解決できず `TurboModuleRegistry.getEnforcing(...)` で起動に失敗することがある
