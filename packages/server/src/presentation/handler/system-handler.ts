import { Hono } from "hono";

import type { HealthUsecase } from "../../usecase/health-usecase.ts";

const startedAt = Date.now();

/**
 * システム系エンドポイント。openapi.yaml の `getHealth` に対応する。
 *
 * HealthUsecase を受け取ることで presentation → usecase → domain ← infra の
 * 全レイヤーが GET /health 1 本で縦に繋がる。
 * 新しいリソースを追加する際のハンドラ定義の書き方の見本になっている。
 */
export function newSystemHandler(healthUsecase: HealthUsecase): Hono {
  const app = new Hono();

  /**
   * ヘルスチェック。
   *
   * Cloud Run のスタートアップ / liveness プローブから叩かれる。
   * DB の疎通結果も含めて返すが、DB が落ちても 200 で返す。
   * DB 障害のたびにインスタンスが再起動ループに入るのを避けるため、
   * プローブの観点では「プロセスが動いているか」だけを見る。
   */
  app.get("/health", async (c) => {
    const status = await healthUsecase.check();
    return c.json({
      status: status.ok ? "ok" : "error",
      dbReachable: status.dbReachable,
      // K_REVISION は Cloud Run が注入するリビジョン名。ローカルでは未定義。
      revision: process.env.K_REVISION ?? "local",
      uptime: (Date.now() - startedAt) / 1000,
    });
  });

  return app;
}
