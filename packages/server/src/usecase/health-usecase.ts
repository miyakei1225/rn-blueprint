import type { HealthStatus } from "../domain/model/health.ts";
import type { HealthRepository } from "../domain/repository/health-repository.ts";

/**
 * ヘルスチェックのユースケース。
 *
 * 「1 つのユースケース = 1 メソッド」を基本とする。
 * リポジトリを組み合わせ、必要ならトランザクション境界を張るのがこの層の役割。
 * pg や kysely の型を引数・戻り値に出さない（依存が漏れるサイン）。
 */
export type HealthUsecase = {
  check(): Promise<HealthStatus>;
};

export function newHealthUsecase(healthRepository: HealthRepository): HealthUsecase {
  return {
    async check(): Promise<HealthStatus> {
      const dbReachable = await healthRepository.ping();
      return { ok: true, dbReachable };
    },
  };
}
