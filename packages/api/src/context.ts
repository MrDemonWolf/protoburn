<<<<<<< Updated upstream
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";

export function createContext({
  context: _context,
}: {
  context: FetchCreateContextFnOptions;
}) {
  return {};
=======
import type { Context as HonoContext } from "hono";

export type CreateContextOptions = {
  context: HonoContext;
};

export async function createContext({ context: _context }: CreateContextOptions) {
  // No auth configured
  return {
    session: null,
  };
>>>>>>> Stashed changes
}

export type Context = Awaited<ReturnType<typeof createContext>>;
