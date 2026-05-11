import { config as loadDotenv } from "dotenv";
import os from "node:os";
import { z } from "zod";

loadDotenv();

function getDefaultLanHost(): string {
  const interfaces = os.networkInterfaces();
  for (const entries of Object.values(interfaces)) {
    for (const entry of entries ?? []) {
      if (
        entry.family === "IPv4" &&
        !entry.internal &&
        !entry.address.startsWith("169.254.")
      ) {
        return entry.address;
      }
    }
  }
  return "0.0.0.0";
}

const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(8787),
  HOST: z.string().trim().min(1).default(getDefaultLanHost()),
  CORS_ORIGINS: z.string().trim().optional().default("*"),
});

export type RelayServiceConfig = {
  host: string;
  port: number;
  corsOrigins: string;
};

let cachedConfig: RelayServiceConfig | null = null;

export function loadRelayServiceConfig(): RelayServiceConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const parsed = EnvSchema.parse(process.env);
  cachedConfig = {
    host: parsed.HOST,
    port: parsed.PORT,
    corsOrigins: parsed.CORS_ORIGINS,
  };
  return cachedConfig;
}
