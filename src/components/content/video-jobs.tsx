"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { errorMessage, productFetch } from "@/lib/products/client";
type Asset = { id: string; fileName: string; type: string };
type Job = {
  id: string;
  status: string;
  progress: number;
  prompt: string;
  durationSeconds: number;
  aspectRatio: string;
  model: string;
  errorMessage: string | null;
  outputAssetId: string | null;
  createdAt: string;
  estimatedCost: string | null;
};
export function VideoJobs({
  contentId,
  assets,
  initialJobs,
  configured,
  provider,
  model,
}: {
  contentId: string;
  assets: Asset[];
  initialJobs: Job[];
  configured: boolean;
  provider: string;
  model: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [referenceAssetId, setReferenceAssetId] = useState("");
  const selectedAsset = assets.find((asset) => asset.id === referenceAssetId);
  const activeJobs = initialJobs.filter(
    (job) => job.status === "pending" || job.status === "processing",
  );
  const completedJobs = initialJobs.filter((job) => job.outputAssetId);
  useEffect(() => {
    if (!activeJobs.length || pending) return;
    const timer = window.setInterval(async () => {
      await Promise.allSettled(
        activeJobs.map((job) =>
          productFetch(`/api/video-jobs/${job.id}`, { method: "PATCH" }),
        ),
      );
      router.refresh();
    }, 10_000);
    return () => window.clearInterval(timer);
  }, [activeJobs, pending, router]);
  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");
    try {
      const f = new FormData(e.currentTarget);
      const r = await productFetch(`/api/content/${contentId}/video-jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: f.get("prompt"),
          durationSeconds: Number(f.get("durationSeconds")),
          aspectRatio: f.get("aspectRatio"),
          ...(f.get("referenceAssetId")
            ? { referenceAssetId: f.get("referenceAssetId") }
            : {}),
        }),
      });
      if (!r.id) throw new Error("ไม่พบรหัสงาน");
      router.refresh();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setPending(false);
    }
  }
  async function action(id: string, retry = false) {
    setPending(true);
    setError("");
    try {
      await productFetch(`/api/video-jobs/${id}`, {
        method: retry ? "POST" : "PATCH",
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
      <h2>AI Video Jobs</h2>
      <p className="muted">
        {provider} / {model} · คลิป 5 หรือ 10 วินาที
      </p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <form className="product-form" onSubmit={create}>
        <label className="full-width">
          Video Prompt
          <textarea
            name="prompt"
            required
            minLength={10}
            maxLength={4000}
            rows={4}
          />
        </label>
        <label>
          Duration
          <select name="durationSeconds" defaultValue="5">
            <option value="5">5 seconds</option>
            <option value="10">10 seconds</option>
          </select>
        </label>
        <label>
          Aspect Ratio
          <select name="aspectRatio" defaultValue="9:16">
            <option value="9:16">9:16</option>
            <option value="16:9">16:9</option>
          </select>
        </label>
        <label>
          Reference Asset
          <select
            name="referenceAssetId"
            value={referenceAssetId}
            onChange={(event) => setReferenceAssetId(event.target.value)}
          >
            <option value="">Prompt only</option>
            {assets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.fileName} · {a.type}
              </option>
            ))}
          </select>
        </label>
        {selectedAsset && (
          <figure className="video-reference-preview">
            <Image
              src={`/api/assets/${selectedAsset.id}`}
              alt={`Reference: ${selectedAsset.fileName}`}
              width={240}
              height={160}
              unoptimized
            />
            <figcaption>
              ใช้ภาพนี้เป็น Reference: {selectedAsset.fileName}
            </figcaption>
          </figure>
        )}
        {!configured && (
          <p className="error">ยังไม่ได้ตั้ง RUNWAYML_API_SECRET ที่ Server</p>
        )}
        <button disabled={pending || !configured}>
          {pending ? "กำลังส่งงาน…" : "Create Video Job"}
        </button>
      </form>
      {initialJobs.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Status</th>
                <th>Settings</th>
                <th>Prompt</th>
                <th>Created</th>
                <th>Est. Cost</th>
                <th>Output</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {initialJobs.map((j) => (
                <tr key={j.id}>
                  <td>
                    <div className={`video-status video-status-${j.status}`}>
                      <progress
                        className="video-job-progress"
                        value={j.progress}
                        max={100}
                        aria-label={`Video progress ${j.progress}%`}
                      />
                      <span>
                        {j.status} {j.progress}%
                      </span>
                      {j.errorMessage && (
                        <details className="video-error-details">
                          <summary>ดูรายละเอียดข้อผิดพลาด</summary>
                          <p>{j.errorMessage}</p>
                        </details>
                      )}
                    </div>
                  </td>
                  <td>
                    {j.model}
                    <br />
                    {j.durationSeconds}s · {j.aspectRatio}
                  </td>
                  <td>{j.prompt.slice(0, 120)}</td>
                  <td>{j.createdAt}</td>
                  <td>
                    {j.estimatedCost === null
                      ? "—"
                      : `${j.estimatedCost} credits`}
                  </td>
                  <td>
                    {j.outputAssetId ? (
                      <a
                        href={`/api/assets/${j.outputAssetId}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open MP4
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    {j.status === "failed" ? (
                      <button
                        disabled={pending}
                        onClick={() => action(j.id, true)}
                      >
                        Retry
                      </button>
                    ) : j.status !== "completed" ? (
                      <button
                        className="secondary"
                        disabled={pending}
                        onClick={() => action(j.id)}
                      >
                        Refresh Status
                      </button>
                    ) : (
                      "Done"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="muted">ยังไม่มี Video Job</p>
      )}
      {completedJobs.length > 0 && (
        <section className="video-gallery" aria-labelledby="generated-videos">
          <h3 id="generated-videos">Generated Videos</h3>
          <div className="video-gallery-grid">
            {completedJobs.map((job) => (
              <article className="video-gallery-card" key={job.id}>
                <video
                  controls
                  preload="metadata"
                  src={`/api/assets/${job.outputAssetId}`}
                >
                  Your browser cannot preview this video.
                </video>
                <p className="file-name">
                  {job.model} · {job.durationSeconds}s · {job.aspectRatio}
                </p>
                <a
                  href={`/api/assets/${job.outputAssetId}`}
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
