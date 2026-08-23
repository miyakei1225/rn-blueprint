import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "./openapi.yaml",
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
