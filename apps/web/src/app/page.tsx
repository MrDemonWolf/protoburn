import { Github, Twitter, Twitch, Youtube, Globe } from "lucide-react";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { VelocityTicker } from "@/components/dashboard/velocity-ticker";
import { MonthlyAchievements } from "@/components/dashboard/monthly-achievements";
import { UsageChart } from "@/components/dashboard/usage-chart";
import { MostUsedModel } from "@/components/dashboard/most-used-model";
import { HeatmapCalendar } from "@/components/dashboard/heatmap-calendar";
import { CostForecast } from "@/components/dashboard/cost-forecast";
import { CostBreakdown } from "@/components/dashboard/cost-breakdown";
import { MonthlyBurnHistory } from "@/components/dashboard/monthly-burn-history";
import { KonamiEasterEgg } from "@/components/konami-easter-egg";
import { BurnIntensity, MeltdownShake } from "@/components/burn-intensity";
import { env } from "@protoburn/env/web";

const SOCIAL_LINKS = [
  { href: "https://github.com/nathanialhenniges", icon: Github, label: "GitHub" },
  { href: "https://x.com/mrdemonwolf", icon: Twitter, label: "X" },
  { href: "https://twitch.tv/mrdemonwolf", icon: Twitch, label: "Twitch" },
  { href: "https://youtube.com/@mrdemonwolf", icon: Youtube, label: "YouTube" },
  { href: "https://mrdemonwolf.com", icon: Globe, label: "Website" },
] as const;

export default function Home() {
  const year = new Date().getFullYear();

  return (
    <>
      <MeltdownShake>
        <main className="container mx-auto flex flex-1 flex-col gap-2 p-2 sm:gap-3 sm:p-3 md:gap-4 md:p-4">
          <StatsCards />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 md:gap-4 xl:grid-cols-7">
            <MostUsedModel className="sm:col-span-3 md:col-span-1" />
            <VelocityTicker />
            <CostForecast />
            <CostBreakdown />
            <MonthlyBurnHistory />
            <MonthlyAchievements className="col-span-2" />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:gap-3 md:grid-cols-[1fr_auto] md:gap-4 md:min-h-0 md:flex-1 md:max-h-[50vh] [&>*]:md:min-h-0">
            <UsageChart />
            <HeatmapCalendar />
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
            <div className="mt-1.5 flex items-center justify-center gap-3">
              {SOCIAL_LINKS.map(({ href, icon: Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={label}
                >
                  <Icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </div>
        </footer>
      </MeltdownShake>
      <BurnIntensity />
      <KonamiEasterEgg />
    </>
  );
}
