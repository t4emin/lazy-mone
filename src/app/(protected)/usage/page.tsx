import { requireSession } from "@/lib/auth/session";
import { listAIUsage } from "@/lib/usage/service";
import { displayDate } from "@/lib/products/format";

export default async function UsagePage() {
  const { user } = await requireSession();
  const usages = await listAIUsage(user.id);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">AI USAGE</p>
          <h1>AI Usage & Cost</h1>
          <p className="muted">เก็บเฉพาะงานที่สำเร็จหลังเปิดใช้ Phase 13</p>
        </div>
      </div>
      {usages.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Provider / Model</th>
                <th>Input</th>
                <th>Output</th>
                <th>Estimated Cost</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {usages.map((usage) => (
                <tr key={usage.id}>
                  <td>{usage.type}</td>
                  <td>
                    {usage.provider}
                    <br />
                    {usage.model}
                  </td>
                  <td>{usage.inputUsage ?? "—"}</td>
                  <td>{usage.outputUsage ?? "—"}</td>
                  <td>
                    {usage.estimatedCost?.toString() ?? "—"}
                    {usage.costUnit ? ` ${usage.costUnit}` : ""}
                  </td>
                  <td>{displayDate(usage.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <section className="panel">
          <h2>ยังไม่มี AI usage</h2>
          <p>
            เมื่อสร้างข้อความ, ภาพ, วิดีโอ หรือเสียงสำเร็จ รายการจะปรากฏที่นี่
          </p>
        </section>
      )}
    </>
  );
}
