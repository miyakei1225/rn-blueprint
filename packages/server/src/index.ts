import { serve } from "@hono/node-server";

import { newApp } from "./app.ts";
import { loadConfig } from "./config/config.ts";
import { closeDatabase, newDatabase, pingDatabase } from "./infra/db/db.ts";

const config = loadConfig();
const db = newDatabase(config.database);

// 設定ミスをリクエストが来る前に落とす
await pingDatabase(db);

const server = serve({ fetch: newApp(db, config).fetch, port: config.port }, (info) => {
  console.log(`Server listening on http://localhost:${info.port}`);
  if (config.docsEnabled) {
    console.log(`Swagger UI on http://localhost:${info.port}/doc`);
  }
});

// Cloud Run はインスタンス停止時に SIGTERM を送る。処理中の接続を返してから終わる。
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    server.close(() => {
      void closeDatabase(db);
    });
  });
}
