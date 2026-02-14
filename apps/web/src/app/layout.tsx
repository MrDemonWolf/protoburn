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
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_SERVER_URL}/api/og`,
        width: 1200,
        height: 630,
        alt: "ProtoBurn — Claude API Cost & Usage Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ProtoBurn — Claude API Cost & Usage Dashboard",
    description:
      "Track your Claude API spending, token usage, and prompt caching costs with a personal dashboard.",
    images: [`${process.env.NEXT_PUBLIC_SERVER_URL}/api/og`],
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
