"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ModeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="relative flex h-8 w-14 items-center rounded-full border border-[var(--glass-border)] bg-card/40 backdrop-blur-sm p-0.5 transition-colors hover:bg-accent"
      aria-label="Toggle theme"
    >
      <span
        className="flex h-6 w-6 items-center justify-center rounded-full bg-background/90 shadow-md backdrop-blur-sm transition-transform duration-200 dark:translate-x-6"
      >
        <Sun className="h-3.5 w-3.5 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-3.5 w-3.5 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
      </span>
    </button>
  );
}
