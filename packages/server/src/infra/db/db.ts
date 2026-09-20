import { Kysely, PostgresDialect, sql } from "kysely";
// pg は module.exports を動的に組み立てる CJS なので、ESM から名前付き import できない
// (cjs-module-lexer が解析できない)。default で受けてから分解する。
import pg from "pg";

import type { DatabaseConfig } from "../../config/config.ts";
import type { DB } from "./schema.ts";

export type Database = Kysely<DB>;

export function newDatabase(config: DatabaseConfig): Database {
  const pool = new pg.Pool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    max: config.maxPoolSize,
  });

  return new Kysely<DB>({ dialect: new PostgresDialect({ pool }) });
}

/** 疎通確認。設定ミスをリクエストが来る前に落とすため、起動時に 1 度呼ぶ。 */
export async function pingDatabase(db: Database): Promise<void> {
  await sql`SELECT 1`.execute(db);
}

export async function closeDatabase(db: Database): Promise<void> {
  await db.destroy();
}
