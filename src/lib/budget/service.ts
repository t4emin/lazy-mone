import "server-only";
import { getDb } from "@/lib/db";
import { ProductError } from "@/lib/products/errors";
import type { BudgetInput } from "./validation";

function bangkokMonthStart(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "numeric",
  }).formatToParts(now);
  const value = (name: string) =>
    Number(parts.find((part) => part.type === name)?.value);
  return new Date(
    Date.UTC(value("year"), value("month") - 1, 1) - 7 * 60 * 60 * 1000,
  );
}

export async function getBudgetStatus(userId: string) {
  const db = getDb();
  const [budget, spending] = await Promise.all([
    db.aIBudget.upsert({
      where: { userId },
      update: {},
      create: { userId },
    }),
    db.aIUsage.aggregate({
      where: {
        userId,
        costUnit: "THB",
        createdAt: { gte: bangkokMonthStart() },
      },
      _sum: { estimatedCost: true },
    }),
  ]);
  const spentTHB = Number(spending._sum.estimatedCost?.toString() ?? 0);
  const budgetTHB = Number(budget.monthlyBudgetTHB.toString());
  const percent = budgetTHB ? (spentTHB / budgetTHB) * 100 : 0;
  return {
    budgetTHB,
    warningPercent: budget.warningPercent,
    enabled: budget.enabled,
    spentTHB,
    percent,
  };
}

export async function updateBudget(userId: string, input: BudgetInput) {
  return getDb().aIBudget.upsert({
    where: { userId },
    update: input,
    create: { userId, ...input },
  });
}

export async function assertBudgetAvailable(userId: string) {
  const budget = await getBudgetStatus(userId);
  if (budget.enabled && budget.spentTHB >= budget.budgetTHB)
    throw new ProductError(429, "ใช้ AI budget เดือนนี้ครบแล้ว");
  return budget;
}
