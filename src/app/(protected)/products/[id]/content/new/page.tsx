import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { findProduct } from "@/lib/products/service";
import { getAIConfiguration } from "@/lib/ai/ai-service";
import { GenerationForm } from "@/components/content/generation-form";
export default async function CreateContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = await requireSession();
  const product = await findProduct(user.id, (await params).id);
  if (!product) notFound();
  const ai = getAIConfiguration();
  return (
    <>
      <Link href={`/products/${product.id}`}>← Product Details</Link>
      <h1>Create Content</h1>
      <p>
        สินค้า: <strong>{product.name}</strong>
      </p>
      <p className="muted">
        AI: {ai.provider} / {ai.model}
      </p>
      <GenerationForm productId={product.id} configured={ai.configured} />
    </>
  );
}
