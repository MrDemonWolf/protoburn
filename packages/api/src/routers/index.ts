import { z } from "zod";
import db, { schema } from "@protoburn/db";
import { sql, sum, gte } from "drizzle-orm";
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
    const result = await db
      .select({
        totalInput: sum(schema.tokenUsage.inputTokens),
        totalOutput: sum(schema.tokenUsage.outputTokens),
      })
      .from(schema.tokenUsage);

    const totalInput = Number(result[0]?.totalInput ?? 0);
    const totalOutput = Number(result[0]?.totalOutput ?? 0);
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
        inputTokens: sum(schema.tokenUsage.inputTokens),
        outputTokens: sum(schema.tokenUsage.outputTokens),
      })
      .from(schema.tokenUsage)
      .groupBy(schema.tokenUsage.model);

    return results.map((r) => ({
      model: r.model,
      inputTokens: Number(r.inputTokens ?? 0),
      outputTokens: Number(r.outputTokens ?? 0),
      totalTokens: Number(r.inputTokens ?? 0) + Number(r.outputTokens ?? 0),
    }));
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
          inputTokens: sum(schema.tokenUsage.inputTokens),
          outputTokens: sum(schema.tokenUsage.outputTokens),
        })
        .from(schema.tokenUsage)
        .where(gte(schema.tokenUsage.date, sinceStr))
        .groupBy(schema.tokenUsage.date)
        .orderBy(schema.tokenUsage.date);

      return results.map((r) => ({
        date: r.date,
        inputTokens: Number(r.inputTokens ?? 0),
        outputTokens: Number(r.outputTokens ?? 0),
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
