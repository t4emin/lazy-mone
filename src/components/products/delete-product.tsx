"use client";
import { useState } from "react";
import { productFetch, errorMessage } from "@/lib/products/client";
export function DeleteProduct({ id, name }: { id: string; name: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function remove() {
    if (
      !window.confirm(
        `ลบสินค้า “${name}” และรูปภาพทั้งหมด? การลบนี้ไม่สามารถย้อนกลับได้`,
      )
    )
      return;
    setPending(true);
    setError("");
    try {
      await productFetch(`/api/products/${id}`, { method: "DELETE" });
      // Discard cached detail/list pages after removing the record.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/products");
    } catch (error) {
      setError(errorMessage(error));
      setPending(false);
    }
  }
  return (
    <div>
      <button className="danger" disabled={pending} onClick={remove}>
        {pending ? "กำลังลบ…" : "Delete"}
      </button>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
