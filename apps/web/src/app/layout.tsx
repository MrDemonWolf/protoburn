import type { Metadata } from "next";

import { Geist, Geist_Mono } from "next/font/google";

import "../index.css";
import Header from "@/components/header";
import Providers from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ProtoBurn — Claude API Cost & Usage Dashboard",
  description:
    "Track your Claude API spending and token usage. Monitor monthly costs, see your top models leaderboard, and visualize usage trends — self-hosted on Cloudflare.",
  keywords: [
    "Claude API",
    "token usage",
    "cost tracking",
    "dashboard",
    "Anthropic",
    "LLM analytics",
  ],
  openGraph: {
    title: "ProtoBurn — Claude API Cost & Usage Dashboard",
    description:
      "Track your Claude API spending and token usage with a personal dashboard.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <div className="flex min-h-svh flex-col bg-background">
            <Header />
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
