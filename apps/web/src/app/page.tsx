import { StatsCards } from "@/components/dashboard/stats-cards";
import { VelocityTicker } from "@/components/dashboard/velocity-ticker";
import { CacheEfficiency } from "@/components/dashboard/cache-efficiency";
import { MonthlyAchievements } from "@/components/dashboard/monthly-achievements";
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
        <main className="container mx-auto flex flex-1 flex-col gap-2 p-2 sm:gap-3 sm:p-3 md:gap-4 md:p-4">
          <StatsCards />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-[auto_auto_auto_1fr] md:gap-4">
            <MostUsedModel className="col-span-2 sm:col-span-3 md:col-span-1" />
            <VelocityTicker />
            <CacheEfficiency />
            <MonthlyAchievements className="col-span-2 sm:col-span-1 md:col-span-3" />
            <HeatmapCalendar className="col-span-2 sm:col-span-3 md:col-start-4 md:row-start-1 md:row-span-2" />
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
            <span className="hidden sm:inline">
              {" · "}Press <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">?</kbd> for shortcuts
            </span>
          </div>
        </footer>
      </MeltdownShake>
      <BurnIntensity />
      <KonamiEasterEgg />
    </>
  );
}
