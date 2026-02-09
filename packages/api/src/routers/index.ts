import { z } from "zod";
import { and, gte, lt, sum } from "drizzle-orm";
import db, { schema } from "@protoburn/db";
import { publicProcedure, router } from "../index";

const tokenUsageRouter = router({
  push: publicProcedure
    .input(
      z.object({
        records: z.array(
          z.object({
            model: z.string(),
            inputTokens: z.number().int().nonnegative(),
            outputTokens: z.number().int().nonnegative(),
            date: z.string(),
          }),
        ),
      }),
    )
    .mutation(async ({ input }) => {
      const rows = input.records.map((r) => ({
        model: r.model,
        inputTokens: r.inputTokens,
        outputTokens: r.outputTokens,
        date: r.date,
      }));
      await db.insert(schema.tokenUsage).values(rows);
      return { count: rows.length };
    }),

  totals: publicProcedure.query(async () => {
    const [result] = await db
      .select({
        totalInput: sum(schema.tokenUsage.inputTokens).mapWith(Number),
        totalOutput: sum(schema.tokenUsage.outputTokens).mapWith(Number),
      })
      .from(schema.tokenUsage);
    const totalInput = result?.totalInput ?? 0;
    const totalOutput = result?.totalOutput ?? 0;
    return {
      totalInput,
      totalOutput,
      totalTokens: totalInput + totalOutput,
    };
  }),

  byModel: publicProcedure.query(async () => {
    const results = await db
      .select({
        model: schema.tokenUsage.model,
        inputTokens: sum(schema.tokenUsage.inputTokens).mapWith(Number),
        outputTokens: sum(schema.tokenUsage.outputTokens).mapWith(Number),
      })
      .from(schema.tokenUsage)
      .groupBy(schema.tokenUsage.model);

    return results.map((r) => ({
      model: r.model,
      inputTokens: r.inputTokens ?? 0,
      outputTokens: r.outputTokens ?? 0,
      totalTokens: (r.inputTokens ?? 0) + (r.outputTokens ?? 0),
    }));
  }),

  byModelMonthly: publicProcedure
    .input(
      z
        .object({
          month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      const now = new Date();
      const monthStr = input?.month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const [year, month] = monthStr.split("-").map(Number) as [number, number];
      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      const endDate = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

      const results = await db
        .select({
          model: schema.tokenUsage.model,
          inputTokens: sum(schema.tokenUsage.inputTokens).mapWith(Number),
          outputTokens: sum(schema.tokenUsage.outputTokens).mapWith(Number),
        })
        .from(schema.tokenUsage)
        .where(
          and(
            gte(schema.tokenUsage.date, startDate),
            lt(schema.tokenUsage.date, endDate),
          ),
        )
        .groupBy(schema.tokenUsage.model);

      return {
        month: monthStr,
        models: results.map((r) => ({
          model: r.model,
          inputTokens: r.inputTokens ?? 0,
          outputTokens: r.outputTokens ?? 0,
          totalTokens: (r.inputTokens ?? 0) + (r.outputTokens ?? 0),
        })),
      };
    }),

  timeSeries: publicProcedure
    .input(
      z
        .object({
          days: z.number().int().positive().default(30),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      const days = input?.days ?? 30;
      const since = new Date();
      since.setDate(since.getDate() - days);
      const sinceStr = since.toISOString().split("T")[0]!;

      const results = await db
        .select({
          date: schema.tokenUsage.date,
          inputTokens: sum(schema.tokenUsage.inputTokens).mapWith(Number),
          outputTokens: sum(schema.tokenUsage.outputTokens).mapWith(Number),
        })
        .from(schema.tokenUsage)
        .where(gte(schema.tokenUsage.date, sinceStr))
        .groupBy(schema.tokenUsage.date)
        .orderBy(schema.tokenUsage.date);

      return results.map((r) => ({
        date: r.date,
        inputTokens: r.inputTokens ?? 0,
        outputTokens: r.outputTokens ?? 0,
      }));
    }),
});

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  tokenUsage: tokenUsageRouter,
});
export type AppRouter = typeof appRouter;
