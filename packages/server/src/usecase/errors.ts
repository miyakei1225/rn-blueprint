/**
 * usecase が投げるエラー。presentation はこれを見て HTTP ステータスを決める。
 * pg や kysely のエラーをそのまま presentation まで伝播させないこと。
 *
 * 形式的な入力エラーは presentation で完結させて 400 を返すので、ここに来るのは
 * 「値の形は正しいが業務ルールに反する」ものだけ。
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/** 認証は通っているが、その操作を行う権限が無い */
export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

/** 対象の現在の状態では実行できない（二重登録・状態不一致など） */
export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}
