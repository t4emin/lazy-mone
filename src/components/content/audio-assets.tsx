"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { errorMessage, productFetch } from "@/lib/products/client";

const voices = [
  "alloy",
  "ash",
  "ballad",
  "coral",
  "echo",
  "fable",
  "onyx",
  "nova",
  "sage",
  "shimmer",
  "verse",
  "marin",
  "cedar",
] as const;

type AudioAsset = {
  id: string;
  fileName: string;
  voice: string | null;
  language: string | null;
  speed: string | null;
  aiProvider: string | null;
  aiModel: string | null;
};

export function AudioAssets({
  contentId,
  script,
  initialAssets,
  configured,
  provider,
  model,
}: {
  contentId: string;
  script: string;
  initialAssets: AudioAsset[];
  configured: boolean;
  provider: string;
  model: string;
}) {
  const router = useRouter();
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
      const result = await productFetch(
        `/api/content/${contentId}/audio-assets`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: form.get("text"),
            voice: form.get("voice"),
            language: form.get("language"),
            speed: Number(form.get("speed")),
          }),
        },
      );
      if (!result.id) throw new Error("ไม่พบรหัสไฟล์เสียง");
      setMessage("สร้างเสียงและบันทึกเป็น Asset แล้ว");
      router.refresh();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setPending(false);
    }
  }

  async function remove(asset: AudioAsset) {
    if (!window.confirm(`ลบไฟล์เสียง “${asset.fileName}”?`)) return;
    setPending(true);
    setError("");
    try {
      await productFetch(`/api/content/${contentId}/audio-assets/${asset.id}`, {
        method: "DELETE",
      });
      setMessage("ลบไฟล์เสียงแล้ว");
      router.refresh();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="panel audio-panel">
      <h2>AI Voice Over</h2>
      <p className="muted">
        {provider} / {model} · สร้างเสียงจาก Script และบันทึกเป็น Audio Asset
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
          Script
          <textarea
            name="text"
            required
            minLength={1}
            maxLength={4096}
            rows={6}
            defaultValue={script}
          />
        </label>
        <label>
          Voice
          <select name="voice" defaultValue="marin">
            {voices.map((voice) => (
              <option key={voice}>{voice}</option>
            ))}
          </select>
        </label>
        <label>
          Language
          <select name="language" defaultValue="Thai">
            <option>Thai</option>
            <option>English</option>
          </select>
        </label>
        <label>
          Speed
          <select name="speed" defaultValue="1">
            <option value="0.75">0.75×</option>
            <option value="1">1×</option>
            <option value="1.25">1.25×</option>
            <option value="1.5">1.5×</option>
          </select>
        </label>
        {!configured && (
          <p className="error">ยังไม่ได้ตั้ง OPENAI_API_KEY ที่ Server</p>
        )}
        <button disabled={pending || !configured}>
          {pending ? "กำลังสร้างเสียง…" : "Generate Voice Over"}
        </button>
      </form>
      {initialAssets.length ? (
        <div className="audio-grid">
          {initialAssets.map((asset) => (
            <article className="audio-card" key={asset.id}>
              <audio
                controls
                preload="metadata"
                src={`/api/assets/${asset.id}`}
              >
                Your browser cannot play this audio.
              </audio>
              <p className="file-name">
                {asset.voice} · {asset.language} · {asset.speed ?? "1"}×
              </p>
              <p className="muted">
                {asset.aiProvider} / {asset.aiModel}
              </p>
              <button
                className="danger"
                disabled={pending}
                onClick={() => remove(asset)}
              >
                Delete Audio
              </button>
            </article>
          ))}
        </div>
      ) : (
        <p className="muted">ยังไม่มี Audio Asset สำหรับคอนเทนต์นี้</p>
      )}
    </section>
  );
}
