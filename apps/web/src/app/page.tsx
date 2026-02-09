import { StatsCards } from "@/components/dashboard/stats-cards";
import { UsageChart } from "@/components/dashboard/usage-chart";
import { TopModels } from "@/components/dashboard/top-models";
import { KonamiEasterEgg } from "@/components/konami-easter-egg";
import { BurnIntensity, MeltdownShake } from "@/components/burn-intensity";

export default function Home() {
  const year = new Date().getFullYear();

  return (
    <>
      <MeltdownShake>
        <main className="container mx-auto flex flex-1 flex-col gap-4 overflow-hidden p-4">
          <StatsCards />
          <TopModels />
          <UsageChart />
        </main>
        <footer className="relative z-20 border-t bg-background/80 backdrop-blur-md py-3">
          <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
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
      </MeltdownShake>
      <BurnIntensity />
      <KonamiEasterEgg />
    </>
  );
}
