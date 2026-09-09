"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { errorMessage, productFetch } from "@/lib/products/client";

export function RemoveSocialAccount({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  async function remove() {
    if (
      !window.confirm(`Remove ${name}? งานที่ตั้งเวลาไว้กับเพจนี้จะถูกยกเลิก`)
    )
      return;
    try {
      await productFetch(`/api/social/accounts/${id}`, { method: "DELETE" });
      router.refresh();
    } catch (reason) {
      setError(errorMessage(reason));
    }
  }
  return (
    <>
      {error && <p className="error">{error}</p>}
      <button type="button" className="danger" onClick={remove}>
        Remove
      </button>
    </>
  );
}
