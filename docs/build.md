# ビルド手順

環境ごとのビルド方法とコマンドをまとめる。技術構成そのものは [TECH_STACK.md](../TECH_STACK.md) を参照。

## 早見表

| 用途                                        | コマンド                                         | 出力               | 単体起動                 |
| ------------------------------------------- | ------------------------------------------------ | ------------------ | ------------------------ |
| ローカル開発（シミュレータ / エミュレータ） | `pnpm ios` / `pnpm android`                      | 端末にインストール | ✗ Metro 必須（自動起動） |
| ローカル開発（Web）                         | `pnpm web`                                       | ブラウザ           | ✗ Metro 必須             |
| ローカルで本番相当の動作確認                | `pnpm exec expo run:ios --configuration Release` | 端末にインストール | ○                        |
| 配布用の開発ビルド                          | `eas build --profile development`                | `.ipa` / `.apk`    | ✗ Metro 必須             |
| 社内・レビュー配布                          | `eas build --profile preview`                    | `.ipa` / `.apk`    | ○                        |
| ストア提出                                  | `eas build --profile production`                 | `.ipa` / `.aab`    | ○                        |

**単体起動 ✗ のビルドは JS バンドルを同梱せず、起動時に開発サーバー (Metro) から取得する。** サーバーに繋がっていない場合は dev launcher の画面が表示され、アプリ本体は起動しない。詳細は [トラブルシュート](#トラブルシュート) を参照。

## 前提

```bash
mise install    # Node / pnpm を .mise.toml のバージョンに揃える
pnpm install    # リポジトリルートで 1 回
```

### コマンドを実行する場所

pnpm workspace のモノレポなので、コマンドによって実行場所が変わる。

| コマンド                                                | 実行場所                                                                           |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `pnpm install`                                          | リポジトリルート（workspace 全体を 1 つの lockfile で解決する）                    |
| `pnpm ios` / `pnpm android` / `pnpm web` / `pnpm start` | ルート（`packages/mobile` に委譲される）                                           |
| `pnpm exec expo ...` / `eas ...`                        | **`packages/mobile`**（Expo はカレントディレクトリをプロジェクトルートとして扱う） |
| `pnpm run dev:server`                                   | ルート（`packages/server` に委譲される）                                           |

ルートから直接呼びたい場合は `pnpm --filter @rn-blueprint/mobile exec expo ...` と書く。

なお **Expo 側は Docker 管理していない。** ネイティブビルドには Xcode / Android SDK が必要で、コンテナ化する利点がないため。リポジトリルートの `Dockerfile` は `packages/server` 専用。

### 環境変数

`packages/mobile/.env` に置く（`EXPO_PUBLIC_` プレフィックス付きのみクライアントに埋め込まれる）。

```bash
# packages/mobile/.env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

ローカルのネイティブビルドには追加で以下が必要。

- iOS: Xcode（iOS 26 以降のシミュレータで Liquid Glass を確認できる。`xcrun simctl list devices available` で確認）
- Android: Android Studio + JDK 17

## EAS ビルド

プロファイルの定義は [packages/mobile/eas.json](../packages/mobile/eas.json)。EAS CLI はグローバルインストールせず、一時実行する。

```bash
cd packages/mobile
pnpm dlx eas-cli@<version> build --profile preview --platform ios
```

初回は `eas init` で EAS プロジェクトを作り、払い出された projectId を `EAS_PROJECT_ID` として渡す（[app.config.ts](../packages/mobile/app.config.ts) が `extra.eas.projectId` と OTA 更新の配信先 URL に使う）。

| プロファイル  | 用途                     | JS バンドル | 配信チャンネル |
| ------------- | ------------------------ | ----------- | -------------- |
| `development` | 実機・シミュレータで開発 | Metro から  | —              |
| `preview`     | 社内配布・レビュー       | 同梱        | `preview`      |
| `production`  | ストア提出               | 同梱        | `production`   |

## 注意点

### EAS ビルドには `.env` が渡らない

`.env` はコミットしていないため EAS のビルドマシンには存在せず、フォールバックの `http://localhost:3000` が焼き込まれる。実機からは到達できないアドレスになる。

接続先はプロファイルごとに EAS の環境変数として登録する。

```bash
cd packages/mobile
pnpm dlx eas-cli@<version> env:list --environment preview
pnpm dlx eas-cli@<version> env:set --name EXPO_PUBLIC_API_URL --value <URL> --type string \
  --visibility plaintext --scope project --environment preview
```

`eas.json` の `env` に直書きもできるが、値がリポジトリに残るので EAS 側への登録を優先する。**`EXPO_PUBLIC_` 付きの値はクライアントバンドルに平文で埋め込まれるため、API キー等の秘密情報をこの経路で渡してはいけない**（`secret` 可視性で登録しても同じ。バンドルに入る）。

### `babel.config.js` に足すパッケージは `package.json` にも宣言する

Babel はプリセット / プラグインを Expo プロジェクトルート（`packages/mobile`）起点で解決する。`nodeLinker: hoisted` のおかげで推移的依存も偶然解決できてしまうことがあるが、ホイスティングの結果に依存する形になり、依存構成が変わった途端に **クリーン環境の EAS ビルドだけが失敗する。**

### ネイティブ設定は `app.json` / config plugin で管理する

**`ios/` `android/` はコミットしない。** ネイティブ設定の SoT は [app.json](../packages/mobile/app.json) と config plugin であり、`ios/` `android/` はそこから `expo prebuild` で生成される成果物として扱う（CNG / Continuous Native Generation）。EAS ビルドではクラウド側で prebuild が走る。

ネイティブ設定を変えるときは `ios/` を直接編集せず、`app.json` の `ios` / `android` / `plugins` を編集してから再生成する。

```bash
cd packages/mobile
rm -rf ios && pnpm exec expo prebuild --platform ios --clean
```

`ios/` をコミットすると以下の問題が起きる。

- EAS が `ios/` を検出して bare workflow として扱うため、`app.json` の `ios.bundleIdentifier` が無視される
- `ios/.xcode.env.local` にローカルマシンの Node の絶対パスが書かれており、それが混入する
- `ios/Pods` `ios/build` を含めると 1GB を超える

### Expo Go では起動しない

`expo-dev-client` と `react-native-keyboard-controller` を依存に含むため、Expo Go では動かない。開発ビルド（`pnpm ios` / `pnpm android`、または EAS の `development` プロファイル）を使う。Web (`pnpm web`) はネイティブビルド不要で動く。

ネイティブモジュールを一切使わない構成に戻したい場合は、`expo-dev-client` `expo-updates` `react-native-keyboard-controller` を外せば Expo Go でも起動できる。

### 型定義の生成

[tsconfig.json](../packages/mobile/tsconfig.json) の `include` に `.expo/types/**/*.ts` が入っているため、クリーンな clone 直後は typed routes の型定義が存在しない。`pnpm start` を一度走らせると生成される。

## トラブルシュート

### 起動すると「ホーム / アップデート / 設定」の 3 タブが出る

アプリの画面ではなく **dev launcher（`expo-dev-client`）の画面**。JS バンドルを取得する開発サーバーが見つかっていない状態。

- 開発中: 別ターミナルで `pnpm start` を実行し、launcher の「ホーム」タブに表示されるサーバー（`http://<PC の IP>:8081`）をタップする。あるいは `pnpm ios` で起動し直す
- 単体で動かしたい: `preview` プロファイルでビルドする

### EAS ビルドが `Cannot read properties of undefined (reading 'transformFile')` で失敗する

Xcode Logs の実際のエラーは `Failed to construct transformer: Error: Cannot find module '<パッケージ名>'`。Babel のプリセット / プラグインの解決に失敗して Metro の `Transformer` の生成が失敗し、その後 `Bundler._transformer` が `undefined` のまま参照されて表面化したもの。**表示されるエラーメッセージは原因を示していないので、Xcode Logs を末尾まで確認すること。**

原因は、`babel.config.js` が参照しているパッケージが `packages/mobile/package.json` に宣言されていないこと。ローカルの `pnpm ios` では再現しないことがある（pnpm がキャッシュした過去の node_modules レイアウトで解決できてしまうため）。確実な判定方法は、プロジェクトルートからの解決を直接試すこと。

```bash
cd packages/mobile
node -e "for (const id of ['babel-preset-expo','nativewind/babel','react-native-reanimated/plugin']) { try { require.resolve(id, { paths: [process.cwd()] }); console.log('OK  ', id) } catch { console.log('NG  ', id) } }"
```

`NG` が出たパッケージを `devDependencies` に追加する。バージョンは `expo` が要求するレンジ内から、14 日ルールを満たすものを固定で指定する。

### `TurboModuleRegistry.getEnforcing(...)` で起動に失敗する

依存を入れ替えた後に pnpm の古い peer 依存解決が残っているケース。クリーンインストールする。

```bash
# リポジトリルートで
rm -rf node_modules packages/*/node_modules && pnpm install
```

### Metro のキャッシュが原因と思われる不具合

```bash
pnpm start --clear
```

### 接続先が前回のビルドのまま変わらない

`EXPO_PUBLIC_` 付きの変数は Babel がバンドル時にリテラルへ展開するが、**Metro の変換キャッシュはその値の変化を拾わないことがある。** プロファイルを跨いでローカルビルドすると、直前のビルドの URL がそのまま焼き込まれる。接続先を切り替えたときは `--clear` を付けること（EAS のビルドマシンは毎回クリーンなのでこの問題は起きない）。

```bash
pnpm exec expo export --clear     # または pnpm start --clear
```

おかしいと思ったら成果物を直接確認するのが早い。

```bash
grep -rho 'setConfig({baseUrl:"[^"]*"' <出力先>/_expo/static/js
```

### iOS のネイティブビルドが通らない

```bash
cd packages/mobile
rm -rf ios && pnpm exec expo prebuild --platform ios --clean
pnpm ios
```
