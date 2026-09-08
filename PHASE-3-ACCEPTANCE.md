# Phase 3 — AI Text Content

ตรวจวันที่ 8 กันยายน 2026

**Phase 3 เสร็จสมบูรณ์:** ทดสอบ OpenAI จริงผ่านแล้วหลังตั้ง API Key และ Billing โดยสร้างข้อความจากสินค้าสมมติหนึ่งรายการครบ 5 ส่วน พร้อมตรวจการแก้ไข บันทึก และ Refresh; ยังไม่เริ่ม Phase 4

## Acceptance Criteria

| รายการตามแผน                          | สถานะ                                                 |
| ------------------------------------- | ----------------------------------------------------- |
| เลือก Product แล้ว Create Content ได้ | ผ่าน Browser flow                                     |
| AI อ่าน Product Data ได้              | ผ่าน: ตรวจ payload, mock และผลจาก OpenAI จริง         |
| Generate Hook ได้                     | ผ่าน: Adapter, mock และ OpenAI จริง                   |
| Generate Script ได้                   | ผ่าน: Adapter, mock และ OpenAI จริง                   |
| Generate Caption ได้                  | ผ่าน: Adapter, mock และ OpenAI จริง                   |
| Generate CTA ได้                      | ผ่าน: Adapter, mock และ OpenAI จริง                   |
| Generate Hashtags ได้                 | ผ่าน: Adapter, mock และ OpenAI จริง                   |
| User แก้ผลลัพธ์ได้                    | ผ่าน: แก้ข้อความครบ 5 ส่วนใน Browser                  |
| Save Draft ได้                        | ผ่าน: บันทึกข้อความและ Draft/Ready ลง PostgreSQL จริง |
| Refresh แล้ว Draft ยังอยู่            | ผ่าน: ตรวจข้อความและสถานะหลัง Reload                  |
| เก็บ AI Provider และ Model ที่ใช้     | ผ่าน: บันทึก openai และ Model จริงจาก Server          |

## ผลทดสอบ

- Unit tests **7/7 ผ่าน** รวม Product, Session และ OpenAI adapter
- Production Browser/API tests **13/13 ผ่าน** โดยคำตอบ AI จำลองเฉพาะที่ HTTP boundary; ระบบ Session, routing, validation, database และ editor เป็นโค้ดจริง
- ทดสอบแอปหลักกรณีไม่มี API Key **1/1 ผ่าน**: ปิดปุ่ม Generate แจ้งวิธีตั้ง Key และ API ปฏิเสธคำขอด้วย HTTP 503 โดยไม่บันทึกข้อมูลปลอม
- `npm run build`, `npm run lint`, `npm run typecheck` ผ่าน
- Migration `20260908030646_ai_text_content` Apply แล้ว
- ตรวจ Client Bundle และ `.env` ถูก Git ignore
- ตรวจภาพ Content Editor: ข้อความทั้ง 5 ส่วน, Status, Save และ Delete แสดงครบ

ครอบคลุม Provider HTTP errors, refusal, incomplete response, invalid JSON/schema, ข้อมูลสินค้าและตัวเลือกใน request, metadata ที่ส่งจาก Client ถูกปฏิเสธ, version conflict, ป้องกันข้อมูลข้ามเจ้าของ, CSRF และการป้องกันลบสินค้าที่มีคอนเทนต์

## ไฟล์และพฤติกรรมที่เพิ่ม

- `src/lib/ai/`: interface, prompt, provider factory และ OpenAI Responses adapter; ไม่มี Provider logic กระจายไปใน UI
- `src/lib/content/`: generation service, validation, CRUD และ optimistic concurrency
- `src/components/content/`: GenerationForm และ ContentEditor
- `/products/[id]/content/new`: ตัวเลือก Generate
- `/content`: รายการคอนเทนต์ และ `/content/[id]`: editor เฉพาะข้อความของ Phase 3
- `/api/products/[id]/content`: Generate และบันทึกฉบับร่างเริ่มต้น
- `/api/content/[id]`: แก้ไขและลบโดยตรวจเจ้าของ
- `ContentDraft`: ข้อมูลสินค้า/ผู้ใช้, options, ข้อความ, provenance, status, version และ timestamps
- Dashboard แสดงจำนวน Draft จริง; ปุ่ม Create Content เปิดใช้งานแล้ว
- `.env`, `.env.example`, setup script และ README เพิ่มการตั้งค่า AI
- เพิ่ม Unit tests, Browser tests, missing-key test และ isolated mock test runner

## ผลตรวจ OpenAI จริง

- เรียก OpenAI จริงหนึ่งครั้งสำเร็จด้วย `gpt-5.4-mini-2026-03-17`
- ใช้สินค้าสมมติกระบอกน้ำสแตนเลส 500 มล. ราคา 299 บาท สถานะ INACTIVE พร้อม URL ตัวอย่าง
- ผลลัพธ์ครบ Hook, Script, Caption, CTA และ Hashtags; ข้อมูลความจุ ราคา ฝาปิด และวิธีล้างตรงกับข้อมูลที่ส่ง
- ข้อความระบุว่าเป็นสินค้าตัวอย่างสำหรับทดสอบ มี Affiliate disclosure และลิงก์ที่กำหนด ไม่มีคำอ้างว่าเคยทดลองใช้หรือเก็บความเย็นได้
- ตรวจ Provider/Model ใน PostgreSQL จริง จากนั้นแก้ Caption และเปลี่ยน Ready ผ่าน Browser; Save และ Reload ผ่าน
- คืน Caption เดิมและสถานะ Draft แล้ว Save และ Reload ผ่าน ไม่มี page error ระหว่างตรวจ Editor
- เครื่องมือทดสอบรอบแรกอ่าน response body ไม่ทันหลังหน้าเปลี่ยน จึงตรวจ Draft ที่บันทึกแล้วต่อโดยไม่เรียก AI ซ้ำ
- เก็บ Draft ไว้ตรวจที่ http://127.0.0.1:3000/content/cmts69sco0004004r17gr07ap
- หลักฐานในเครื่อง: `.data/live-phase3-result.json` และ `.data/live-content-editor.png` (Git ignored)

การทดสอบ live ใช้ OpenAI API จริง ส่วน Unit/Mock tests ด้านบนใช้คำตอบจำลองเฉพาะในกระบวนการทดสอบ
