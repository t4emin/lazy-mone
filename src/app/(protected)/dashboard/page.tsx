import { requireSession } from "@/lib/auth/session";
import { countProducts } from "@/lib/products/service";
import { countDrafts } from "@/lib/content/service";
import Link from "next/link";
export default async function Dashboard() {
  const { user } = await requireSession();
  const productCount = await countProducts(user.id);
  const draftCount = await countDrafts(user.id);
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
