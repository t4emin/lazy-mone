import Link from "next/link";
export default function ProductNotFound() {
  return (
    <section className="panel">
      <h1>ไม่พบสินค้า</h1>
      <p>สินค้าอาจถูกลบแล้ว หรือคุณไม่มีสิทธิ์เข้าถึง</p>
      <Link href="/products">กลับไปยัง Products</Link>
    </section>
  );
}
