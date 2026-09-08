import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { findProduct } from "@/lib/products/service";
import { ProductForm } from "@/components/products/product-form";
export default async function EditProduct({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = await requireSession();
  const product = await findProduct(user.id, (await params).id);
  if (!product) notFound();
  return (
    <>
      <Link href={`/products/${product.id}`}>← Product Details</Link>
      <h1>Edit Product</h1>
      <ProductForm
        id={product.id}
        initial={{
          name: product.name,
          platform: product.platform,
          productUrl: product.productUrl ?? "",
          affiliateUrl: product.affiliateUrl ?? "",
          price: product.price?.toString() ?? "",
          description: product.description ?? "",
          features: product.features ?? "",
          notes: product.notes ?? "",
          status: product.status,
        }}
      />
    </>
  );
}
