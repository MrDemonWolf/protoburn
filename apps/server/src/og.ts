import type { Context } from "hono";
import { appRouter } from "@protoburn/api/routers/index";
import satori, { init as initSatori } from "satori/standalone";
// @ts-expect-error -- yoga WASM binary import for Cloudflare Workers
import yogaWasm from "./yoga.wasm";
import { initWasm, Resvg } from "@resvg/resvg-wasm";
// @ts-expect-error -- resvg WASM binary import for Cloudflare Workers
import resvgWasm from "../node_modules/@resvg/resvg-wasm/index_bg.wasm";
import { calculateCost } from "./lib/pricing";
import { formatNumber, cleanModelName } from "./lib/format";
import { getBurnTierName } from "./lib/burn-tiers";
import { env } from "cloudflare:workers";

let satoriReady: Promise<void> | null = null;
let resvgReady: Promise<void> | null = null;

function ensureInitialized(): Promise<void> {
  if (!satoriReady) {
    satoriReady = initSatori(yogaWasm).catch((e) => {
      satoriReady = null;
      throw e;
    });
  }
  if (!resvgReady) {
    resvgReady = initWasm(resvgWasm).catch((e) => {
      resvgReady = null;
      throw e;
    });
  }
  return Promise.all([satoriReady, resvgReady]).then(() => {});
}

const caller = appRouter.createCaller({ session: null });

const TIER_THEMES: Record<string, { from: string; to: string; accent: string }> = {
  cold: { from: "#0f172a", to: "#1e293b", accent: "#64748b" },
  spark: { from: "#1a1a2e", to: "#16213e", accent: "#eab308" },
  warm: { from: "#1a1a2e", to: "#2d1810", accent: "#f97316" },
  burning: { from: "#1a0a00", to: "#3d1200", accent: "#ea580c" },
  blazing: { from: "#1a0500", to: "#451a03", accent: "#dc2626" },
  inferno: { from: "#1a0000", to: "#450a0a", accent: "#ef4444" },
  meltdown: { from: "#2a0000", to: "#7f1d1d", accent: "#f87171" },
};

const MEDALS = ["\u{1F947}", "\u{1F948}", "\u{1F949}"];

interface ModelData {
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
}

async function fetchData() {
  const [totals, monthly] = await Promise.all([
    caller.tokenUsage.totals(),
    caller.tokenUsage.byModelMonthly(),
  ]);

  const models: ModelData[] = monthly.models
    .map((r) => ({
      model: r.model,
      inputTokens: r.inputTokens,
      outputTokens: r.outputTokens,
      totalTokens: r.totalTokens,
      cost: calculateCost(r.model, r.inputTokens, r.outputTokens, r.cacheCreationTokens, r.cacheReadTokens),
    }))
    .sort((a, b) => b.totalTokens - a.totalTokens);

  const monthlyTokens = models.reduce((s, m) => s + m.totalTokens, 0);
  const monthlyCost = models.reduce((s, m) => s + m.cost, 0);

  return {
    totalInput: totals.totalInput,
    totalOutput: totals.totalOutput,
    totalTokens: totals.totalTokens,
    monthlyTokens,
    monthlyCost,
    topModels: models.slice(0, 3),
    tierName: getBurnTierName(monthlyTokens),
  };
}

async function loadGoogleFont(family: string, weight: number): Promise<ArrayBuffer> {
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`;
  const css = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/6.0)" },
  }).then((r) => r.text());

  const fontUrl = css.match(/src:\s*url\(([^)]+)\)/)?.[1];
  if (!fontUrl) throw new Error(`Font URL not found for ${family} ${weight}`);
  return fetch(fontUrl).then((r) => r.arrayBuffer());
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function buildElement(data: Awaited<ReturnType<typeof fetchData>>) {
  const theme = TIER_THEMES[data.tierName] ?? TIER_THEMES.cold!;
  const hasData = data.totalTokens > 0;
  const fireEmoji = data.tierName === "cold" ? "" : "\u{1F525}";
  const tierLabel = data.tierName.toUpperCase();

  const now = new Date();
  const monthYear = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;

  const costDisplay = hasData ? `$${data.monthlyCost.toFixed(2)}` : "$0.00";
  const totalDisplay = hasData ? formatNumber(data.totalTokens) : "0";
  const inputDisplay = hasData ? formatNumber(data.totalInput) : "0";
  const outputDisplay = hasData ? formatNumber(data.totalOutput) : "0";

  const fireBar = hasData && data.tierName !== "cold"
    ? fireEmoji.repeat(Math.min(Math.ceil(data.monthlyCost / 10), 10))
    : "";

  const topModels = data.topModels.map((m, i) => ({
    type: "div",
    props: {
      style: { display: "flex", flexDirection: "column", background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 20px", flex: 1, gap: 6 },
      children: [
        { type: "div", props: { style: { display: "flex", alignItems: "center", gap: 6, fontFamily: "Montserrat", fontSize: 18, fontWeight: 600, color: "#e2e8f0" }, children: `${MEDALS[i] ?? ""} ${cleanModelName(m.model)}` } },
        { type: "div", props: { style: { display: "flex", fontFamily: "Roboto", fontSize: 16, color: "#94a3b8" }, children: `${formatNumber(m.totalTokens)} tokens` } },
        { type: "div", props: { style: { display: "flex", fontFamily: "Roboto", fontSize: 15, color: theme.accent }, children: `$${m.cost.toFixed(2)}` } },
      ],
    },
  }));

  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        width: 1200,
        height: 630,
        background: `linear-gradient(135deg, ${theme.from}, ${theme.to})`,
        padding: "40px 48px",
        fontFamily: "Roboto",
        color: "#f8fafc",
        justifyContent: "space-between",
      },
      children: [
        // Header
        {
          type: "div",
          props: {
            style: { display: "flex", justifyContent: "space-between", alignItems: "center" },
            children: [
              {
                type: "div",
                props: {
                  style: { display: "flex", alignItems: "center", gap: 12 },
                  children: [
                    {
                      type: "svg",
                      props: {
                        width: 36, height: 36, viewBox: "0 0 24 24", fill: "none",
                        children: [
                          { type: "path", props: { d: "M12 2C6.5 6.5 4 10.5 4 14a8 8 0 0 0 16 0c0-3.5-2.5-7.5-8-12Z", fill: theme.accent, opacity: 0.9 } },
                          { type: "path", props: { d: "M12 9c-2.5 2.5-4 5-4 7a4 4 0 0 0 8 0c0-2-1.5-4.5-4-7Z", fill: "#fbbf24", opacity: 0.7 } },
                        ],
                      },
                    },
                    { type: "span", props: { style: { fontFamily: "Montserrat", fontWeight: 800, fontSize: 32, letterSpacing: -0.5, color: "#f8fafc" }, children: "PROTOBURN" } },
                  ],
                },
              },
              {
                type: "div",
                props: {
                  style: { display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.08)", borderRadius: 20, padding: "6px 16px" },
                  children: { type: "span", props: { style: { fontFamily: "Montserrat", fontWeight: 600, fontSize: 16, color: theme.accent }, children: `${fireEmoji} ${tierLabel}` } },
                },
              },
            ],
          },
        },
        // Stats cards
        {
          type: "div",
          props: {
            style: { display: "flex", gap: 24, marginTop: 8 },
            children: [
              {
                type: "div",
                props: {
                  style: { display: "flex", flexDirection: "column", flex: 1, background: "rgba(255,255,255,0.06)", borderRadius: 16, padding: 24, gap: 4 },
                  children: [
                    { type: "div", props: { style: { display: "flex", fontFamily: "Montserrat", fontWeight: 600, fontSize: 15, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }, children: `${monthYear} \u00B7 Est. Cost (${env.API_PLAN} plan)` } },
                    { type: "div", props: { style: { display: "flex", fontFamily: "Montserrat", fontWeight: 800, fontSize: 48, color: theme.accent }, children: costDisplay } },
                    ...(fireBar ? [{ type: "div", props: { style: { display: "flex", fontSize: 22, letterSpacing: 2, marginTop: 2 }, children: fireBar } }] : []),
                    ...(!hasData ? [{ type: "div", props: { style: { display: "flex", fontFamily: "Roboto", fontSize: 14, color: "#64748b", marginTop: 2 }, children: "No data yet" } }] : []),
                  ],
                },
              },
              {
                type: "div",
                props: {
                  style: { display: "flex", flexDirection: "column", flex: 1, background: "rgba(255,255,255,0.06)", borderRadius: 16, padding: 24, gap: 4 },
                  children: [
                    { type: "div", props: { style: { display: "flex", fontFamily: "Montserrat", fontWeight: 600, fontSize: 15, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }, children: "Total Tokens" } },
                    { type: "div", props: { style: { display: "flex", fontFamily: "Montserrat", fontWeight: 800, fontSize: 48, color: "#f8fafc" }, children: totalDisplay } },
                    { type: "div", props: { style: { display: "flex", gap: 16, fontFamily: "Roboto", fontSize: 16, color: "#94a3b8", marginTop: 4 }, children: [
                      { type: "span", props: { style: { display: "flex" }, children: `In: ${inputDisplay}` } },
                      { type: "span", props: { style: { display: "flex" }, children: `Out: ${outputDisplay}` } },
                    ] } },
                  ],
                },
              },
            ],
          },
        },
        // Top Models
        ...(data.topModels.length > 0 ? [{
          type: "div",
          props: {
            style: { display: "flex", flexDirection: "column", gap: 12, marginTop: 4 },
            children: [
              { type: "div", props: { style: { display: "flex", fontFamily: "Montserrat", fontWeight: 600, fontSize: 14, color: "#64748b", textTransform: "uppercase", letterSpacing: 2 }, children: "Top Models" } },
              { type: "div", props: { style: { display: "flex", gap: 16 }, children: topModels } },
            ],
          },
        }] : []),
        // Footer
        {
          type: "div",
          props: {
            style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: 8 },
            children: [
              { type: "span", props: { style: { display: "flex", fontFamily: "Roboto", fontSize: 14, color: "#475569" }, children: "Claude API Cost & Usage Dashboard" } },
              { type: "span", props: { style: { display: "flex", fontFamily: "Roboto", fontSize: 14, color: "#475569" }, children: env.OWNER_SITE } },
            ],
          },
        },
      ],
    },
  };
}

function buildFallbackElement() {
  const theme = TIER_THEMES.cold!;
  return {
    type: "div",
    props: {
      style: {
        display: "flex", flexDirection: "column", width: 1200, height: 630,
        background: `linear-gradient(135deg, ${theme.from}, ${theme.to})`,
        padding: "40px 48px", fontFamily: "Roboto", color: "#f8fafc",
        justifyContent: "center", alignItems: "center", gap: 16,
      },
      children: [
        {
          type: "svg",
          props: {
            width: 64, height: 64, viewBox: "0 0 24 24", fill: "none",
            children: [
              { type: "path", props: { d: "M12 2C6.5 6.5 4 10.5 4 14a8 8 0 0 0 16 0c0-3.5-2.5-7.5-8-12Z", fill: "#64748b", opacity: 0.9 } },
              { type: "path", props: { d: "M12 9c-2.5 2.5-4 5-4 7a4 4 0 0 0 8 0c0-2-1.5-4.5-4-7Z", fill: "#fbbf24", opacity: 0.7 } },
            ],
          },
        },
        { type: "span", props: { style: { fontFamily: "Montserrat", fontWeight: 800, fontSize: 48, letterSpacing: -1, color: "#f8fafc" }, children: "PROTOBURN" } },
        { type: "span", props: { style: { fontFamily: "Roboto", fontSize: 20, color: "#94a3b8" }, children: "Claude API Cost & Usage Dashboard" } },
      ],
    },
  };
}

export async function generateOgImage(_c: Context): Promise<Response> {
  await ensureInitialized();

  let element;
  try {
    const data = await fetchData();
    element = buildElement(data);
  } catch {
    element = buildFallbackElement();
  }

  const [montserratBold, montserratSemibold, roboto] = await Promise.all([
    loadGoogleFont("Montserrat", 800),
    loadGoogleFont("Montserrat", 600),
    loadGoogleFont("Roboto", 400),
  ]);

  const svg = await satori(element as any, {
    width: 1200,
    height: 630,
    fonts: [
      { name: "Montserrat", data: montserratBold, weight: 800, style: "normal" as const },
      { name: "Montserrat", data: montserratSemibold, weight: 600, style: "normal" as const },
      { name: "Roboto", data: roboto, weight: 400, style: "normal" as const },
    ],
  });

  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } });
  const png = resvg.render().asPng();

  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, s-maxage=3600, max-age=300, stale-while-revalidate=86400",
    },
  });
}
