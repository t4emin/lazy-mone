"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  emptyProduct,
  platformLabels,
  statusLabels,
  type ProductFormValues,
} from "@/lib/products/validation";
import { productFetch, errorMessage } from "@/lib/products/client";

export function ProductForm({
  id,
  initial = emptyProduct,
}: {
  id?: string;
  initial?: ProductFormValues;
}) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setPending(true);
    setError("");
    try {
      const result = await productFetch(
        id ? `/api/products/${id}` : "/api/products",
        {
          method: id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        },
      );
      // Re-enter through the server after a mutation to discard cached product pages.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign(`/products/${result.id}`);
    } catch (error) {
      setError(errorMessage(error));
      setPending(false);
    }
  }
  return (
    <form onSubmit={submit} className="panel product-form">
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <fieldset disabled={pending}>
        <div className="form-grid">
          <label>
            Product Name *
            <input
              name="name"
              required
              maxLength={200}
              defaultValue={initial.name}
            />
          </label>
          <label>
            Platform *
            <select name="platform" required defaultValue={initial.platform}>
              {Object.entries(platformLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Product URL
            <input
              name="productUrl"
              type="url"
              maxLength={2048}
              defaultValue={initial.productUrl}
              placeholder="https://"
            />
          </label>
          <label>
            Affiliate URL
            <input
              name="affiliateUrl"
              type="url"
              maxLength={2048}
              defaultValue={initial.affiliateUrl}
              placeholder="https://"
            />
          </label>
          <label>
            Price (THB)
            <input
              name="price"
              type="number"
              min="0"
              max="9999999999.99"
              step="0.01"
              defaultValue={initial.price}
            />
          </label>
          <label>
            Status
            <select name="status" defaultValue={initial.status}>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="full-width">
            Description
            <textarea
              name="description"
              maxLength={10000}
              rows={4}
              defaultValue={initial.description}
            />
          </label>
          <label className="full-width">
            Product Features
            <textarea
              name="features"
              maxLength={10000}
              rows={4}
              defaultValue={initial.features}
            />
          </label>
          <label className="full-width">
            Notes
            <textarea
              name="notes"
              maxLength={10000}
              rows={3}
              defaultValue={initial.notes}
            />
          </label>
        </div>
        {!id && (
          <p className="muted">
            บันทึกสินค้าก่อน แล้วเพิ่มรูปภาพได้ในหน้ารายละเอียดสินค้า
          </p>
        )}
        <div className="actions">
          <button type="submit">
            {pending ? "กำลังบันทึก…" : "Save Product"}
          </button>
          <Link href={id ? `/products/${id}` : "/products"}>Cancel</Link>
        </div>
      </fieldset>
    </form>
  );
}
