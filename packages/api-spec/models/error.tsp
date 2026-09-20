import "@typespec/http";

using TypeSpec.Http;

namespace RnBlueprint;

model Error {
  @example("NOT_FOUND")
  code: string;

  message: string;
}

@error
model ErrorResponse<Status> is Response<Status> {
  @header contentType: "application/json";
  @body body: Error;
}

@doc("リクエストが不正")
model BadRequestError is ErrorResponse<400>;

@doc("ID トークンが無い、または検証に失敗した")
model UnauthorizedError is ErrorResponse<401>;

@doc("認証は通っているが、その操作を行う権限が無い")
model ForbiddenError is ErrorResponse<403>;

@doc("対象が存在しない")
model NotFoundError is ErrorResponse<404>;

@doc("対象の現在の状態では実行できない")
model ConflictError is ErrorResponse<409>;
