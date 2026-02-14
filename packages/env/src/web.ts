import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  client: {
    NEXT_PUBLIC_SERVER_URL: z.url(),
    NEXT_PUBLIC_OWNER_NAME: z.string().default("MrDemonWolf, Inc."),
    NEXT_PUBLIC_OWNER_URL: z.string().url().default("https://mrdemonwolf.com"),
    NEXT_PUBLIC_API_PLAN: z.string().default("Build"),
  },
  runtimeEnv: {
    NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL,
    NEXT_PUBLIC_OWNER_NAME: process.env.NEXT_PUBLIC_OWNER_NAME,
    NEXT_PUBLIC_OWNER_URL: process.env.NEXT_PUBLIC_OWNER_URL,
    NEXT_PUBLIC_API_PLAN: process.env.NEXT_PUBLIC_API_PLAN,
  },
  emptyStringAsUndefined: true,
});
