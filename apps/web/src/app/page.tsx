import { Header } from "@/components/header";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { UsageChart } from "@/components/dashboard/usage-chart";
import { ModelBreakdown } from "@/components/dashboard/model-breakdown";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto space-y-6 p-4 pt-6">
        <StatsCards />
        <div className="grid gap-6 lg:grid-cols-2">
          <UsageChart />
          <ModelBreakdown />
        </div>
      </main>
    </div>
  );
}
