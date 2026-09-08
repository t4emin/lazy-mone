import { requireSession } from "@/lib/auth/session";
import Link from "next/link";
import { listContents } from "@/lib/content/service";
import {
  contentTypeLabels,
  targetPlatformLabels,
} from "@/lib/content/validation";
import { displayDate } from "@/lib/products/format";
export default async function Content() {
  const { user } = await requireSession();
  const contents = await listContents(user.id);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">TEXT CONTENT</p>
          <h1>Content</h1>
          <p className="muted">คอนเทนต์ทั้งหมด {contents.length} รายการ</p>
        </div>
        <Link className="button-link" href="/products">
          เลือกสินค้าเพื่อสร้างคอนเทนต์
        </Link>
      </div>
      {contents.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {[
                  "Product / Hook",
                  "Content Type",
                  "Platform",
                  "Status",
                  "AI",
                  "Updated",
                  "Actions",
                ].map((label) => (
                  <th key={label}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contents.map((content) => (
                <tr key={content.id}>
                  <td>
                    {content.product.name}
                    <p className="muted">{content.hook.slice(0, 120)}</p>
                  </td>
                  <td>
                    {
                      contentTypeLabels[
                        content.contentType as keyof typeof contentTypeLabels
                      ]
                    }
                  </td>
                  <td>
                    {
                      targetPlatformLabels[
                        content.targetPlatform as keyof typeof targetPlatformLabels
                      ]
                    }
                  </td>
                  <td>
                    <span className="badge">
                      {content.status === "ready" ? "Ready" : "Draft"}
                    </span>
                  </td>
                  <td>
                    {content.aiProvider}
                    <br />
                    {content.aiModel}
                  </td>
                  <td>{displayDate(content.updatedAt)}</td>
                  <td>
                    <Link href={`/content/${content.id}`}>Open Draft</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <section className="panel">
          <h2>ยังไม่มีคอนเทนต์</h2>
          <p>
            เลือกสินค้าจาก <Link href="/products">Product Library</Link> แล้วกด
            Create Content
          </p>
        </section>
      )}
    </>
  );
}
