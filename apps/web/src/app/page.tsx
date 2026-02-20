import { StatsCards } from "@/components/dashboard/stats-cards";
import { VelocityTicker } from "@/components/dashboard/velocity-ticker";
import { CacheEfficiency } from "@/components/dashboard/cache-efficiency";
import { MonthlyAchievements } from "@/components/dashboard/monthly-achievements";
import { UsageChart } from "@/components/dashboard/usage-chart";
import { MostUsedModel } from "@/components/dashboard/most-used-model";
import { HeatmapCalendar } from "@/components/dashboard/heatmap-calendar";
import { CostForecast } from "@/components/dashboard/cost-forecast";
import { MonthlyBurnHistory } from "@/components/dashboard/monthly-burn-history";
import { OutputRatio } from "@/components/dashboard/output-ratio";
import { ModelMix } from "@/components/dashboard/model-mix";
import { MonthComparison } from "@/components/dashboard/month-comparison";
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
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 md:gap-4 xl:grid-cols-8">
            <MostUsedModel className="col-span-2 sm:col-span-3 md:col-span-1" />
            <VelocityTicker />
            <CostForecast />
            <CacheEfficiency />
            <OutputRatio />
            <MonthlyBurnHistory />
            <ModelMix />
            <MonthlyAchievements className="col-span-2 sm:col-span-1 md:col-span-1" />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:gap-3 md:grid-cols-[1fr_auto_auto] md:gap-4 md:min-h-0 md:flex-1 md:max-h-[50vh] [&>*]:md:min-h-0">
            <UsageChart />
            <HeatmapCalendar className="md:overflow-y-auto" />
            <MonthComparison className="md:overflow-y-auto md:w-[220px]" />
          </div>
        </main>
        <footer className="glass-bar relative z-20 border-t border-[var(--_bar-border)] py-3">
          <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
            &copy; {year}{" "}
            <a
              href="https://github.com/MrDemonWolf/protoburn"
              className="font-bold text-foreground hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              ProtoBurn
            </a>{" "}by{" "}
            <a
              href={env.NEXT_PUBLIC_OWNER_URL}
              className="font-bold text-foreground hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {env.NEXT_PUBLIC_OWNER_NAME}
            </a>
            <span className="hidden sm:inline">
              {" · "}Press <kbd className="rounded-lg border border-[var(--glass-border)] bg-card/50 backdrop-blur-sm px-1 py-0.5 font-mono text-[10px]">?</kbd> for shortcuts
            </span>
          </div>
        </footer>
      </MeltdownShake>
      <BurnIntensity />
      <KonamiEasterEgg />
    </>
  );
}
