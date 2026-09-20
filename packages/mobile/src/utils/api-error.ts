/**
 * throwOnError を付けた場合、生成クライアントはレスポンスボディをそのまま throw する
 * (Error インスタンスではない)。サーバーは { code, message } の形でエラーを返す。
 */
function apiErrorCode(error: unknown): string | null {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return null;
  }

  const { code } = error as { code: unknown };
  return typeof code === "string" ? code : null;
}

export function isNotFoundError(error: unknown): boolean {
  return apiErrorCode(error) === "NOT_FOUND";
}

/** 状態のせいで実行できなかった場合（二重送信・競合など） */
export function isConflictError(error: unknown): boolean {
  return apiErrorCode(error) === "CONFLICT";
}
