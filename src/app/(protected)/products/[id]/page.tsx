import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { findProduct } from "@/lib/products/service";
import { platformLabels, statusLabels } from "@/lib/products/validation";
import { displayDate, displayPrice } from "@/lib/products/format";
import { DeleteProduct } from "@/components/products/delete-product";
import { ImageManager } from "@/components/products/image-manager";
export default async function ProductDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = await requireSession();
  const product = await findProduct(user.id, (await params).id);
  if (!product) notFound();
  return (
    <>
      <Link href="/products">← Products</Link>
      <div className="page-heading">
        <div>
          <p className="eyebrow">PRODUCT DETAILS</p>
          <h1>{product.name}</h1>
          <p className="muted">
            {platformLabels[product.platform]} · {statusLabels[product.status]}
          </p>
        </div>
        <div className="actions">
          <Link className="button-link" href={`/products/${product.id}/edit`}>
            Edit
          </Link>
          <Link
            className="button-link"
            href={`/products/${product.id}/content/new`}
          >
            Create Content
          </Link>
          <DeleteProduct id={product.id} name={product.name} />
        </div>
      </div>
      <section className="panel">
        <h2>Product Info</h2>
        <dl className="product-info">
          <dt>Price</dt>
          <dd>{displayPrice(product.price)}</dd>
          <dt>Product URL</dt>
          <dd>
            {product.productUrl ? (
              <a
                href={product.productUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {product.productUrl}
              </a>
            ) : (
              "—"
            )}
          </dd>
          <dt>Affiliate URL</dt>
          <dd>
            {product.affiliateUrl ? (
              <a
                href={product.affiliateUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {product.affiliateUrl}
              </a>
            ) : (
              "—"
            )}
          </dd>
          <dt>Description</dt>
          <dd>{product.description || "—"}</dd>
          <dt>Product Features</dt>
          <dd>{product.features || "—"}</dd>
          <dt>Notes</dt>
          <dd>{product.notes || "—"}</dd>
          <dt>Created</dt>
          <dd>{displayDate(product.createdAt)}</dd>
          <dt>Updated</dt>
          <dd>{displayDate(product.updatedAt)}</dd>
        </dl>
      </section>
      <ImageManager
        productId={product.id}
        assets={product.assets.map(({ id, fileName, isPrimary }) => ({
          id,
          fileName,
          isPrimary,
        }))}
      />
    </>
  );
}
