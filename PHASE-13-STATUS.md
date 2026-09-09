# Phase 13 — AI Usage & Cost Tracking

สถานะ: เสร็จ

- เก็บงาน AI ที่สำเร็จหลัง deployment นี้: text, image, video และ voice
- เก็บ provider, model, input/output usage, estimated cost และหน่วยของต้นทุนเมื่อ provider ส่งมาให้
- Dashboard แสดงจำนวนงานแต่ละประเภท และ Known Provider Credits
- มีหน้า `/usage` สำหรับดูประวัติ 100 รายการล่าสุด
- ไม่สร้างราคาบาทจากการเดา: OpenAI responses ที่ API ไม่ส่งต้นทุน และ asset generation จะถูกบันทึก usage โดยไม่มี cost จนกว่าจะมี pricing source ที่เชื่อถือได้
