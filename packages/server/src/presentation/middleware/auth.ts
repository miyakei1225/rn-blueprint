/**
 * 認証ミドルウェアの雛形。
 *
 * このファイルは認証の導入先が決まった時点で実装する。
 * ブループリントは認証プロバイダを規定しないため、デフォルトでは未使用にしている。
 *
 * --- 導入手順 ---
 * 1. 認証プロバイダに合わせてこのファイルの `newAuthMiddleware` を実装する。
 * 2. app.ts で `requireAuth` を組み立て、認証が必要なルートに適用する。
 *    例: app.route("/", newSomeHandler(someUsecase, requireAuth));
 * 3. ハンドラ内で `c.get("userId")` によりリクエスト元の識別子を取り出す。
 *
 * --- Firebase Authentication を使う場合の参考実装 ---
 * hono/jwk を使って RS256 の ID トークンを検証し、sub を userId として設定する。
 * 公開鍵は Google のエンドポイントから Cache-Control に従ってキャッシュする。
 *
 * import type { MiddlewareHandler } from "hono";
 * import { every } from "hono/combine";
 * import { jwk } from "hono/jwk";
 *
 * const JWKS_URL =
 *   "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
 *
 * export type AuthVariables = { userId: string };
 *
 * export function newAuthMiddleware(projectId: string): MiddlewareHandler {
 *   const verifyToken = jwk({
 *     keys: () => fetch(JWKS_URL).then((r) => r.json()).then((b) => b.keys),
 *     alg: ["RS256"],
 *     verification: {
 *       iss: `https://securetoken.google.com/${projectId}`,
 *       aud: projectId,
 *     },
 *   });
 *   const setUserId: MiddlewareHandler = async (c, next) => {
 *     const sub = (c.get("jwtPayload") as { sub?: string })?.sub;
 *     if (!sub) return c.json({ code: "UNAUTHORIZED", message: "Token has no subject" }, 401);
 *     c.set("userId", sub);
 *     await next();
 *   };
 *   return every(verifyToken, setUserId);
 * }
 */

import type { MiddlewareHandler } from "hono";

/**
 * 認証が必要なルートに適用する変数の型。
 * ミドルウェアを実装したら、AuthVariables に実際のフィールドを追加する。
 */
export type AuthVariables = {
  /** 認証済みユーザーの識別子。ミドルウェアが設定する。 */
  userId: string;
};

/**
 * 認証ミドルウェアのファクトリ関数（雛形）。
 *
 * この実装は常に 401 を返す。実際の検証ロジックに置き換えて使う。
 * app.ts では requireAuth を生成しているが、ルートへの適用はコメントアウトしている。
 */
export function newAuthMiddleware(): MiddlewareHandler {
  return async (c, _next) => {
    // TODO: ここで認証トークンを検証し、c.set("userId", ...) を呼ぶ。
    // 検証に成功したら next() を呼んで次のハンドラに進む。
    return c.json(
      {
        code: "UNAUTHORIZED",
        message: "認証ミドルウェアが未実装です。auth.ts を参照してください。",
      },
      401,
    );
  };
}
