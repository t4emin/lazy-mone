import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { listProducts } from "@/lib/products/service";
import { platformLabels, statusLabels } from "@/lib/products/validation";
import { displayDate, displayPrice } from "@/lib/products/format";
import { DeleteProduct } from "@/components/products/delete-product";
export default async function Products() {
  const { user } = await requireSession();
  const products = await listProducts(user.id);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">PRODUCT LIBRARY</p>
          <h1>Products</h1>
          <p className="muted">สินค้าทั้งหมด {products.length} รายการ</p>
        </div>
        <Link className="button-link" href="/products/new">
          Add Product
        </Link>
      </div>
      {products.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {[
                  "Name",
                  "Platform",
                  "Price",
                  "Affiliate Link",
                  "Status",
                  "Created",
                  "Actions",
                ].map((label) => (
                  <th key={label} scope="col">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <Link href={`/products/${product.id}`}>{product.name}</Link>
                  </td>
                  <td>{platformLabels[product.platform]}</td>
                  <td className="nowrap">{displayPrice(product.price)}</td>
                  <td>
                    {product.affiliateUrl ? (
                      <a
                        href={product.affiliateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        เปิดลิงก์ Affiliate ↗
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <span
                      className={`badge ${product.status === "INACTIVE" ? "inactive" : ""}`}
                    >
                      {statusLabels[product.status]}
                    </span>
                  </td>
                  <td>{displayDate(product.createdAt)}</td>
                  <td>
                    <div className="actions">
                      <Link href={`/products/${product.id}`}>View</Link>
                      <Link href={`/products/${product.id}/edit`}>Edit</Link>
                      <DeleteProduct id={product.id} name={product.name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <section className="panel">
          <h2>ยังไม่มีสินค้า</h2>
          <p className="muted">
            เริ่มต้นเพิ่มสินค้าพร้อมลิงก์ Affiliate และรูปภาพ
          </p>
          <Link href="/products/new">เพิ่มสินค้ารายการแรก →</Link>
        </section>
      )}
    </>
  );
}
