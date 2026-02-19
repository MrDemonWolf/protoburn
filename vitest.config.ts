import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "web",
          root: "apps/web",
          include: ["src/**/*.test.ts"],
        },
        resolve: {
          alias: {
            "@": path.resolve(import.meta.dirname, "apps/web/src"),
          },
        },
      },
      {
        test: {
          name: "server",
          root: "apps/server",
          include: ["src/**/*.test.ts"],
        },
        resolve: {
          alias: {
            "@": path.resolve(import.meta.dirname, "apps/server/src"),
            "@protoburn/db": path.resolve(import.meta.dirname, "packages/db/src/test-utils.ts"),
            "@protoburn/env/server": path.resolve(import.meta.dirname, "apps/server/src/__tests__/stubs/env-server.ts"),
          },
        },
      },
      {
        test: {
          name: "api",
          root: "packages/api",
          include: ["src/**/*.test.ts"],
        },
      },
      {
        test: {
          name: "scripts",
          root: "scripts",
          include: ["__tests__/**/*.test.ts"],
        },
      },
    ],
  },
});
