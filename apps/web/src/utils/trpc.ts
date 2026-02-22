import type { AppRouter } from "@protoburn/api/routers/index";

import { env } from "@protoburn/env/web";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchStreamLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { toast } from "sonner";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min — sync only pushes every 60 min
      gcTime: 10 * 60 * 1000, // 10 min
      refetchOnWindowFocus: false,
    },
  },
  queryCache: new QueryCache({
    onError: (error, query) => {
      toast.error(error.message, {
        action: {
          label: "retry",
          onClick: query.invalidate,
        },
      });
    },
  }),
});

const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchStreamLink({
      url: `${env.NEXT_PUBLIC_SERVER_URL}/trpc`,
    }),
  ],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
});
