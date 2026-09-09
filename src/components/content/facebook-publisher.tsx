"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { errorMessage, productFetch } from "@/lib/products/client";

type Account = { id: string; accountName: string };
type Job = {
  id: string;
  status: string;
  externalPostId: string | null;
  errorMessage: string | null;
  scheduledAt: string | null;
  cancelledAt: string | null;
  publishedAt: string | null;
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
  const [scheduledAt, setScheduledAt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const unavailable = !ready || !accountId || !caption.trim() || submitting;

  async function request(url: string, options: RequestInit, success: string) {
    setSubmitting(true);
    setMessage(null);
    try {
      await productFetch(url, options);
      setMessage(success);
      router.refresh();
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  function publish() {
    return request(
      `/api/content/${contentId}/publish/facebook`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ socialAccountId: accountId, caption }),
      },
      "เผยแพร่ไป Facebook แล้ว",
    );
  }

  function schedule() {
    return request(
      `/api/content/${contentId}/schedule/facebook`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          socialAccountId: accountId,
          caption,
          scheduledAt: new Date(scheduledAt).toISOString(),
        }),
      },
      "ตั้งเวลาเผยแพร่แล้ว",
    );
  }

  function updateSchedule(jobId: string, cancel = false) {
    return request(
      `/api/content/${contentId}/schedule/facebook/${jobId}`,
      cancel
        ? { method: "DELETE" }
        : {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              scheduledAt: new Date(scheduledAt).toISOString(),
            }),
          },
      cancel ? "ยกเลิกกำหนดเวลาแล้ว" : "เปลี่ยนเวลาเผยแพร่แล้ว",
    );
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
        <button type="button" onClick={publish} disabled={unavailable}>
          {submitting ? "กำลังเผยแพร่…" : "Publish to Facebook"}
        </button>
      </p>
      <label>
        Publish date and time (เวลาไทย)
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(event) => setScheduledAt(event.target.value)}
        />
      </label>
      <p>
        <button
          type="button"
          onClick={schedule}
          disabled={unavailable || !scheduledAt}
        >
          Schedule Facebook Post
        </button>
      </p>
      <p className="muted">
        ตั้งเวลาใหม่ในช่องด้านบน แล้วกด Reschedule ที่รายการ scheduled ได้
      </p>
      {message && (
        <p
          className={message.includes("แล้ว") ? "success" : "error"}
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
                <th>Scheduled / Published</th>
                <th>Facebook post</th>
                <th>Details</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td>{job.status}</td>
                  <td>
                    {job.scheduledAt ??
                      job.publishedAt ??
                      job.cancelledAt ??
                      "—"}
                  </td>
                  <td>{job.externalPostId ?? "—"}</td>
                  <td>{job.errorMessage ?? "—"}</td>
                  <td>
                    {job.status === "scheduled" && (
                      <>
                        <button
                          type="button"
                          onClick={() => updateSchedule(job.id)}
                          disabled={!scheduledAt || submitting}
                        >
                          Reschedule
                        </button>{" "}
                        <button
                          type="button"
                          className="danger"
                          onClick={() => updateSchedule(job.id, true)}
                          disabled={submitting}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
