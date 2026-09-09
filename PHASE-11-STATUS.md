# Phase 11 — Scheduling

สถานะ: เสร็จสำหรับ Facebook text post

- ตั้งวันและเวลาเผยแพร่ Facebook ได้จาก Content Editor
- เปลี่ยนเวลาและยกเลิกรายการที่ยัง `scheduled` ได้
- มี route runner `GET /api/cron/publish-scheduled` ที่รับเฉพาะ `Authorization: Bearer $CRON_SECRET`
- runner ใช้ claim งานแบบ atomic ก่อนโพสต์ จึงไม่โพสต์ซ้ำเมื่อถูกเรียกพร้อมกัน
- บน Vercel Hobby cron เรียกได้เพียงวันละครั้งและเวลาในชั่วโมงไม่แม่นยำ จึงยังไม่ใส่ `vercel.json` cron ที่ทำให้ผู้ใช้เข้าใจว่าโพสต์ตามนาทีได้
- หากต้องการโพสต์ตามเวลานาที ต้องใช้ Vercel Pro หรือ scheduler ภายนอกที่เรียก runner พร้อม CRON_SECRET
