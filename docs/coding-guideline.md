# コーディング規約

Lint (oxlint) と Prettier で機械的に強制していない、レビューで揃える取り決めをまとめる。技術構成そのものは [TECH_STACK.md](../TECH_STACK.md) を参照。

## エクスポート

### 早見表

| 対象                                        | 形式                           | 例                                                                              |
| ------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------- |
| 画面 (`app/` 配下)                          | `export default function`      | [app/(tabs)/index.tsx](<../packages/mobile/src/app/(tabs)/index.tsx>)           |
| コンポーネント                              | `export function` (named)      | [components/themed-text.tsx](../packages/mobile/src/components/themed-text.tsx) |
| カスタムフック                              | `export function` (named)      | [hooks/useThemeColor.ts](../packages/mobile/src/hooks/useThemeColor.ts)         |
| ユーティリティ関数                          | `export function` (named)      | `utils/` 配下                                                                   |
| 定数・設定値・型                            | `export const` / `export type` | [constants/Colors.ts](../packages/mobile/src/constants/Colors.ts)               |
| HOC ・`memo`・`forwardRef` でラップしたもの | `export const`                 | —                                                                               |

**関数は `export function`（関数宣言）を既定とする。** アロー関数を `export const` に束縛する形は、上表の最後の 2 行に該当する場合のみ使う。

### 関数宣言を既定にする理由

- **巻き上げ（hoisting）** — ファイル内の定義順に依存しない。`export const` は TDZ があり、定義より前で参照するとランタイムエラーになる
- **ジェネリクス** — `.tsx` でアロー関数にジェネリクスを書くと JSX と構文が衝突し `<T,>` という回避記法が必要になる。関数宣言なら `function foo<T>(...)` と書ける
- **スタックトレース / React DevTools** — 常に関数名が付く。`export const` + 匿名アローは変数名からの推論に依存する

`export const` にアロー関数を束縛したくなるのは、左辺に型注釈を付けたい場合（`const Foo: React.FC<Props> = ...`）が多い。React 19 では `React.FC` を使わず props の型を引数に直接書く方針とし、関数宣言を選ぶ。

```tsx
// ○
export function Avatar({ name, size = "md" }: AvatarProps) { ... }

// ✗
export const Avatar: React.FC<AvatarProps> = ({ name, size = "md" }) => { ... };
```

ラッパーを適用する場合は、内側を名前付き関数にして DevTools の表示名を保つ。

```tsx
export const ListRow = memo(function ListRow({ item }: ListRowProps) { ... });
```

### default export は `app/` 配下だけ

Expo Router はファイルベースルーティングで各ルートに default export を要求するため、[app/](../packages/mobile/src/app/) 配下の画面のみ `export default function` を使う。それ以外のディレクトリでは default export を使わず named export に統一する。import 側で名前が固定され、リネームやシンボル検索が効くため。

## ファイル名

| 対象               | 形式                                     | 例                                                |
| ------------------ | ---------------------------------------- | ------------------------------------------------- |
| カスタムフック     | `useXxx.ts`（camelCase）                 | `hooks/useThemeColor.ts`                          |
| コンポーネント     | kebab-case のディレクトリ + 同名ファイル | `components/submit-button/submit-button.tsx`      |
| テスト             | 対象と同じディレクトリに `.test.tsx`     | `components/submit-button/submit-button.test.tsx` |
| その他のモジュール | kebab-case                               | `utils/format-date.ts` / `services/apiClient.ts`  |
| 画面 (`app/` 配下) | Expo Router のルーティング規約に従う     | `app/items/[id].tsx`                              |

PascalCase のファイル名は使わない。

コンポーネントのディレクトリ名・ファイル名は、エクスポートするシンボル名を kebab-case にしたものと一致させる（`SubmitButton` → `submit-button/submit-button.tsx`）。1 ファイルに複数のコンポーネントを置く場合は、主となるコンポーネント名をファイル名にする。

各コンポーネントディレクトリの `index.ts` は、そのコンポーネント 1 つを再エクスポートするだけにする。全部入りのバレルファイルを置かない理由は [directory-structure.md](directory-structure.md) の「components/」を参照。

## import

`@/*` エイリアスがアプリのソースルートを指す（実際のマッピングの SoT は [tsconfig.json](../packages/mobile/tsconfig.json) の `paths`）。同一ディレクトリ内の相対 import 以外はエイリアスを使う。

```tsx
import { ThemedText } from "@/components/themed-text";
```

`features/` の内部には `index.ts` を経由してアクセスする。依存の向きの制約は [directory-structure.md](directory-structure.md) の「features/」を参照。

```tsx
import { useAuth } from "@/features/auth"; // ○
import { useAuth } from "@/features/auth/hooks/useAuth"; // ✗ 公開境界を迂回している
```

`oxlint-config-universe/native` には `import/order` が含まれないため、import の並び順は機械的に矯正されない。既存ファイルに合わせて **「外部パッケージ → 空行 → `@/` からの内部モジュール」の 2 グループに分け、各グループ内はモジュール名のアルファベット順** で書く。

```tsx
import { useTranslation } from "react-i18next";
import { TouchableOpacity, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
```

`@react-navigation/*` は直接 import しない（`expo-router/react-navigation` を経由する）。理由は [TECH_STACK.md](../TECH_STACK.md) の「Expo Router と react-navigation」を参照。

## 型

- `interface` ではなく `type` を使う（宣言マージが必要な場合を除く）。props 型は `type XxxProps = { ... }` の形にする
- props 型はコンポーネントと同じファイルに置き、他ファイルから参照する必要が出た時点で export する
- 値の集合には `enum` ではなく `as const` オブジェクトかユニオン型を使う
- `src/generated/` は openapi-ts の生成物なので手で編集しない

## 文言

画面に出る文字列はコードに直書きせず、i18next のキー経由で出す。キーは [i18n/locales/ja.ts](../packages/mobile/src/i18n/locales/ja.ts) と [en.ts](../packages/mobile/src/i18n/locales/en.ts) の両方に同じ構造で追加する（片方だけに足すと、もう一方の言語でキー文字列がそのまま画面に出る）。
