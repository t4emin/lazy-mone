"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { errorMessage, productFetch } from "@/lib/products/client";

type Account = { id: string; accountName: string };
type Job = {
  id: string;
  caption: string;
  status: string;
  externalPostId: string | null;
  errorMessage: string | null;
  publishedAt: string | null;
  createdAt: string;
};

export function FacebookPublisher({
  contentId,
  ready,
  accounts,
  initialCaption,
  jobs,
}: {
  contentId: string;
  ready: boolean;
  accounts: Account[];
  initialCaption: string;
  jobs: Job[];
}) {
  const router = useRouter();
  const [caption, setCaption] = useState(initialCaption);
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function publish() {
    setSubmitting(true);
    setMessage(null);
    try {
      await productFetch(`/api/content/${contentId}/publish/facebook`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ socialAccountId: accountId, caption }),
      });
      setMessage("เผยแพร่ไป Facebook แล้ว");
      router.refresh();
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="panel">
      <h2>Publish to Facebook</h2>
      <p className="muted">โพสต์ข้อความนี้ลง Facebook Page ที่เชื่อมต่อไว้</p>
      {!ready && (
        <p className="error">ตั้งสถานะคอนเทนต์เป็น ready ก่อนจึงจะเผยแพร่ได้</p>
      )}
      {!accounts.length && (
        <p className="error">
          ยังไม่มี Facebook Page ที่เชื่อมต่อไว้ ไปเชื่อมต่อที่ Settings ก่อน
        </p>
      )}
      <label>
        Facebook Page
        <select
          value={accountId}
          onChange={(event) => setAccountId(event.target.value)}
          disabled={!accounts.length}
        >
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.accountName}
            </option>
          ))}
        </select>
      </label>
      <label>
        Caption
        <textarea
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
          rows={8}
          maxLength={5000}
        />
      </label>
      <p>
        <button
          type="button"
          onClick={publish}
          disabled={!ready || !accountId || !caption.trim() || submitting}
        >
          {submitting ? "กำลังเผยแพร่…" : "Publish to Facebook"}
        </button>
      </p>
      {message && (
        <p
          className={
            message === "เผยแพร่ไป Facebook แล้ว" ? "success" : "error"
          }
          role="status"
        >
          {message}
        </p>
      )}
      {jobs.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Status</th>
                <th>Published</th>
                <th>Facebook post</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td>{job.status}</td>
                  <td>{job.publishedAt ?? "—"}</td>
                  <td>{job.externalPostId ?? "—"}</td>
                  <td>{job.errorMessage ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
