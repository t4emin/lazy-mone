"use client";
import { useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { errorMessage, productFetch } from "@/lib/products/client";
type Asset = { id: string; fileName: string; type: string };
export function VideoComposer({
  contentId,
  assets,
  videos,
}: {
  contentId: string;
  assets: Asset[];
  videos: Asset[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const images = assets.filter(
    (a) => a.type === "product_image" || a.type === "generated_image",
  );
  const audio = assets.filter((a) => a.type === "audio");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");
    try {
      const f = new FormData(e.currentTarget);
      const r = await productFetch(`/api/content/${contentId}/compose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageAssetIds: f.getAll("imageAssetIds"),
          audioAssetId: f.get("audioAssetId") || undefined,
          text: f.get("text"),
          durationSeconds: Number(f.get("durationSeconds")),
          aspectRatio: f.get("aspectRatio"),
          effect: f.get("effect"),
        }),
      });
      if (!r.id) throw new Error("ไม่พบไฟล์วิดีโอ");
      router.refresh();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="panel image-panel">
      <h2>Internal Video Composer</h2>
      <p className="muted">
        ประกอบ MP4 จากรูปและเสียงในระบบด้วย FFmpeg โดยไม่ใช้ AI Video credit
      </p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <form className="product-form" onSubmit={submit}>
        <fieldset disabled={pending}>
          <legend>Scenes (เลือกอย่างน้อย 1 รูป · เรียงตามตำแหน่ง)</legend>
          <div className="reference-asset-grid">
            {images.map((asset, index) => (
              <label className="reference-asset-card" key={asset.id}>
                <input
                  type="checkbox"
                  name="imageAssetIds"
                  value={asset.id}
                  defaultChecked={index === 0}
                />
                <Image
                  src={`/api/assets/${asset.id}`}
                  alt={asset.fileName}
                  width={180}
                  height={130}
                  unoptimized
                />
                <span>{asset.fileName}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <label>
          Voice Over
          <select name="audioAssetId">
            <option value="">ไม่มีเสียง</option>
            {audio.map((a) => (
              <option key={a.id} value={a.id}>
                {a.fileName}
              </option>
            ))}
          </select>
        </label>
        <label>
          Scene Duration
          <select name="durationSeconds" defaultValue="3">
            <option value="2">2 seconds</option>
            <option value="3">3 seconds</option>
            <option value="5">5 seconds</option>
            <option value="8">8 seconds</option>
          </select>
        </label>
        <label>
          Aspect Ratio
          <select name="aspectRatio" defaultValue="9:16">
            <option>9:16</option>
            <option>16:9</option>
          </select>
        </label>
        <label>
          Effect
          <select name="effect" defaultValue="fade">
            <option value="fade">Fade</option>
            <option value="zoom">Slow Zoom</option>
          </select>
        </label>
        <label className="full-width">
          Text Overlay (ไม่บังคับ)
          <input
            name="text"
            maxLength={300}
            placeholder="ข้อความสั้นบนวิดีโอ"
          />
        </label>
        <button disabled={pending || !images.length}>
          {pending ? "กำลังประกอบวิดีโอ…" : "Compose MP4"}
        </button>
      </form>
      {videos.length > 0 && (
        <section className="video-gallery">
          <h3>Composed Videos</h3>
          <div className="video-gallery-grid">
            {videos.map((video) => (
              <article className="video-gallery-card" key={video.id}>
                <video
                  controls
                  preload="metadata"
                  src={`/api/assets/${video.id}`}
                >
                  Your browser cannot preview this video.
                </video>
                <a
                  href={`/api/assets/${video.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open MP4
                </a>
              </article>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
