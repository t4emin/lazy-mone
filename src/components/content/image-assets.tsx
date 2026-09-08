"use client";
import Image from "next/image";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { productFetch, errorMessage } from "@/lib/products/client";
const ratios = ["1:1", "4:5", "9:16", "16:9"] as const;
type Asset = {
  id: string;
  fileName: string;
  prompt: string | null;
  aspectRatio: string | null;
  aiProvider: string | null;
  aiModel: string | null;
};
type Reference = {
  id: string;
  fileName: string;
  isPrimary: boolean;
  type: string;
};
export function ImageAssets({
  contentId,
  productId,
  references,
  initialAssets,
  configured,
}: {
  contentId: string;
  productId: string;
  references: Reference[];
  initialAssets: Asset[];
  configured: boolean;
}) {
  const router = useRouter();
  const [assets, setAssets] = useState(initialAssets);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    setMessage("");
    try {
      const body = {
        prompt: String(form.get("prompt")),
        aspectRatio: form.get("aspectRatio"),
        referenceAssetIds: form.getAll("referenceAssetIds"),
      };
      const result = await productFetch(`/api/content/${contentId}/assets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!result.id) throw new Error("ไม่พบรหัสภาพที่สร้าง");
      setMessage("");
      router.push(`/content/${contentId}?image=${result.id}`);
      router.refresh();
    } catch (e) {
      setError(errorMessage(e));
      setPending(false);
    }
  }
  async function remove(asset: Asset) {
    if (!window.confirm(`ลบภาพ AI “${asset.fileName}”?`)) return;
    setPending(true);
    setError("");
    try {
      await productFetch(`/api/content/${contentId}/assets/${asset.id}`, {
        method: "DELETE",
      });
      setAssets((items) => items.filter((item) => item.id !== asset.id));
      setMessage("ลบภาพแล้ว");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setPending(false);
    }
  }
  async function removeProductImage(reference: Reference) {
    if (
      !window.confirm(`ลบรูป “${reference.fileName}” ออกจาก Product Library?`)
    )
      return;
    setPending(true);
    setError("");
    try {
      await productFetch(`/api/products/${productId}/images/${reference.id}`, {
        method: "DELETE",
      });
      router.refresh();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="panel image-panel">
      <h2>AI Image Assets</h2>
      <p className="muted">
        เลือกรูปสินค้าหรือภาพ AI เป็นรูปอ้างอิงได้สูงสุด 4 รูป
        ภาพที่สร้างจะผูกกับ Content นี้
      </p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="success" role="status">
          {message}
        </p>
      )}
      <form className="product-form" onSubmit={generate}>
        <label className="full-width">
          Prompt
          <textarea
            name="prompt"
            required
            minLength={10}
            maxLength={4000}
            rows={4}
            placeholder="เช่น ภาพสินค้าแบบสตูดิโอ แสงนุ่ม เน้นรายละเอียดของสินค้า ไม่มีข้อความหรือโลโก้"
          />
        </label>
        <label>
          Aspect Ratio
          <select name="aspectRatio" defaultValue="1:1">
            {ratios.map((ratio) => (
              <option key={ratio}>{ratio}</option>
            ))}
          </select>
        </label>
        <fieldset disabled={pending || !configured}>
          <legend>Reference Product Images (ไม่บังคับ)</legend>
          {references.length ? (
            <div className="reference-asset-grid">
              {references.map((asset) => (
                <label className="reference-asset-card" key={asset.id}>
                  <input
                    type="checkbox"
                    name="referenceAssetIds"
                    value={asset.id}
                  />
                  <Image
                    src={`/api/assets/${asset.id}`}
                    alt={`Reference: ${asset.fileName}`}
                    width={180}
                    height={130}
                    unoptimized
                  />
                  <span>
                    {asset.fileName}
                    {asset.isPrimary ? " · Main Image" : ""} · {asset.type}
                  </span>
                  {asset.type === "product_image" && (
                    <button
                      className="danger"
                      type="button"
                      disabled={pending}
                      onClick={(event) => {
                        event.preventDefault();
                        removeProductImage(asset);
                      }}
                    >
                      Delete Image
                    </button>
                  )}
                </label>
              ))}
            </div>
          ) : (
            <p className="muted">สินค้านี้ยังไม่มีรูปอ้างอิง</p>
          )}
        </fieldset>
        {!configured && (
          <p className="error">ยังไม่ได้ตั้ง OPENAI_API_KEY ที่ Server</p>
        )}
        <button disabled={pending || !configured}>
          {pending ? "กำลังสร้างภาพ…" : "Generate AI Image"}
        </button>
      </form>
      {assets.length ? (
        <div className="image-grid">
          {assets.map((asset) => (
            <article className="image-card" key={asset.id}>
              <a
                href={`/api/assets/${asset.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src={`/api/assets/${asset.id}`}
                  alt={asset.prompt ?? asset.fileName}
                  width={280}
                  height={200}
                  unoptimized
                />
              </a>
              <p className="file-name">
                {asset.aspectRatio} · {asset.aiProvider} / {asset.aiModel}
              </p>
              <details>
                <summary>Prompt</summary>
                <p>{asset.prompt}</p>
              </details>
              <button
                className="danger"
                disabled={pending}
                onClick={() => remove(asset)}
              >
                Delete Image
              </button>
            </article>
          ))}
        </div>
      ) : (
        <p className="muted">ยังไม่มีภาพ AI สำหรับคอนเทนต์นี้</p>
      )}
    </section>
  );
}
