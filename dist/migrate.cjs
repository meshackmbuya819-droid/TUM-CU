"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// backend/src/database/migrate.ts
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
var import_promise = __toESM(require("mysql2/promise"));

// backend/src/config/env.ts
var import_dotenv = __toESM(require("dotenv"));
var import_zod = require("zod");
import_dotenv.default.config();
var envSchema = import_zod.z.object({
  NODE_ENV: import_zod.z.enum(["development", "test", "production"]).default("development"),
  PORT: import_zod.z.coerce.number().default(3e3),
  API_PREFIX: import_zod.z.string().default("/api/v1"),
  DB_HOST: import_zod.z.string().default("localhost"),
  DB_PORT: import_zod.z.coerce.number().default(3306),
  DB_USER: import_zod.z.string().default("tecump"),
  DB_PASSWORD: import_zod.z.string().default(""),
  DB_NAME: import_zod.z.string().default("tecump"),
  DB_CONNECTION_LIMIT: import_zod.z.coerce.number().default(10),
  DB_QUEUE_LIMIT: import_zod.z.coerce.number().default(100),
  DB_CONNECT_TIMEOUT_MS: import_zod.z.coerce.number().default(1e4),
  DB_IDLE_TIMEOUT_MS: import_zod.z.coerce.number().default(6e4),
  REDIS_URL: import_zod.z.string().default("redis://localhost:6379"),
  JWT_ACCESS_SECRET: import_zod.z.string().default("tumcu-tecump-jwt-access-secret-32-chars-long-secure-key"),
  JWT_REFRESH_SECRET: import_zod.z.string().default("tumcu-tecump-jwt-refresh-secret-32-chars-long-secure-key"),
  JWT_ACCESS_EXPIRES_IN: import_zod.z.string().default("24h"),
  JWT_REFRESH_EXPIRES_IN: import_zod.z.string().default("30d"),
  AUTH_COOKIE_NAME: import_zod.z.string().default("tecump_refresh"),
  AUTH_COOKIE_SECURE: import_zod.z.coerce.boolean().default(false),
  AUTH_COOKIE_SAME_SITE: import_zod.z.enum(["lax", "strict", "none"]).default("lax"),
  CORS_ORIGIN: import_zod.z.string().default("http://localhost:3000,http://localhost:5173,*"),
  RATE_LIMIT_WINDOW_MS: import_zod.z.coerce.number().default(9e5),
  RATE_LIMIT_MAX: import_zod.z.coerce.number().default(3e3),
  // All optional: if SMTP_HOST is unset, the notification dispatcher logs
  // emails to the console instead of sending them — safe default for local
  // development, but every queued notification still gets processed and
  // marked sent so nothing silently piles up unsent.
  SMTP_HOST: import_zod.z.string().optional(),
  SMTP_PORT: import_zod.z.coerce.number().default(587),
  SMTP_USER: import_zod.z.string().optional(),
  SMTP_PASSWORD: import_zod.z.string().optional(),
  SMTP_FROM: import_zod.z.string().default("TUMCU Christian Union <tumchristianunion@gmail.com>"),
  NOTIFICATION_DISPATCH_INTERVAL_MS: import_zod.z.coerce.number().default(3e4),
  UPLOAD_DIR: import_zod.z.string().default("/app/data/uploads")
});
var parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("\u274C Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}
var env = parsed.data;
if (env.NODE_ENV === "production") {
  if (env.AUTH_COOKIE_SAME_SITE === "none" && !env.AUTH_COOKIE_SECURE) {
    throw new Error("Production AUTH_COOKIE_SAME_SITE=none requires AUTH_COOKIE_SECURE=true.");
  }
  const insecureDefaults = [
    "tumcu-tecump-jwt-access-secret-32-chars-long-secure-key",
    "tumcu-tecump-jwt-refresh-secret-30d",
    "tumcu-tecump-jwt-refresh-secret-32-chars-long-secure-key"
  ];
  if (insecureDefaults.includes(env.JWT_ACCESS_SECRET) || insecureDefaults.includes(env.JWT_REFRESH_SECRET)) {
    throw new Error("Production JWT secrets must be replaced with unique random secrets.");
  }
  if (env.CORS_ORIGIN.split(",").some((origin) => origin.trim() === "*")) {
    throw new Error("Production CORS_ORIGIN must contain explicit trusted origins; wildcard * is not allowed.");
  }
}

// backend/src/utils/logger.ts
var import_pino = __toESM(require("pino"));
var logger = (0, import_pino.default)({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  transport: env.NODE_ENV === "development" ? { target: "pino-pretty", options: { colorize: true, translateTime: "HH:MM:ss" } } : void 0
});

// backend/src/database/migrate.ts
var MIGRATIONS_DIR = import_path.default.join(__dirname, "migrations");
async function run() {
  const connection = await import_promise.default.createConnection({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    multipleStatements: true
  });
  await connection.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) NOT NULL PRIMARY KEY,
      applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  const [appliedRows] = await connection.query("SELECT filename FROM schema_migrations");
  const applied = new Set(appliedRows.map((r) => r.filename));
  const files = import_fs.default.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    if (applied.has(file)) {
      logger.info(`\u23ED  Skipping already-applied migration: ${file}`);
      continue;
    }
    logger.info(`\u25B6  Applying migration: ${file}`);
    const sql = import_fs.default.readFileSync(import_path.default.join(MIGRATIONS_DIR, file), "utf8");
    await connection.query(sql);
    await connection.query("INSERT INTO schema_migrations (filename) VALUES (?)", [file]);
    logger.info(`\u2705 Applied: ${file}`);
  }
  await connection.end();
  logger.info("Migrations complete.");
}
run().catch((err) => {
  console.error("\u274C Migration failed:", err);
  process.exit(1);
});
//# sourceMappingURL=migrate.cjs.map
