import type { Metadata } from "next";

import { Montserrat, Roboto } from "next/font/google";

import "../index.css";
import Header from "@/components/header";
import Providers from "@/components/providers";
import { WallpaperCanvas } from "@/components/wallpaper-canvas";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  metadataBase: process.env.NEXT_PUBLIC_SERVER_URL
    ? new URL(process.env.NEXT_PUBLIC_SERVER_URL)
    : undefined,
  title: "ProtoBurn — Claude API Cost & Usage Dashboard",
  description:
    "Track your Claude API spending, token usage, and prompt caching costs. Monitor monthly costs including cache write/read tokens, see your top models leaderboard, and visualize usage trends — self-hosted on Cloudflare.",
  keywords: [
    "Claude API",
    "token usage",
    "cost tracking",
    "prompt caching",
    "dashboard",
    "Anthropic",
    "LLM analytics",
  ],
  openGraph: {
    title: "ProtoBurn — Claude API Cost & Usage Dashboard",
    description:
      "Track your Claude API spending, token usage, and prompt caching costs with a personal dashboard.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ProtoBurn — Claude API Cost & Usage Dashboard",
    description:
      "Track your Claude API spending, token usage, and prompt caching costs with a personal dashboard.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${montserrat.variable} ${roboto.variable} antialiased`}>
        <Providers>
          <WallpaperCanvas />
          <div className="relative z-10 flex min-h-svh flex-col bg-transparent md:h-svh md:overflow-hidden">
            <Header />
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
