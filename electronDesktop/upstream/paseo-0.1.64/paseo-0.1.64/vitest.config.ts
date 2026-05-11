import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@getpaseo\/relay\/e2ee$/,
        replacement: path.resolve(__dirname, "packages/relay/src/e2ee.ts"),
      },
      {
        find: /^@getpaseo\/relay$/,
        replacement: path.resolve(__dirname, "packages/relay/src/index.ts"),
      },
      { find: "@server", replacement: path.resolve(__dirname, "packages/server/src") },
    ],
  },
  test: {
    exclude: ["**/.claude/**"],
  },
});
