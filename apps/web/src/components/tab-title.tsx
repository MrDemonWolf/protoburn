"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { trpc } from "@/utils/trpc";
import { calculateCost } from "@/lib/pricing";
import { useBurnEnabled, useEffectiveTier } from "./burn-intensity";

const DEFAULT_TITLE = "ProtoBurn — Claude API Cost & Usage Dashboard";

export function TabTitle() {
  const { enabled } = useBurnEnabled();

  const { data: monthly } = useQuery(
    trpc.tokenUsage.byModelMonthly.queryOptions(),
  );

  const models = monthly?.models ?? [];

  const monthlyCost = models.reduce(
    (sum, m) => sum + calculateCost(m.model, m.inputTokens, m.outputTokens),
    0,
  );

  const monthlyTokens = models.reduce(
    (sum, m) => sum + m.inputTokens + m.outputTokens,
    0,
  );

  const tier = useEffectiveTier(monthlyTokens);

  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const cost = Math.ceil(monthlyCost);
        const tierName = tier.name.charAt(0).toUpperCase() + tier.name.slice(1);
        document.title = `$${cost} \u{1F525} ${tierName} — ProtoBurn`;
      } else {
        document.title = DEFAULT_TITLE;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.title = DEFAULT_TITLE;
    };
  }, [enabled, monthlyCost, tier.name]);

  return null;
}
