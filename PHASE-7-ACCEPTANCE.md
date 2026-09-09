# Phase 7 — Internal Video Composer

สถานะ: เสร็จสมบูรณ์สำหรับ local worker

- เลือกรูปสินค้า/ภาพ AI เป็น scenes และเลือก voice over ได้
- ตั้ง duration, aspect ratio, text overlay และ Fade/Slow Zoom ได้
- ประกอบ MP4 ผ่าน FFmpeg และเก็บเป็น Video Asset

FFmpeg ทำงานบนเครื่องหรือ worker ที่รองรับเท่านั้น; Vercel Serverless ไม่รัน FFmpeg โดยตรง
