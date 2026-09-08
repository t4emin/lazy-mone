"use client";
import Image from "next/image";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { productFetch, errorMessage } from "@/lib/products/client";
import {
  MAX_IMAGE_BYTES,
  MAX_PRODUCT_IMAGES,
  MAX_UPLOAD_FILES,
} from "@/lib/products/validation";

export type ImageItem = { id: string; fileName: string; isPrimary: boolean };
export function ImageManager({
  productId,
  assets,
}: {
  productId: string;
  assets: ImageItem[];
}) {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const [selected, setSelected] = useState<{ file: File; url: string }[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  useEffect(
    () => () => {
      selected.forEach((image) => URL.revokeObjectURL(image.url));
    },
    [selected],
  );
  function select(files: File[]) {
    setError("");
    setMessage("");
    setSelected([]);
    if (
      files.length > MAX_UPLOAD_FILES ||
      files.length + assets.length > MAX_PRODUCT_IMAGES
    ) {
      setError("อัปโหลดครั้งละไม่เกิน 5 รูป และรวมไม่เกิน 10 รูปต่อสินค้า");
      form.current?.reset();
      return;
    }
    if (
      files.some(
        (file) =>
          file.size > MAX_IMAGE_BYTES ||
          !["image/jpeg", "image/png", "image/webp"].includes(file.type),
      )
    ) {
      setError("รองรับ JPG, JPEG, PNG, WebP ขนาดไม่เกิน 5 MB ต่อรูป");
      form.current?.reset();
      return;
    }
    setSelected(
      files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    );
  }
  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected.length) return;
    setPending(true);
    setError("");
    setMessage("");
    try {
      const body = new FormData();
      selected.forEach((image) => body.append("images", image.file));
      await productFetch(`/api/products/${productId}/images`, {
        method: "POST",
        body,
      });
      setSelected([]);
      form.current?.reset();
      setMessage("อัปโหลดรูปสำเร็จ");
      router.refresh();
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setPending(false);
    }
  }
  async function change(asset: ImageItem, method: "PATCH" | "DELETE") {
    if (method === "DELETE" && !window.confirm(`ลบรูป “${asset.fileName}”?`))
      return;
    setPending(true);
    setError("");
    setMessage("");
    try {
      await productFetch(`/api/products/${productId}/images/${asset.id}`, {
        method,
      });
      setMessage(method === "DELETE" ? "ลบรูปสำเร็จ" : "ตั้งรูปหลักแล้ว");
      router.refresh();
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="panel image-panel">
      <h2>
        Product Images ({assets.length}/{MAX_PRODUCT_IMAGES})
      </h2>
      <p className="muted">
        JPG, JPEG, PNG, WebP • ไม่เกิน 5 MB ต่อรูป • ครั้งละไม่เกิน 5 รูป
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
      {assets.length ? (
        <div className="image-grid">
          {assets.map((asset) => (
            <article
              className="image-card"
              key={asset.id}
              aria-label={asset.fileName}
            >
              <a
                href={`/api/assets/${asset.id}`}
                target="_blank"
                rel="noopener noreferrer"
                title="เปิดรูปขนาดเต็ม"
              >
                <Image
                  src={`/api/assets/${asset.id}`}
                  alt={asset.fileName}
                  width={280}
                  height={200}
                  unoptimized
                />
              </a>
              <p className="file-name">{asset.fileName}</p>
              <div className="image-actions">
                {asset.isPrimary ? (
                  <span className="badge">Main Image</span>
                ) : (
                  <button
                    className="secondary"
                    disabled={pending}
                    onClick={() => change(asset, "PATCH")}
                  >
                    Set Main Image
                  </button>
                )}
                <button
                  className="danger"
                  disabled={pending}
                  onClick={() => change(asset, "DELETE")}
                >
                  Delete Image
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="muted">ยังไม่มีรูปสินค้า</p>
      )}
      <form ref={form} onSubmit={upload} className="upload-form">
        <label htmlFor="images">เลือกไฟล์รูปภาพ</label>
        <input
          id="images"
          type="file"
          name="images"
          accept=".jpg,.jpeg,.png,.webp"
          multiple
          disabled={pending || assets.length >= MAX_PRODUCT_IMAGES}
          onChange={(event) => select(Array.from(event.target.files ?? []))}
        />
        {selected.length > 0 && (
          <div className="image-grid preview-grid" aria-label="Upload preview">
            {selected.map((image, index) => (
              <figure key={image.url}>
                <Image
                  src={image.url}
                  alt={`Preview ${index + 1}: ${image.file.name}`}
                  width={180}
                  height={130}
                  unoptimized
                />
                <figcaption>{image.file.name}</figcaption>
              </figure>
            ))}
          </div>
        )}
        <button disabled={pending || !selected.length}>
          {pending ? "กำลังดำเนินการ…" : "Upload Images"}
        </button>
      </form>
    </section>
  );
}
