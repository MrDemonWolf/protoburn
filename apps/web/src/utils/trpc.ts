"use client";

import type { AppRouter } from "@protoburn/api/routers/index";
import { createTRPCReact } from "@trpc/react-query";

export const trpc = createTRPCReact<AppRouter>();
