import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { listScheduledCalendarItems } from "@/lib/publishing/calendar";

const thaiMonth = new Intl.DateTimeFormat("th-TH", {
  month: "long",
  year: "numeric",
  timeZone: "Asia/Bangkok",
});
const thaiDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" });
const thaiTime = new Intl.DateTimeFormat("th-TH", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Bangkok",
});
const weekDays = ["จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."];

function monthFromSearch(value: string | undefined, fallback: number) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 && number <= 11
    ? number
    : fallback;
}

export default async function Calendar({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const { user } = await requireSession();
  const now = new Date();
  const search = await searchParams;
  const yearValue = Number(search.year);
  const year =
    Number.isInteger(yearValue) && yearValue >= 2020 && yearValue <= 2100
      ? yearValue
      : now.getFullYear();
  const month = monthFromSearch(search.month, now.getMonth());
  const first = new Date(Date.UTC(year, month, 1));
  const last = new Date(Date.UTC(year, month + 1, 0));
  const previous = new Date(Date.UTC(year, month - 1, 1));
  const next = new Date(Date.UTC(year, month + 1, 1));
  const firstOffset = (first.getUTCDay() + 6) % 7;
  const items = await listScheduledCalendarItems(user.id);
  const days = new Map<number, typeof items>();
  for (const item of items) {
    const date = item.scheduledAt;
    if (!date) continue;
    const [itemYear, itemMonth, itemDay] = thaiDay
      .format(date)
      .split("-")
      .map(Number);
    if (itemYear !== year || itemMonth !== month + 1) continue;
    const existing = days.get(itemDay) ?? [];
    existing.push(item);
    days.set(itemDay, existing);
  }
  const cells = Array.from(
    { length: firstOffset + last.getUTCDate() },
    (_, index) => index - firstOffset + 1,
  );

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">SCHEDULED CONTENT</p>
          <h1>Content Calendar</h1>
          <p className="muted">รายการที่ตั้งเวลาไว้ทั้งหมด แสดงตามเวลาไทย</p>
        </div>
        <div className="actions">
          <Link
            className="button-link"
            href={`/calendar?year=${previous.getUTCFullYear()}&month=${previous.getUTCMonth()}`}
          >
            ← เดือนก่อน
          </Link>
          <Link
            className="button-link"
            href={`/calendar?year=${next.getUTCFullYear()}&month=${next.getUTCMonth()}`}
          >
            เดือนถัดไป →
          </Link>
        </div>
      </div>
      <section className="panel calendar-panel">
        <h2>{thaiMonth.format(first)}</h2>
        <div
          className="calendar-grid"
          role="grid"
          aria-label={`Calendar ${thaiMonth.format(first)}`}
        >
          {weekDays.map((day) => (
            <div key={day} className="calendar-weekday" role="columnheader">
              {day}
            </div>
          ))}
          {cells.map((day, index) =>
            day < 1 ? (
              <div
                className="calendar-day calendar-empty"
                key={`empty-${index}`}
              />
            ) : (
              <div className="calendar-day" key={day} role="gridcell">
                <span className="calendar-day-number">{day}</span>
                {(days.get(day) ?? []).map((item) => (
                  <Link
                    className="calendar-event"
                    href={`/content/${item.contentId}`}
                    key={item.id}
                  >
                    <time>{thaiTime.format(item.scheduledAt!)}</time>
                    <span>{item.content.product.name}</span>
                    <small>{item.content.hook}</small>
                  </Link>
                ))}
              </div>
            ),
          )}
        </div>
      </section>
      {!items.length && (
        <p className="muted">
          ยังไม่มีรายการที่ตั้งเวลาไว้ เปิด Content แล้วเลือก Schedule Facebook
          Post เพื่อเพิ่มรายการ
        </p>
      )}
    </>
  );
}
