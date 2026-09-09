import { requireSession } from "@/lib/auth/session";
import { listContents } from "@/lib/content/service";
import { listAnalytics } from "@/lib/analytics/service";
import { AnalyticsForm } from "@/components/analytics/analytics-form";
import { displayDate, displayPrice } from "@/lib/products/format";
export default async function AnalyticsPage() {
  const { user } = await requireSession();
  const [contents, snapshots] = await Promise.all([
    listContents(user.id),
    listAnalytics(user.id),
  ]);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">PERFORMANCE</p>
          <h1>Analytics</h1>
          <p className="muted">
            บันทึกตัวเลขจากแต่ละแพลตฟอร์มเพื่อเปรียบเทียบ Product และ Content
          </p>
        </div>
      </div>
      <AnalyticsForm
        contents={contents.map((content) => ({
          id: content.id,
          label: `${content.product.name} · ${content.hook.slice(0, 60)}`,
          platform: content.targetPlatform,
        }))}
      />
      {snapshots.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product / Content</th>
                <th>Platform</th>
                <th>Views</th>
                <th>Likes</th>
                <th>Comments</th>
                <th>Shares</th>
                <th>Clicks</th>
                <th>Orders</th>
                <th>Commission</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {snapshots.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.product.name}
                    <p className="muted">{item.content.hook.slice(0, 80)}</p>
                  </td>
                  <td>{item.platform}</td>
                  <td>{item.views}</td>
                  <td>{item.likes}</td>
                  <td>{item.comments}</td>
                  <td>{item.shares}</td>
                  <td>{item.clicks}</td>
                  <td>{item.orders}</td>
                  <td>{displayPrice(item.commission)}</td>
                  <td>{displayDate(item.collectedOn)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="muted">ยังไม่มีข้อมูล performance</p>
      )}
    </>
  );
}
