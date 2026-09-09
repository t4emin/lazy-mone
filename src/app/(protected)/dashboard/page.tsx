import { requireSession } from "@/lib/auth/session";
import { countProducts } from "@/lib/products/service";
import { countDrafts } from "@/lib/content/service";
import Link from "next/link";
import { getAIUsageSummary } from "@/lib/usage/service";
import { getBudgetStatus } from "@/lib/budget/service";
import { BudgetForm } from "@/components/budget/budget-form";
export default async function Dashboard() {
  const { user } = await requireSession();
  const productCount = await countProducts(user.id);
  const draftCount = await countDrafts(user.id);
  const usage = await getAIUsageSummary(user.id);
  const budget = await getBudgetStatus(user.id);
  return (
    <>
      <p className="eyebrow">WORKSPACE</p>
      <h1>Dashboard</h1>
      <p className="muted">Welcome, {user.username}</p>
      <div className="stats">
        {[
          "Products",
          "Draft Contents",
          "Generated Videos",
          "Published Posts",
        ].map((label) => (
          <section className="stat" key={label}>
            <h2>{label}</h2>
            <p>
              {label === "Products"
                ? productCount
                : label === "Draft Contents"
                  ? draftCount
                  : 0}
            </p>
          </section>
        ))}
      </div>
      <section className="panel">
        <h2>AI Usage</h2>
        <div className="stats">
          {[
            ["Text AI", usage.text],
            ["Image AI", usage.image],
            ["Video AI", usage.video],
            ["Voice AI", usage.voice],
            ["Known Provider Credits", usage.knownCost],
          ].map(([label, value]) => (
            <section className="stat" key={String(label)}>
              <h2>{label}</h2>
              <p>{value}</p>
            </section>
          ))}
        </div>
        <p>
          <Link href="/usage">ดูประวัติ AI usage</Link>
        </p>
      </section>
      <BudgetForm
        initial={{
          monthlyBudgetTHB: budget.budgetTHB,
          warningPercent: budget.warningPercent,
          enabled: budget.enabled,
        }}
      />
      {budget.enabled && budget.percent >= budget.warningPercent && (
        <p className={budget.percent >= 100 ? "error" : "warning"}>
          ใช้ AI Budget ไป {budget.spentTHB.toFixed(2)} /{" "}
          {budget.budgetTHB.toFixed(2)} THB ({budget.percent.toFixed(0)}%)
        </p>
      )}
      <section className="panel">
        <h2>พื้นที่ทำงานพร้อมแล้ว</h2>
        <p className="muted">
          จัดการสินค้าและรูปภาพได้แล้ว เริ่มต้นที่{" "}
          <Link href="/products">คลังสินค้า</Link>
          แล้วกด Create Content เพื่อสร้างข้อความด้วย AI
        </p>
      </section>
    </>
  );
}
