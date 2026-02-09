import type { Metadata } from "next";

import { Montserrat, Roboto } from "next/font/google";

import "../index.css";
import Header from "@/components/header";
import Providers from "@/components/providers";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
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
      <body className={`${montserrat.variable} ${roboto.variable} antialiased`}>
        <Providers>
          <div className="flex h-svh flex-col overflow-hidden bg-background md:h-svh md:overflow-hidden">
            <Header />
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
