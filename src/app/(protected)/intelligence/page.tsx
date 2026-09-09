import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { getAffiliateIntelligence } from "@/lib/intelligence/service";
import { displayPrice } from "@/lib/products/format";

export default async function IntelligencePage() {
  const { user } = await requireSession();
  const data = await getAffiliateIntelligence(user.id);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">AFFILIATE INTELLIGENCE</p>
          <h1>Performance Insights</h1>
          <p className="muted">
            วิเคราะห์จาก {data.snapshotCount} performance snapshots ที่บันทึกไว้
            โดยไม่ส่งข้อมูลไป AI ภายนอก
          </p>
        </div>
      </div>
      {data.snapshotCount ? (
        <>
          <section className="panel">
            <h2>Recommendations</h2>
            <ul>
              {data.recommendations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <div className="form-grid">
            <section className="panel">
              <h2>Top Products</h2>
              {data.products.map((item) => (
                <p key={item.id}>
                  <strong>{item.name}</strong>
                  <br />
                  <span className="muted">
                    {displayPrice({
                      toString: () => item.commission.toFixed(2),
                    })}{" "}
                    · {item.orders} orders · {item.clicks} clicks
                  </span>
                </p>
              ))}
            </section>
            <section className="panel">
              <h2>Top Content</h2>
              {data.contents.map((item) => (
                <p key={item.id}>
                  <Link href={`/content/${item.contentId}`}>
                    {item.name.slice(0, 100)}
                  </Link>
                  <br />
                  <span className="muted">
                    {item.engagement} engagement · {item.clicks} clicks
                  </span>
                </p>
              ))}
            </section>
          </div>
        </>
      ) : (
        <section className="panel">
          <h2>ยังวิเคราะห์ไม่ได้</h2>
          <p>
            เพิ่มข้อมูลใน <Link href="/analytics">Analytics</Link> ก่อน
            ระบบจะสร้าง recommendations จากตัวเลขจริง
          </p>
        </section>
      )}
    </>
  );
}
