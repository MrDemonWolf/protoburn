"use client";
import Link from "next/link";
import { Flame, RefreshCw } from "lucide-react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { ModeToggle } from "./mode-toggle";
import { useBurnEnabled, useEffectiveTier } from "./burn-intensity";
import { trpc } from "@/utils/trpc";

const TIER_COLORS: Record<string, string> = {
  cold: "text-muted-foreground",
  spark: "text-yellow-500",
  warm: "text-orange-400",
  burning: "text-orange-500",
  blazing: "text-orange-600",
  inferno: "text-red-500",
  meltdown: "text-red-600",
};

export default function Header() {
  const { enabled, toggle } = useBurnEnabled();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data: monthly } = useQuery(
    trpc.tokenUsage.byModelMonthly.queryOptions(),
  );

  const monthlyTokens = (monthly?.models ?? []).reduce(
    (sum, m) => sum + m.inputTokens + m.outputTokens,
    0,
  );
  const tier = useEffectiveTier(monthlyTokens);

  const handleRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <div className="relative z-20 border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex items-center justify-between px-4 py-2.5">
        <Link href="/" className="flex items-center gap-2 font-heading text-lg font-bold tracking-tight">
          <Flame className="h-5 w-5 text-primary" />
          ProtoBurn
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border transition-colors hover:bg-accent disabled:opacity-50"
            aria-label="Refresh data"
            title="Refresh data"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${refreshing ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={toggle}
            className="flex h-8 items-center gap-1.5 rounded-full border border-border px-2.5 text-xs transition-colors hover:bg-accent"
            aria-label="Toggle fire effects"
            title={enabled ? "Disable fire effects" : "Enable fire effects"}
          >
            <Flame className={`h-3.5 w-3.5 ${enabled ? "text-orange-500" : "text-muted-foreground"}`} />
            {tier.name !== "cold" && enabled ? (
              <span className={`font-medium capitalize ${TIER_COLORS[tier.name] ?? "text-muted-foreground"}`}>
                {tier.name}
              </span>
            ) : (
              <span className="text-muted-foreground">{enabled ? "On" : "Off"}</span>
            )}
          </button>
          <ModeToggle />
        </div>
      </div>
    </div>
  );
}
