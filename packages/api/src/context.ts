import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";

export function createContext({
  context: _context,
}: {
  context: FetchCreateContextFnOptions;
}) {
  return {};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
