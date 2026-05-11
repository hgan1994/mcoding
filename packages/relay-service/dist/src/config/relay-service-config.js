"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadRelayServiceConfig = loadRelayServiceConfig;
const node_os_1 = require("node:os");
const zod_1 = require("zod");
const EnvSchema = zod_1.z.object({
    PORT: zod_1.z.coerce.number().int().positive().default(8787),
    HOST: zod_1.z.string().trim().min(1).default("0.0.0.0"),
    MYSQL_HOST: zod_1.z.string().trim().min(1).default("127.0.0.1"),
    MYSQL_PORT: zod_1.z.coerce.number().int().positive().default(3306),
    MYSQL_USER: zod_1.z.string().trim().min(1).default("root"),
    MYSQL_PASSWORD: zod_1.z.string().default(""),
    MYSQL_DATABASE: zod_1.z.string().trim().min(1).default("paseo_relay"),
    MYSQL_SYNC: zod_1.z
        .enum(["true", "false", "1", "0"])
        .optional()
        .transform((value) => value === "true" || value === "1"),
    REDIS_ENABLED: zod_1.z
        .enum(["true", "false", "1", "0"])
        .optional()
        .transform((value) => value === "true" || value === "1"),
    REDIS_URL: zod_1.z.string().trim().optional(),
    RELAY_INSTANCE_ID: zod_1.z.string().trim().min(1).optional(),
    RELAY_OWNER_TTL_MS: zod_1.z.coerce.number().int().positive().default(30000),
    RELAY_OWNER_REFRESH_MS: zod_1.z.coerce.number().int().positive().default(10000),
});
let cachedConfig = null;
function loadRelayServiceConfig() {
    if (cachedConfig) {
        return cachedConfig;
    }
    const parsed = EnvSchema.parse(process.env);
    cachedConfig = {
        host: parsed.HOST,
        port: parsed.PORT,
        mysql: {
            host: parsed.MYSQL_HOST,
            port: parsed.MYSQL_PORT,
            user: parsed.MYSQL_USER,
            password: parsed.MYSQL_PASSWORD,
            database: parsed.MYSQL_DATABASE,
            synchronize: parsed.MYSQL_SYNC ?? process.env.NODE_ENV !== "production",
        },
        redis: {
            enabled: parsed.REDIS_ENABLED ?? Boolean(parsed.REDIS_URL),
            url: parsed.REDIS_URL?.trim() ? parsed.REDIS_URL.trim() : null,
            instanceId: parsed.RELAY_INSTANCE_ID?.trim() ||
                `relay-${(0, node_os_1.hostname)().replace(/[^a-zA-Z0-9_-]/g, "-")}-${process.pid}`,
            ownerTtlMs: parsed.RELAY_OWNER_TTL_MS,
            ownerRefreshMs: parsed.RELAY_OWNER_REFRESH_MS,
        },
    };
    return cachedConfig;
}
//# sourceMappingURL=relay-service-config.js.map