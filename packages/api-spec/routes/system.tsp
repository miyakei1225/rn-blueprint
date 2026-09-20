import "@typespec/http";
import "@typespec/openapi";
import "../models/error.tsp";
import "../models/health.tsp";

using TypeSpec.Http;
using TypeSpec.OpenAPI;

namespace RnBlueprint;

@route("/health")
@tag("system")
interface SystemController {
  @summary("ヘルスチェック")
  @operationId("getHealth")
  @get
  getHealth(): {
    @header contentType: "application/json";
    @body body: HealthResponse;
  };
}
