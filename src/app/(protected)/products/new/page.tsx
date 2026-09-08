import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { ProductForm } from "@/components/products/product-form";
export default async function NewProduct() {
  await requireSession();
  return (
    <>
      <Link href="/products">← Products</Link>
      <h1>Add Product</h1>
      <ProductForm />
    </>
  );
}
