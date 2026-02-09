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
    </div>
  );
}
