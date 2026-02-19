"use client";

import { useState } from "react";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { VelocityTicker } from "@/components/dashboard/velocity-ticker";
import { CacheEfficiency } from "@/components/dashboard/cache-efficiency";
import { MonthlyAchievements } from "@/components/dashboard/monthly-achievements";
import { UsageChart } from "@/components/dashboard/usage-chart";
import { MostUsedModel } from "@/components/dashboard/most-used-model";
import { HeatmapCalendar } from "@/components/dashboard/heatmap-calendar";
import { MonthSelector } from "@/components/dashboard/month-selector";
import { KonamiEasterEgg } from "@/components/konami-easter-egg";
import { BurnIntensity, MeltdownShake } from "@/components/burn-intensity";
import { env } from "@protoburn/env/web";

export default function Home() {
  const year = new Date().getFullYear();
  const [compareMonth, setCompareMonth] = useState<string | null>(null);

  return (
    <>
      <MeltdownShake>
        <main className="container mx-auto flex flex-1 flex-col gap-3 overflow-auto p-3 md:gap-4 md:overflow-hidden md:p-4">
          <div className="flex items-center justify-between">
            <MonthSelector compareMonth={compareMonth} onChange={setCompareMonth} />
          </div>
          <StatsCards compareMonth={compareMonth} />
          <div className="grid gap-3 md:grid-cols-[auto_auto_auto_auto_1fr] md:gap-4">
            <MostUsedModel compareMonth={compareMonth} />
            <VelocityTicker />
            <CacheEfficiency />
            <MonthlyAchievements />
            <HeatmapCalendar />
          </div>
          <UsageChart compareMonth={compareMonth} />
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
