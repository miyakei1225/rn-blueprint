export type DatabaseConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  maxPoolSize: number;
};

export type Config = {
  port: number;
  docsEnabled: boolean;
  database: DatabaseConfig;
};

function required(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(`environment variable ${name} is required`);
  }
  return value;
}

function booleanOr(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw === "") {
    return fallback;
  }
  if (raw !== "true" && raw !== "false") {
    throw new Error(`environment variable ${name} must be "true" or "false", got: ${raw}`);
  }
  return raw === "true";
}

function positiveIntOr(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") {
    return fallback;
  }
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`environment variable ${name} must be a positive integer, got: ${raw}`);
  }
  return parsed;
}

function loadDatabaseConfig(): DatabaseConfig {
  // INSTANCE_CONNECTION_NAME が設定されている場合は Cloud SQL の Unix ソケット経由で接続する。
  // `gcloud run deploy --add-cloudsql-instances` を付けると /cloudsql/<接続名> にソケットが生える。
  // pg はホスト名が `/` で始まるとソケットとして扱うため、プロキシのサイドカーは不要。
  const instanceConnectionName = process.env.INSTANCE_CONNECTION_NAME;
  const host =
    instanceConnectionName !== undefined && instanceConnectionName !== ""
      ? `/cloudsql/${instanceConnectionName}`
      : (process.env.DB_HOST ?? "localhost");

  return {
    host,
    port: positiveIntOr("DB_PORT", 5432),
    user: required("DB_USER"),
    password: required("DB_PASSWORD"),
    database: required("DB_NAME"),
    // Cloud Run は 1 インスタンスに同時実行数の上限までリクエストを詰める。
    // max-instances × この値が Cloud SQL の最大接続数を超えないこと。
    maxPoolSize: positiveIntOr("DB_MAX_POOL_SIZE", 5),
  };
}

export function loadConfig(): Config {
  return {
    // Cloud Run は PORT を注入する。ローカルは 3000。
    port: positiveIntOr("PORT", 3000),
    docsEnabled: booleanOr("DOCS_ENABLED", process.env.NODE_ENV !== "production"),
    database: loadDatabaseConfig(),
  };
}
