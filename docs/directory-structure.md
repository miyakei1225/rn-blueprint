# ディレクトリ構成

`packages/mobile` の内部構成と、どこに何を置くかの判断基準をまとめる。ファイル名・エクスポート形式の細目は [coding-guideline.md](coding-guideline.md)、モノレポ全体の構成は [TECH_STACK.md](../TECH_STACK.md) を参照。

```
packages/mobile/
└── src/
    ├── app/                    Expo Router のファイルベースルーティング
    │   ├── (tabs)/             ボトムタブの画面グループ
    │   │   ├── index.tsx
    │   │   └── settings.tsx
    │   ├── _layout.tsx         ルートレイアウト (Provider の配置)
    │   └── +not-found.tsx
    │
    ├── components/             アプリ全体で共有する汎用 UI
    │   └── button/
    │       ├── button.tsx
    │       ├── button.test.tsx
    │       └── index.ts
    │
    ├── features/               機能・ドメインごとのカプセル化
    │   └── <機能名>/
    │       ├── components/     この機能でだけ使う UI
    │       ├── hooks/          この機能でだけ使うフック
    │       ├── api/            この機能でだけ使う API 呼び出し
    │       └── index.ts        外部への公開境界
    │
    ├── hooks/                  アプリ全体で共有する汎用フック
    ├── constants/              アプリ共通の定数・設定
    ├── services/               画面から独立した外部連携 (API クライアント、ストレージ、通知)
    ├── lib/                    ライブラリの初期化 (queryClient.ts など)
    ├── types/                  アプリ全体で共有する型定義
    ├── utils/                  純粋なヘルパー関数 (React / ネイティブに依存しない)
    ├── i18n/                   i18next の初期化と locales/{ja,en}.ts
    ├── generated/              openapi-ts の生成物 (手で編集しない)
    └── global.css              NativeWind のエントリ (metro.config.js が参照)
```

`packages/mobile` 直下に残すのは設定ファイルと生成物だけ（`app.json` `app.config.ts` `eas.json` `babel.config.js` `metro.config.js` `tailwind.config.js` `tsconfig.json` `oxlint.config.ts` `openapi-ts.config.ts` `package.json` `assets/` `scripts/`）。アプリのソースはすべて `src/` に入れる。

`@/*` エイリアスはこのソースルートを指す。`import { ThemedText } from "@/components/themed-text"` のように書く。実際のマッピングの SoT は [packages/mobile/tsconfig.json](../packages/mobile/tsconfig.json) の `paths` で、NativeWind のクラス抽出範囲は [tailwind.config.js](../packages/mobile/tailwind.config.js) の `content` が持つ。`content` は `./src/**` を広く見るようにしてあるので、`src/` 配下にディレクトリを増やす分には追従不要。

## 置き場所の判断

新しいコードをどこに置くかは、上から順に判定する。

1. **画面そのものか** → `app/`。画面コンポーネントは Expo Router のルーティング規約に従う
2. **特定の機能でしか使わないか** → `features/<機能名>/` の配下。UI なら `components/`、状態やロジックなら `hooks/`、通信なら `api/`
3. **React に依存しない純粋な関数か** → `utils/`
4. **画面から独立した外部連携か**（HTTP クライアント、ローカルストレージ、プッシュ通知など） → `services/`
5. **上記以外で複数機能から使う UI / フック / 定数 / 型か** → `components/` `hooks/` `constants/` `types/`

迷ったら **`features/` に置く。** 汎用に見えて実は 1 機能専用だったものを後から `features/` に移すより、2 つ目の利用箇所が現れた時点で共有層に引き上げるほうが安全。

## features/

1 機能を 1 ディレクトリに閉じ込め、外から触れる範囲を `index.ts` に明示する。

```ts
// features/auth/index.ts — 公開するものだけを並べる
export { LoginForm } from "./components/login-form";
export { useAuth } from "./hooks/useAuth";
```

守るルール。

- **`features/<機能>/index.ts` を経由せずに内部へ直接 import しない。** `@/features/auth/hooks/useAuth` ではなく `@/features/auth` から取る
- **`features/` 同士を直接 import しない。** 依存が必要になったら、共有部分を `components/` `hooks/` `utils/` に引き上げるか、呼び出し側の `app/` で組み合わせる
- 依存の向きは **`app/` → `features/` → `components/` `hooks/` `services/` `utils/` `types/`** の一方向。逆流させない（`components/` から `features/` を参照しない）

## components/

1 コンポーネント 1 ディレクトリとし、テストを同居させる。

```
components/submit-button/
├── submit-button.tsx        本体
├── submit-button.test.tsx   テスト
└── index.ts                 export { SubmitButton } from "./submit-button";
```

ディレクトリ名・ファイル名はエクスポートするシンボル名を kebab-case にしたものに揃える（`SubmitButton` → `submit-button/`）。単一ファイルで収まるうちは `components/themed-text.tsx` のようにディレクトリを作らなくてもよいが、テストや補助ファイルが増えた時点でディレクトリに切り出す。

`index.ts` は**そのコンポーネント 1 つを再エクスポートするだけ**にする。`components/index.ts` のような全部入りのバレルファイルは置かない。Metro は tree-shaking が弱く、バレル経由の import は実際には使っていないモジュールまで評価対象に引き込むため、バンドルサイズと起動時間に効いてくる。`features/<機能>/index.ts` は公開境界として必要なので例外とする。

ビジネスロジックを持たせない。API を叩く、グローバルな状態を読む、といった処理が必要になった時点で、そのコンポーネントは `features/` に属している。

## generated/

`openapi.yaml` から `pnpm generate:api` で生成される。**手で編集しない。** 詳細は [TECH_STACK.md](../TECH_STACK.md) の「API クライアント」を参照。
