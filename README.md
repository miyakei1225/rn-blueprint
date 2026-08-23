# rn-blueprint

新規 React Native (Expo) アプリを作る際のスケルトンリポジトリ。

## 技術スタック

- [Expo](https://docs.expo.dev/) (SDK 57) + [Expo Router](https://docs.expo.dev/router/introduction/) — ファイルベースルーティング
- React Native 0.86 / React 19.2 (New Architecture / bridgeless)
- TypeScript (strict)
- Native Tabs + [expo-glass-effect](https://docs.expo.dev/versions/latest/sdk/glass-effect/) — iOS 26 の Liquid Glass 対応
- [NativeWind](https://www.nativewind.dev/) (Tailwind CSS)
- [TanStack Query](https://tanstack.com/query) + [@hey-api/openapi-ts](https://heyapi.dev/) — OpenAPI 仕様から型付き API クライアントを自動生成
- [i18next](https://www.i18next.com/) / react-i18next — ja / en 切り替え
- Lint: [Oxlint](https://oxc.rs/) (`oxlint-config-universe/native`) / Format: Prettier (`prettier-plugin-tailwindcss`)
- パッケージマネージャ: **pnpm** (`packageManager` フィールドで固定)

## ディレクトリ構成

```
app/                expo-router の画面 (app/(tabs) がタブ画面)
components/         テーマ対応の共通コンポーネント (glass-card.tsx は Liquid Glass 表面)
hooks/               カスタムフック
constants/          Colors などの定数
services/           apiClient.ts (API 疎通)
lib/                queryClient.ts などライブラリ初期化
i18n/                i18next 初期化 + locales/{ja,en}.ts
src/generated/      openapi-ts が生成する API クライアント (コミット対象、手で編集しない)
openapi.yaml        API クライアント生成用の仕様 (プレースホルダー)
```

新しい画面は `app/` 配下に、再利用可能な UI は `components/`、データ取得ロジックは `hooks/` + `services/` に置く方針。

## セットアップ

```bash
pnpm install
```

環境変数ファイルを作成する（`.env` 系ファイルはこのツールから直接作成できなかったため、以下の内容で手動作成すること）:

```bash
# .env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

`.gitignore` は `pnpm install` 実行時に `node_modules` のみの最小内容で自動生成される。`gitignore.txt` に用意した内容で上書きすること（`mv gitignore.txt .gitignore` で反映できる）。

```bash
pnpm start        # Expo Dev Server
pnpm ios          # iOS シミュレータ (ネイティブビルド)
pnpm android      # Android エミュレータ (ネイティブビルド)
pnpm web          # Web
pnpm lint         # Oxlint
pnpm generate:api # openapi.yaml から src/generated/ を再生成
```

現状の依存はネイティブモジュールを含まないため、`pnpm start` + Expo Go だけで iOS / Android の動作確認ができる。Expo Go は **プロジェクトの SDK と同じメジャーバージョン** が必要（SDK 57 なら Expo Go 57.x）。バージョンが合わないと `Project is incompatible with this version of Expo Go` で起動しない。`pnpm start` に `--ios` を付けると Expo CLI が適切な版のインストールを促す。

## 動作確認済みの状態

iPhone 17 Pro (iOS 26.2, Expo Go 57.0.9) と Web の両方で起動を確認済み。タブ遷移、i18n の ja / en 切り替え、NativeWind のスタイル適用、API 未接続時のエラー表示、iOS 26 の Liquid Glass 表示までが動作する。

## Liquid Glass (iOS 26)

タブバーは `expo-router/unstable-native-tabs` の `NativeTabs` を使っている。ネイティブのタブバー (iOS では `UITabBarController`) をそのまま使うため、iOS 26 以降では OS 標準の Liquid Glass タブバーになる。react-navigation のタブ (`Tabs`) は JS 描画なので Liquid Glass にはならない。

```tsx
// app/(tabs)/_layout.tsx
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

タブバー以外のガラス表面には `components/glass-card.tsx` を使う。`expo-glass-effect` の `GlassView` をラップし、`isLiquidGlassAvailable()` が false になる環境 (Android / Web / iOS 25 以下) では半透明の背景にフォールバックする。

Liquid Glass の見た目を確認するには **iOS 26 以降のシミュレータ** が必要（`xcrun simctl list devices available` で確認）。iOS 25 以下では従来のタブバーとして描画されるだけで、エラーにはならない。

## API クライアントの差し替え

1. `openapi.yaml` を実際のバックエンドの OpenAPI 仕様に置き換える（別リポジトリで管理している場合は `openapi-ts.config.ts` の `input` をそのパス/URL に変更）。
2. `pnpm generate:api` で `src/generated/` を再生成。
3. `services/apiClient.ts` の `baseUrl` 設定・認証ヘッダー付与処理を必要に応じて追加。
4. `hooks/useHealthCheck.ts` を参考に、生成された SDK 関数を `useQuery` / `useMutation` でラップしたフックを追加していく。

生成 SDK の関数は既定で失敗時に throw せず `{ data: undefined, error }` を返す。`useQuery` の `queryFn` から呼ぶ場合は `getHealth({ throwOnError: true })` のように `throwOnError` を指定すること。指定しないと `data` が `undefined` のまま返り、TanStack Query が「queryFn が undefined を返した」とエラーにする。

## Firebase を使う場合

`@react-native-firebase/*` は現在依存に含めていない。ネイティブモジュールのため Expo Go では動かず、導入すると開発時も毎回ネイティブビルドが必要になるため、実際に必要になった時点で追加する方針。

1. `pnpm add --save-exact @react-native-firebase/app@<version> @react-native-firebase/auth@<version> @react-native-firebase/analytics@<version>`
2. Firebase コンソールでアプリを追加し、`GoogleService-Info.plist` (iOS) / `google-services.json` (Android) をリポジトリ直下に配置する（`.gitignore` 済み）。
3. `app.json` の `ios.googleServicesFile` / `android.googleServicesFile` と `plugins` に `@react-native-firebase/app` を追加する。
4. `pnpm ios` / `pnpm android` でネイティブビルドを作る（Expo Go では起動できない）。

## Expo Router と react-navigation

SDK 56 以降、expo-router は react-navigation を内部にフォークして同梱しており、アプリコードから `@react-navigation/*` を直接 import できない（起動時に非互換エラーになる）。テーマなど react-navigation 由来の API は `expo-router/react-navigation` から import する。

```tsx
import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router/react-navigation";
```

移行の詳細は [SDK 55 → 56 の移行ガイド](https://docs.expo.dev/router/migrate/sdk-55-to-56/) を参照。

## NativeWind と pnpm

`react-native-css-interop` を直接 dependencies に入れている。NativeWind は Babel 変換でアプリコードに `react-native-css-interop/jsx-runtime` への import を注入するが、pnpm の既定 (isolated node_modules) ではプロジェクトルートから解決できずバンドルが失敗するため。NativeWind を更新する際は `react-native-css-interop` も同じ組み合わせのバージョンに揃えること（NativeWind の `dependencies` が固定バージョンで指定している）。

## Lint (Oxlint)

`oxlint.config.ts` で Expo 公式の `oxlint-config-universe/native` プリセットを利用している。ESLint より高速だが以下の制約がある。

- フォーマット系ルール（改行・セミコロン等）は含まれない。整形は引き続き Prettier が担当する。
- `import/order` など一部の ESLint ルールは未実装（[oxlint-config-universe の README](https://github.com/expo/oxlint-config-universe) 参照）。
- 型を利用するルール（`no-floating-promises` 等）を使う場合は `oxlint-config-universe/typescript-analysis` を追加で `extends` し、type-aware linting を有効化する必要がある。

## 依存パッケージのバージョン管理

- バージョンは `^` `~` を使わず固定（社内ポリシーに準拠）。
- 更新時は `pnpm add <pkg>@<version> --save-exact` を使うこと。
- リリースから 14 日以上経過したバージョンを採用する（社内ポリシー）。このため Expo 関連は最新パッチではなく、その時点で 14 日を満たす最新版に固定している。`expo start` が「更新があります」と表示するのは想定どおり。
- Expo が管理するパッケージのバージョン整合性は `pnpm exec expo install --check` で確認できる。`--fix` は最新パッチを取るため、実行後に 14 日ルールを満たすバージョンへ落とし直すこと。
- 依存を大きく入れ替えた後は `rm -rf node_modules && pnpm install` でクリーンインストールする。pnpm は peer 依存の解決結果を残すため、古い解決が混ざるとネイティブモジュールが解決できず `TurboModuleRegistry.getEnforcing(...)` で起動に失敗することがある。
