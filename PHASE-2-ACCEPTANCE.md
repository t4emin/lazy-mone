# Phase 2 — Product Library Acceptance Report

ตรวจวันที่ 7 กันยายน 2026 บน macOS, Node.js 22.23.2, Next.js 16.3.4, Prisma 7.10.0 และ PostgreSQL 17 ผ่าน Google Chrome / Playwright

**ผ่าน Acceptance Criteria ทั้ง 12 ข้อของ Phase 2** ยังไม่เริ่ม Phase 3

| Acceptance Criterion         | ผล   | หลักฐาน                                                                            |
| ---------------------------- | ---- | ---------------------------------------------------------------------------------- |
| Create Product ได้           | ผ่าน | กรอกฟอร์มจริง บันทึก แล้วเปิดหน้ารายละเอียด                                        |
| Edit Product ได้             | ผ่าน | แก้ชื่อ ราคา และ Status แล้วตรวจค่าที่แสดง                                         |
| Delete Product ได้           | ผ่าน | ทดสอบทั้งยกเลิกและยืนยันการลบจากหน้ารายการ                                         |
| ดู Product List ได้          | ผ่าน | ตารางแสดงชื่อ Platform ราคา Affiliate Link Status วันที่ และ Actions               |
| ดู Product Detail ได้        | ผ่าน | รายละเอียด URL ข้อความ ราคา วันสร้าง/แก้ไข และรูปภาพ                               |
| Upload หลายรูปได้            | ผ่าน | อัปโหลด JPG, PNG และ WebP พร้อมกันพร้อม Preview; Unit test รองรับ JPEG ด้วย        |
| Delete รูปได้                | ผ่าน | ลบรูปหลักแล้วตรวจว่าไฟล์จริงถูกลบจากดิสก์                                          |
| ตั้ง Main Image ได้          | ผ่าน | ตั้งรูปหลักแล้ว Refresh ค่าเดิมยังอยู่; ลบรูปหลักแล้วรูปที่เหลือขึ้นแทน            |
| Validation ทำงาน             | ผ่าน | ปฏิเสธชื่อว่าง ราคาติดลบ URL ไม่ปลอดภัย ไฟล์ปลอม และไฟล์เกินขนาด                   |
| Affiliate URL เก็บได้        | ผ่าน | ตรวจ URL พร้อม Query String หลัง Refresh และในหน้ารายการ                           |
| Refresh แล้วข้อมูลยังอยู่    | ผ่าน | ข้อมูลสินค้า ราคา ลิงก์ และสถานะรูปหลักยังอยู่                                     |
| Product ทุก Route ต้อง Login | ผ่าน | ตรวจ `/products`, `/products/new`, `/products/[id]`, `/products/[id]/edit` และ API |

## ผลตรวจเพิ่มเติม

- Production Browser/API suite: **10/10 ผ่าน** ครอบคลุม Phase 1 และ Phase 2
- Development: Product suite **4/4 ผ่าน** และ Authentication flows **5/5 ผ่าน**; Login rate limit ยืนยันอีกครั้งในชุด Production
- Unit tests: **4/4 ผ่าน** ครอบคลุม Password, Session Token, Product validation และ Image decoding
- `npm run lint`: ผ่าน ไม่มี Warning
- `npm run typecheck`: ผ่าน
- `npm run build`: ผ่าน
- `npm run test:secrets`: ไม่มี Secret ใน Production client assets ทั้ง 17 ไฟล์
- Prisma: migration ทั้ง 2 ชุดถูก Apply แล้ว ฐานข้อมูลตรงกับ migration
- `.env` และ `.data/uploads` ถูก Git ignore
- ทดสอบ Product UI flow โดยตรวจ Browser console/page errors และตรวจภาพหน้ารายละเอียดที่ 1366px
- ทดสอบการส่งคำขอเปลี่ยนรูปหลักพร้อมกัน: สำเร็จและยังมีรูปหลักเพียง 1 รูป
- ทดสอบไม่ให้เก็บเกิน 10 รูป และไม่ให้อัปโหลดเกิน 5 รูปต่อครั้ง
- ทดสอบว่าชุดอัปโหลดที่มีไฟล์เสียไม่สร้าง Asset บางส่วนในฐานข้อมูล
- ทดสอบรูปและสินค้าของเจ้าของอื่น: ปฏิเสธทั้งการอ่าน แก้ไข ลบ และตั้งรูปหลัก
- ทดสอบ API โดยไม่ Login และการส่งคำขอจาก Origin อื่น
- ลบข้อมูลสินค้าและไฟล์ที่สร้างเพื่อทดสอบผ่าน API หลังตรวจเสร็จ

Production ทดสอบที่ loopback `127.0.0.1:3001` โดยยังเปิด Secure Cookie ตามปกติ Browser flow ใช้ Chrome จริง ส่วน API checks ส่ง Session Cookie ที่ได้จาก Login โดยตรง เนื่องจาก APIRequestContext ไม่มีข้อยกเว้น Secure Cookie สำหรับ loopback HTTP เหมือน Chrome ไม่ได้ลดความปลอดภัยของแอปเพื่อการทดสอบ

## สิ่งที่สร้างและแก้ไข

| กลุ่ม            | ไฟล์ / การเปลี่ยนแปลง                                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Database         | เพิ่ม Product, ProductAsset, ProductPlatform, ProductStatus และความสัมพันธ์กับ User ใน `prisma/schema.prisma`                                    |
| Migration        | `prisma/migrations/20260907101443_product_library/migration.sql` รวม unique index สำหรับรูปหลัก                                                  |
| Pages            | เปลี่ยนหน้า Products เป็นตาราง; เพิ่ม `/products/new`, `/products/[id]`, `/products/[id]/edit` และหน้า Not Found                                 |
| Dashboard        | แสดงจำนวนสินค้าจริงของผู้ใช้และลิงก์ไปคลังสินค้า                                                                                                 |
| UI Components    | `src/components/products/product-form.tsx`, `delete-product.tsx`, `image-manager.tsx`                                                            |
| Product Services | `src/lib/products/service.ts`, `validation.ts`, `image-validation.ts`, `http.ts`, `errors.ts`, `client.ts`, `format.ts`                          |
| Storage          | `src/lib/storage/storage.ts` — AssetStorage interface และ local adapter                                                                          |
| APIs             | `/api/products`, `/api/products/[id]`, `/api/products/[id]/images`, `/api/products/[id]/images/[assetId]`, `/api/assets/[id]`                    |
| Styling          | เพิ่ม CSS สำหรับฟอร์ม ตาราง และ Gallery ใน `src/app/globals.css`                                                                                 |
| Dependencies     | เพิ่ม Sharp เป็น direct dependency และปรับ `package-lock.json`                                                                                   |
| Tests            | เพิ่ม `tests/products.test.ts`, `tests/e2e/products.spec.ts`; แยก rate-limit suite ให้รันหลัง flows และปรับ Dashboard assertion รองรับสินค้าจริง |
| Documentation    | ปรับ `README.md`, เพิ่มรายงานนี้ และ ignore `.data/`                                                                                             |

## การใช้งานและข้อจำกัด

- เข้า **http://127.0.0.1:3000/products** แล้ว Login ด้วยบัญชีเดิม
- ข้อมูลสินค้าเก็บใน PostgreSQL; รูปเก็บใน `.data/uploads/` นอกโฟลเดอร์สาธารณะ
- รูปละไม่เกิน 5 MB / ครั้งละไม่เกิน 5 รูป / สินค้าละไม่เกิน 10 รูป / ไม่เกิน 20 ล้านพิกเซล
- ไม่ต้องเพิ่ม Environment Variable
- สำรองข้อมูลทั้ง PostgreSQL และโฟลเดอร์รูปภาพเพื่อย้ายเครื่องหรือกู้คืน
- ถ้าดิสก์ลบไฟล์ไม่สำเร็จหลังลบ record จะบันทึกชื่อไฟล์ค้างใน Terminal; แอปไม่เปิดไฟล์นั้นผ่าน API อีก ดูรายละเอียดใน README
- Create Content เป็นปุ่มปิดใช้งานสำหรับ Phase 3 ตามแผน
- เปิด Development server ไว้ที่พอร์ต 3000 และหยุด Production test server หลังตรวจเสร็จ
- หยุดที่ Phase 2 และรอคำสั่ง Phase 3
