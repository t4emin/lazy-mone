"use client";
import { useState, type FormEvent } from "react";
import { productFetch, errorMessage } from "@/lib/products/client";
import {
  contentTypeLabels,
  targetPlatformLabels,
  languageLabels,
  toneLabels,
  defaultGenerationOptions,
} from "@/lib/content/validation";
export function GenerationForm({
  productId,
  configured,
}: {
  productId: string;
  configured: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const input = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const result = await productFetch(`/api/products/${productId}/content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      // Load the persisted draft from the server after successful generation.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign(`/content/${result.id}?generated=1`);
    } catch (error) {
      setError(errorMessage(error));
      setPending(false);
    }
  }
  return (
    <form className="panel product-form" onSubmit={generate}>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {!configured && (
        <p className="error" role="alert">
          ยังไม่ได้เชื่อม AI กรุณาตั้ง OPENAI_API_KEY ในไฟล์ .env ของ Server
          แล้วเปิดหน้านี้ใหม่
        </p>
      )}
      <fieldset disabled={pending}>
        <div className="form-grid">
          {[
            {
              name: "contentType",
              label: "Content Type",
              options: contentTypeLabels,
            },
            {
              name: "targetPlatform",
              label: "Target Platform",
              options: targetPlatformLabels,
            },
            { name: "language", label: "Language", options: languageLabels },
            { name: "tone", label: "Tone", options: toneLabels },
          ].map((field) => (
            <label key={field.name}>
              {field.label}
              <select
                name={field.name}
                defaultValue={
                  defaultGenerationOptions[
                    field.name as keyof typeof defaultGenerationOptions
                  ]
                }
              >
                {Object.entries(field.options).map(([value, label]) => (
                  <option value={value} key={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <label className="full-width">
            Target Audience
            <input
              name="targetAudience"
              maxLength={500}
              placeholder="เช่น คนทำงานที่กำลังมองหาของใช้ประจำวัน"
            />
          </label>
          <label className="full-width">
            Additional Instructions
            <textarea name="additionalInstructions" maxLength={2000} rows={4} />
          </label>
        </div>
        <p className="muted">
          AI จะใช้ข้อมูลสินค้าเพื่อสร้างข้อความ 5 ส่วน
          และบันทึกฉบับร่างเริ่มต้นให้อัตโนมัติ การกด Generate ใช้งาน API
          ตามบัญชีที่เชื่อมไว้
        </p>
        <button disabled={!configured || pending}>
          {pending ? "กำลังสร้างคอนเทนต์…" : "Generate Content"}
        </button>
        {pending && (
          <p role="status">
            กำลังรอ AI กรุณาเปิดหน้านี้ไว้ อาจใช้เวลาประมาณหนึ่งนาที
          </p>
        )}
      </fieldset>
    </form>
  );
}
