import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";

import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../../usecase/errors.ts";

/**
 * usecase のエラーを HTTP に落とす唯一の場所。
 * 想定外のエラーは中身を返さない（SQL のエラーメッセージが外に出るのを防ぐ）。
 *
 * 新しい usecase エラーを追加したら、ここと usecase/errors.ts の両方に足す。
 */
export function handleError(err: Error, c: Context): Response {
  if (err instanceof ValidationError) {
    return c.json({ code: "BAD_REQUEST", message: err.message }, 400);
  }

  if (err instanceof ForbiddenError) {
    return c.json({ code: "FORBIDDEN", message: err.message }, 403);
  }

  if (err instanceof NotFoundError) {
    return c.json({ code: "NOT_FOUND", message: err.message }, 404);
  }

  if (err instanceof ConflictError) {
    return c.json({ code: "CONFLICT", message: err.message }, 409);
  }

  // 認証ミドルウェアは 401 を HTTPException で投げる。ここで拾わないと 500 に化ける。
  // ステータスと WWW-Authenticate は元のまま、ボディだけ openapi.yaml の Error の形に揃える。
  if (err instanceof HTTPException) {
    const response = c.json(
      { code: err.status === 401 ? "UNAUTHORIZED" : "ERROR", message: err.message },
      err.status,
    );
    const challenge = err.getResponse().headers.get("WWW-Authenticate");
    if (challenge !== null) {
      response.headers.set("WWW-Authenticate", challenge);
    }
    return response;
  }

  console.error(err);
  return c.json({ code: "INTERNAL_ERROR", message: "Internal server error" }, 500);
}
