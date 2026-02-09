import Header from "@/components/header";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { UsageChart } from "@/components/dashboard/usage-chart";
import { TopModels } from "@/components/dashboard/top-models";

export default function Home() {
  const year = new Date().getFullYear();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="container mx-auto flex-1 space-y-6 p-4 pt-6">
        <StatsCards />
        <TopModels />
        <UsageChart />
      </main>
      <footer className="border-t py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {year} ProtoBurn by MrDemonWolf, Inc.
        </div>
      </footer>
    </div>
  );
}
