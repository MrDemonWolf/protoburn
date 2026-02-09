import { StatsCards } from "@/components/dashboard/stats-cards";
import { UsageChart } from "@/components/dashboard/usage-chart";
import { TopModels } from "@/components/dashboard/top-models";
import { KonamiEasterEgg } from "@/components/konami-easter-egg";

export default function Home() {
  const year = new Date().getFullYear();

  return (
    <>
      <main className="container mx-auto flex-1 space-y-6 p-4 pt-6">
        <StatsCards />
        <TopModels />
        <UsageChart />
      </main>
      <footer className="border-t py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {year} ProtoBurn by{" "}
          <a
            href="https://mrdemonwolf.com"
            className="font-bold text-foreground hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            MrDemonWolf, Inc.
          </a>
        </div>
      </footer>
      <KonamiEasterEgg />
    </>
  );
}
