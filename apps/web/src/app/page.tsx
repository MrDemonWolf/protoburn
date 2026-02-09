<<<<<<< Updated upstream
import { Header } from "@/components/header";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { UsageChart } from "@/components/dashboard/usage-chart";
import { TopModels } from "@/components/dashboard/top-models";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto space-y-6 p-4 pt-6">
        <StatsCards />
        <TopModels />
        <UsageChart />
      </main>
=======
"use client";

import { StatsCards } from "@/components/dashboard/stats-cards";
import { UsageChart } from "@/components/dashboard/usage-chart";
import { ModelBreakdown } from "@/components/dashboard/model-breakdown";

export default function Home() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      <div className="grid gap-6">
        <StatsCards />
        <UsageChart />
        <ModelBreakdown />
      </div>
>>>>>>> Stashed changes
    </div>
  );
}
