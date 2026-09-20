/**
 * このファイルは kysely-codegen が生成する。手で編集しないこと。
 *
 * 再生成:
 *   pnpm --filter @rn-blueprint/server generate:schema
 *
 * DB にテーブルを追加したら db/sql/ に DDL を書いて DB に適用し、
 * 上記コマンドで schema.ts を上書きする。
 */

// テーブルが存在しない初期状態でも tsc --noEmit が通るよう、空の Database 型を置く。
// テーブルを追加すると kysely-codegen がここを上書きする。
export type DB = Record<string, never>;
