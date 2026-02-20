"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { queryClient } from "@/utils/trpc";

import { ThemeProvider } from "./theme-provider";
import { Toaster } from "./ui/sonner";
import { BurnEnabledProvider } from "./burn-intensity";
import { SoundProvider } from "./sound-provider";
import { TabTitle } from "./tab-title";
import { KeyboardShortcuts } from "./keyboard-shortcuts";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <BurnEnabledProvider>
          <SoundProvider>
            <TabTitle />
            <KeyboardShortcuts />
            {children}
          </SoundProvider>
        </BurnEnabledProvider>
        <ReactQueryDevtools />
      </QueryClientProvider>
      <Toaster richColors />
    </ThemeProvider>
  );
}
