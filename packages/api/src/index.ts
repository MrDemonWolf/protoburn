import { initTRPC } from "@trpc/server";
<<<<<<< Updated upstream
import type { Context } from "./context";

const t = initTRPC.context<Context>().create();

export const router = t.router;
=======

import type { Context } from "./context";

export const t = initTRPC.context<Context>().create();

export const router = t.router;

>>>>>>> Stashed changes
export const publicProcedure = t.procedure;
