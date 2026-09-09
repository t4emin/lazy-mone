import { z } from "zod";

export const budgetSchema = z
  .object({
    monthlyBudgetTHB: z.number().positive().max(1_000_000),
    warningPercent: z.number().int().min(1).max(99),
    enabled: z.boolean(),
  })
  .strict();

export type BudgetInput = z.infer<typeof budgetSchema>;
