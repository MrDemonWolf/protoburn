"use client";

<<<<<<< Updated upstream
import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
=======
import { ThemeProvider as NextThemesProvider } from "next-themes";
import * as React from "react";
>>>>>>> Stashed changes

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
