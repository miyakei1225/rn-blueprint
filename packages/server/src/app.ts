import { Hono } from "hono";
import { cors } from "hono/cors";

import type { Config } from "./config/config.ts";
import type { Database } from "./infra/db/db.ts";
import { newHealthRepository } from "./infra/repository/health-repository-impl.ts";
import { newDocsHandler } from "./presentation/handler/docs-handler.ts";
import { handleError } from "./presentation/handler/errors.ts";
import { newSystemHandler } from "./presentation/handler/system-handler.ts";
// 認証ミドルウェアは導入時に有効化する。auth.ts のコメントを参照。
// import { newAuthMiddleware } from "./presentation/middleware/auth.ts";
import { newHealthUsecase } from "./usecase/health-usecase.ts";

/**
 * 依存の組み立てとルーティング。
 * ここが唯一「リポジトリの実装」を知っている場所で、上の層は契約の型しか見ない。
 *
 * 新しいリソースを追加する手順:
 *   1. src/domain/model/ にモデルを書く
 *   2. src/domain/repository/ に契約（型）を書く
 *   3. src/infra/repository/ に実装を書く
 *   4. src/usecase/ にユースケースを書く
 *   5. src/presentation/handler/ にハンドラを書く
 *   6. ここで依存を組み立て、app.route() で配線する
 */
export function newApp(db: Database, config: Config): Hono {
  // --- リポジトリの組み立て ---
  const healthRepository = newHealthRepository(db);

  // --- ユースケースの組み立て ---
  const healthUsecase = newHealthUsecase(healthRepository);

  // --- 認証ミドルウェアの組み立て（導入時に有効化する） ---
  // const requireAuth = newAuthMiddleware();

  const app = new Hono();

  // Web から叩けるように CORS を許可する。
  // 認証付きエンドポイントを足す段階で origin を絞ること。
  app.use("*", cors());

  app.route("/", newSystemHandler(healthUsecase));

  // 認証が必要なルートは requireAuth を渡す。
  // 例: app.route("/", newSomeHandler(someUsecase, requireAuth));

  if (config.docsEnabled) {
    app.route("/", newDocsHandler());
  }

  app.onError(handleError);
  app.notFound((c) => c.json({ code: "NOT_FOUND", message: "Endpoint not found" }, 404));

  return app;
}
