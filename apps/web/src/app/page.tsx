import { StatsCards } from "@/components/dashboard/stats-cards";
import { VelocityTicker } from "@/components/dashboard/velocity-ticker";
import { UsageChart } from "@/components/dashboard/usage-chart";
import { MostUsedModel } from "@/components/dashboard/most-used-model";
import { HeatmapCalendar } from "@/components/dashboard/heatmap-calendar";
import { KonamiEasterEgg } from "@/components/konami-easter-egg";
import { BurnIntensity, MeltdownShake } from "@/components/burn-intensity";
import { env } from "@protoburn/env/web";

export default function Home() {
  const year = new Date().getFullYear();

  return (
    <>
      <MeltdownShake>
        <main className="container mx-auto flex flex-1 flex-col gap-3 overflow-auto p-3 md:gap-4 md:overflow-hidden md:p-4">
          <StatsCards />
          <div className="grid gap-3 md:grid-cols-[auto_auto_1fr] md:gap-4">
            <MostUsedModel />
            <VelocityTicker />
            <HeatmapCalendar />
          </div>
          <UsageChart />
        </main>
        <footer className="relative z-20 border-t bg-background/80 backdrop-blur-md py-3">
          <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
            &copy; {year} ProtoBurn by{" "}
            <a
              href={env.NEXT_PUBLIC_OWNER_URL}
              className="font-bold text-foreground hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {env.NEXT_PUBLIC_OWNER_NAME}
            </a>
          </div>
        </footer>
      </MeltdownShake>
      <BurnIntensity />
      <KonamiEasterEgg />
    </>
  );
}
