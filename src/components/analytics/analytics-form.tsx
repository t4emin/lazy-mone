"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { errorMessage, productFetch } from "@/lib/products/client";
const names = [
  "views",
  "likes",
  "comments",
  "shares",
  "clicks",
  "orders",
] as const;
export function AnalyticsForm({
  contents,
}: {
  contents: { id: string; label: string; platform: string }[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    contentId: contents[0]?.id ?? "",
    platform: contents[0]?.platform ?? "facebook",
    collectedOn: new Date().toISOString().slice(0, 10),
    views: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    clicks: 0,
    orders: 0,
    commission: 0,
  });
  const save = async () => {
    try {
      await productFetch("/api/analytics", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      setMessage("บันทึก analytics แล้ว");
      router.refresh();
    } catch (error) {
      setMessage(errorMessage(error));
    }
  };
  return (
    <section className="panel">
      <h2>บันทึก Performance</h2>
      {contents.length ? (
        <>
          <label>
            Content
            <select
              value={form.contentId}
              onChange={(event) => {
                const item = contents.find(
                  (content) => content.id === event.target.value,
                );
                setForm({
                  ...form,
                  contentId: event.target.value,
                  platform: item?.platform ?? form.platform,
                });
              }}
            >
              {contents.map((content) => (
                <option key={content.id} value={content.id}>
                  {content.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Date
            <input
              type="date"
              value={form.collectedOn}
              onChange={(event) =>
                setForm({ ...form, collectedOn: event.target.value })
              }
            />
          </label>
          <label>
            Platform
            <input
              value={form.platform}
              onChange={(event) =>
                setForm({ ...form, platform: event.target.value })
              }
            />
          </label>
          <div className="form-grid">
            {names.map((name) => (
              <label key={name}>
                {name}
                <input
                  type="number"
                  min="0"
                  value={form[name]}
                  onChange={(event) =>
                    setForm({ ...form, [name]: Number(event.target.value) })
                  }
                />
              </label>
            ))}
            <label>
              Commission (THB)
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.commission}
                onChange={(event) =>
                  setForm({ ...form, commission: Number(event.target.value) })
                }
              />
            </label>
          </div>
          <p>
            <button type="button" onClick={save}>
              Save Performance
            </button>
          </p>
        </>
      ) : (
        <p className="muted">สร้าง Content ก่อนจึงจะบันทึก Performance ได้</p>
      )}
      {message && (
        <p
          role="status"
          className={message === "บันทึก analytics แล้ว" ? "success" : "error"}
        >
          {message}
        </p>
      )}
    </section>
  );
}
