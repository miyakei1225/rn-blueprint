import { sql } from "kysely";

import type { HealthRepository } from "../../domain/repository/health-repository.ts";
import type { Database } from "../db/db.ts";

/**
 * HealthRepository の実装。
 *
 * 「行 → ドメインモデルの変換」という責務がここにある。
 * DB の都合（snake_case のカラム名など）をこの層の外に漏らさない。
 *
 * ファクトリ関数で作り、戻り値を契約側の型にする。
 * これにより呼び出し側（app.ts）は実装の存在を知らないまま組み立てられる。
 */
export function newHealthRepository(db: Database): HealthRepository {
  return {
    async ping(): Promise<boolean> {
      try {
        await sql`SELECT 1`.execute(db);
        return true;
      } catch {
        return false;
      }
    },
  };
}
