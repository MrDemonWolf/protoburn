import alchemy from "alchemy";
import { Website } from "alchemy/cloudflare";
import { Worker } from "alchemy/cloudflare";
import { D1Database } from "alchemy/cloudflare";
import { config } from "dotenv";

config({ path: "./.env" });
config({ path: "../../apps/web/.env" });
config({ path: "../../apps/server/.env" });

const app = await alchemy("protoburn");

const db = await D1Database("database", {
  migrationsDir: "../../packages/db/drizzle",
});

// Deploy server first so we know its URL for the web build.
// CORS_ORIGIN will be updated on the next deploy once we know the web URL.
export const server = await Worker("server", {
  name: "protoburn-api",
  cwd: "../../apps/server",
  entrypoint: "src/index.ts",
  compatibility: "node",
  bindings: {
    DB: db,
    CORS_ORIGIN: "*",
    API_KEY: alchemy.env.API_KEY ?? "",
    OWNER_SITE: alchemy.env.OWNER_SITE ?? "mrdemonwolf.com",
    API_PLAN: process.env.API_PLAN ?? "Max",
    BILLING_RENEWAL_DAY: process.env.BILLING_RENEWAL_DAY ?? "6",
  },
  crons: ["0 0 * * *"],
  dev: {
    port: 3000,
  },
});

const serverUrl = server.url ?? "http://localhost:3000";

// Build web with the server URL baked in
export const web = await Website("protoburn", {
  name: "protoburn",
  cwd: "../../apps/web",
  build: {
    command: "pnpm build",
    env: {
      NEXT_PUBLIC_SERVER_URL: serverUrl,
      NEXT_PUBLIC_API_PLAN: process.env.API_PLAN ?? "Max",
    },
  },
  assets: "out",
  spa: true,
  dev: {
    command: "pnpm dev:bare",
    domain: "localhost:3001",
  },
});

console.log(`Web    -> ${web.url}`);
console.log(`Server -> ${server.url}`);

await app.finalize();
