import type { Metadata } from "next";
<<<<<<< Updated upstream
import { Inter } from "next/font/google";
import "@/index.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });
=======

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
>>>>>>> Stashed changes

export const metadata: Metadata = {
  title: "protoburn - Claude Token Tracker",
  description: "Personal Claude token usage dashboard",
};

export default function RootLayout({
  children,
<<<<<<< Updated upstream
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
=======
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <div className="grid grid-rows-[auto_1fr] h-svh">
            <Header />
            {children}
          </div>
        </Providers>
>>>>>>> Stashed changes
      </body>
    </html>
  );
}
