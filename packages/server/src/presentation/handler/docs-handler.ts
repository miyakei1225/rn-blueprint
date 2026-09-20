import { readFile } from "node:fs/promises";

import { swaggerUI } from "@hono/swagger-ui";
import { Hono } from "hono";

const SPEC_PATH = "/openapi.yaml";

// src/presentation/handler と dist/presentation/handler のどちらから見ても
// 5 つ上がリポジトリルート。cwd に依存させないため import.meta.url を基準にする。
const SPEC_FILE = new URL("../../../../../openapi.yaml", import.meta.url);

// 既定では latest を引く。破壊的変更でドキュメントが壊れないよう固定する。
const SWAGGER_UI_VERSION = "5.32.14";

export function newDocsHandler(): Hono {
  const app = new Hono();

  app.get(SPEC_PATH, async (c) =>
    c.body(await readFile(SPEC_FILE, "utf8"), 200, {
      "Content-Type": "application/yaml; charset=utf-8",
    }),
  );

  // 仕様に servers を書いていないので、Swagger UI は自身と同じオリジンを宛先にする。
  // ここが API 本体と同居しているおかげで Try it out がそのまま通る。
  app.get("/doc", swaggerUI({ url: SPEC_PATH, version: SWAGGER_UI_VERSION }));

  return app;
}
