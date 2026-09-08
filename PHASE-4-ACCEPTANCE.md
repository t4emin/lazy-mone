# Phase 4 — Asset Library + AI Image

ตรวจวันที่ 8 กันยายน 2026

**Phase 4 เสร็จสมบูรณ์:** ระบบเลือก Product Images เป็นรูปอ้างอิงและสร้าง AI Image ได้ บันทึก Asset ใน storage และ PostgreSQL พร้อมความสัมพันธ์และ provenance ครบถ้วน

## Acceptance Criteria

| รายการตามแผน                                   | สถานะ                                                       |
| ---------------------------------------------- | ----------------------------------------------------------- |
| Content ใช้รูป Product ที่ Upload ไว้          | ผ่าน: เลือกได้สูงสุด 4 รูปจากสินค้าเดียวกันเป็น reference   |
| Generate AI Image                              | ผ่าน: OpenAI Images API ผ่าน Server                         |
| Prompt                                         | ผ่าน: validate 10–4,000 ตัวอักษร และบันทึกกับ Asset         |
| Reference Product Images                       | ผ่าน: ตรวจว่าเป็น `product_image` ของ Product เดียวกัน      |
| Aspect Ratio 1:1, 4:5, 9:16, 16:9              | ผ่าน: validate และส่งขนาดที่กำหนดให้ Provider               |
| เก็บ Asset                                     | ผ่าน: PNG ใน private local storage และ `ProductAsset`       |
| เก็บ Content, Product, Provider, Model, Prompt | ผ่าน: ตรวจใน PostgreSQL และ UI                              |
| เปิด/ลบภาพ                                     | ผ่าน: อ่านผ่าน authenticated endpoint และลบไฟล์พร้อม record |

## ผลทดสอบ

- Unit tests **8/8 ผ่าน** รวม OpenAI image adapter สำหรับทั้ง generation และ reference-image edit
- Production Browser/API tests **14/14 ผ่าน** (1 skipped สำหรับกรณีไม่มี API key) โดย mock เฉพาะ HTTP boundary; ครอบคลุม create, provenance, private asset read และ delete
- `npm run lint`, `npm run typecheck`, `npm run build` และ `npm run test:secrets` ผ่าน
- Migration `20260908120000_asset_library_ai_image` apply แล้ว
- สร้าง OpenAI Image จริงหนึ่งภาพสำเร็จด้วย `gpt-image-2`, 1:1, คุณภาพ low; ไฟล์ PNG 1,203,712 bytes ถูกบันทึกเป็น Asset และตรวจ UI จริงแล้ว
- หลักฐานในเครื่อง: `.data/live-phase4-result.json` และ `.data/live-phase4-image-asset.png` (Git ignored)

## ขอบเขตและการป้องกัน

- Asset ที่สร้างจะผูกกับ Content และ Product; ลบ Content จะลบ generated assets และไฟล์ที่เกี่ยวข้อง
- การลบ Product ยังถูกป้องกันตราบใดที่มี Content อยู่
- Endpoint ทุกตัวตรวจ Session, ownership และ Origin สำหรับ mutation
- Provider errors, quota, timeout และข้อมูลภาพผิดรูปแบบไม่สร้าง Asset ปลอมและไม่เปิดเผยข้อมูลตอบกลับจาก Provider
- รูปอ้างอิงเป็นไฟล์ที่ Server อ่านจาก storage โดยตรวจ ID และ Product ก่อนเรียก Provider

ยังไม่เริ่ม Phase 5 (AI Video Generation)
