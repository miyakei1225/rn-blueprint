import "@typespec/http";
import "@typespec/openapi";
import "./routes/system.tsp";

using TypeSpec.Http;
using TypeSpec.OpenAPI;

@service(#{ title: "rn-blueprint API" })
@info(#{ version: "0.1.0" })
@doc("""
  `packages/server` の実装に対応する仕様。
  
  リポジトリルートの openapi.yaml は packages/api-spec の .tsp から生成している。
  手で編集せず、.tsp を直して `pnpm generate:api` を実行すること。
  
  ローカルは `pnpm run dev:server` で http://localhost:3000 に立つ。
  接続先はアプリ側の EXPO_PUBLIC_API_URL で指定するため、
  ここに servers を書かない (生成クライアントに既定 baseUrl が焼き込まれ、
  apiClient.ts を経由し忘れたときに別ホストへ黙って飛ぶため)。
  """)
namespace RnBlueprint;
