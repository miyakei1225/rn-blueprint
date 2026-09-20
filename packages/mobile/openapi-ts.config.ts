import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  // packages/api-spec の TypeSpec が生成する。ルートで pnpm generate:api を実行すること。
  input: "../../openapi.yaml",
  output: {
    path: "./src/generated",
    format: "prettier",
  },
  plugins: [
    "@hey-api/typescript",
    {
      name: "@hey-api/sdk",
      client: "@hey-api/client-fetch",
    },
  ],
});
