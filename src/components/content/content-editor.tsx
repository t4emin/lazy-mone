"use client";
import { useEffect, useState, type FormEvent } from "react";
import { productFetch, errorMessage } from "@/lib/products/client";
import type { EditContent } from "@/lib/content/validation";

export function ContentEditor({
  id,
  initial,
}: {
  id: string;
  initial: EditContent;
}) {
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  const [pending, setPending] = useState(false);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty && !pending) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, pending]);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await productFetch(`/api/content/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          version: initial.version,
          hashtags: String(data.hashtags).split(/\s+/).filter(Boolean),
        }),
      });
      setDirty(false);
      // Fetch a fresh server-rendered editor and version after saving.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign(`/content/${id}?saved=1`);
    } catch (error) {
      setError(errorMessage(error));
      setPending(false);
    }
  }
  async function remove() {
    if (!window.confirm("ลบคอนเทนต์นี้? การลบไม่สามารถย้อนกลับได้")) return;
    setPending(true);
    setError("");
    try {
      await productFetch(`/api/content/${id}`, { method: "DELETE" });
      setDirty(false);
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/content");
    } catch (error) {
      setError(errorMessage(error));
      setPending(false);
    }
  }
  return (
    <form
      className="panel product-form"
      onSubmit={save}
      onChange={() => setDirty(true)}
    >
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <fieldset disabled={pending}>
        <div className="form-grid">
          <label className="full-width">
            Hook
            <textarea
              name="hook"
              defaultValue={initial.hook}
              required
              maxLength={1000}
              rows={3}
            />
          </label>
          <label className="full-width">
            Video Script
            <textarea
              name="script"
              defaultValue={initial.script}
              required
              maxLength={12000}
              rows={10}
            />
          </label>
          <label className="full-width">
            Caption
            <textarea
              name="caption"
              defaultValue={initial.caption}
              required
              maxLength={5000}
              rows={6}
            />
          </label>
          <label className="full-width">
            CTA
            <textarea
              name="cta"
              defaultValue={initial.cta}
              required
              maxLength={1000}
              rows={3}
            />
          </label>
          <label className="full-width">
            Hashtags
            <textarea
              name="hashtags"
              defaultValue={initial.hashtags.join(" ")}
              required
              maxLength={3030}
              rows={3}
            />
            <span className="muted">
              คั่นด้วยช่องว่างหรือขึ้นบรรทัดใหม่ สูงสุด 30 แท็ก
            </span>
          </label>
          <label>
            Status
            <select name="status" defaultValue={initial.status}>
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
            </select>
          </label>
        </div>
        <div className="actions">
          <button type="submit">
            {pending ? "กำลังบันทึก…" : "Save Draft / Status"}
          </button>
          <button className="danger" type="button" onClick={remove}>
            Delete Content
          </button>
          {dirty && <span className="muted">มีการแก้ไขที่ยังไม่บันทึก</span>}
        </div>
      </fieldset>
    </form>
  );
}
