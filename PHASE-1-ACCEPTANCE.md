# Phase 1 — Acceptance Report

ตรวจวันที่ 7 กันยายน 2026 บน macOS, Node.js 22.23.2, Next.js 16.3.4, Prisma 7.10.0, PostgreSQL 17 (Docker) และ Google Chrome ผ่าน Playwright

**ผ่านทั้ง 18 ข้อของ Phase 1** ยังไม่เริ่ม Phase 2

| Acceptance Criterion                              | ผล   | หลักฐาน                                                                                                        |
| ------------------------------------------------- | ---- | -------------------------------------------------------------------------------------------------------------- |
| `npm run dev` เปิดระบบได้                         | ผ่าน | Development server พร้อมที่ `http://127.0.0.1:3000`; `/login` HTTP 200                                         |
| `/` redirect ตาม Login State                      | ผ่าน | Browser tests ตรวจทั้งก่อนและหลัง Login                                                                        |
| เปิด `/login` ได้                                 | ผ่าน | Browser แสดง Form และ Heading                                                                                  |
| Login ด้วย `madao / P@ssw0rd1`                    | ผ่าน | Browser tests ทั้ง Development และ Production                                                                  |
| Password ผิด Login ไม่ได้                         | ผ่าน | แสดงข้อความผิดพลาดและไม่ออก Session Cookie                                                                     |
| Username ผิด Login ไม่ได้                         | ผ่าน | ข้อความเดียวกับ Password ผิด ไม่เปิดเผยว่าบัญชีใดมีอยู่                                                        |
| Login สำเร็จไป `/dashboard`                       | ผ่าน | ตรวจ URL และ Welcome                                                                                           |
| Refresh แล้วยัง Login อยู่                        | ผ่าน | Reload หน้าแล้วยังเห็น Welcome                                                                                 |
| `/dashboard` ถูก Protect                          | ผ่าน | Anonymous ถูก redirect ไป `/login`                                                                             |
| `/products` ถูก Protect                           | ผ่าน | Anonymous ถูก redirect ไป `/login`                                                                             |
| `/content` ถูก Protect                            | ผ่าน | Anonymous ถูก redirect ไป `/login`                                                                             |
| `/settings` ถูก Protect                           | ผ่าน | Anonymous ถูก redirect ไป `/login`                                                                             |
| Logout ได้                                        | ผ่าน | กดปุ่มแล้วไป `/login` และ Cookie ถูกลบ                                                                         |
| Logout แล้ว Session เดิมใช้ต่อไม่ได้              | ผ่าน | นำ Cookie ก่อน Logout ใส่คืนแล้วเข้า Dashboard ไม่ได้                                                          |
| Secret ไม่ปรากฏใน Client Bundle                   | ผ่าน | ตรวจ 13 Production client assets เทียบกับ Secret ใน `.env` และรหัสผ่านทดสอบ                                    |
| `.env` ไม่ถูก Commit                              | ผ่าน | `git check-ignore .env` ยืนยันว่าถูก ignore; repository ยังไม่มี Commit                                        |
| Prisma เชื่อม PostgreSQL สำเร็จ                   | ผ่าน | Initial migration, migrate status/deploy และสร้าง/อ่าน/ลบ Session จริง                                         |
| ไม่มี Error สำคัญใน Browser Console หรือ Terminal | ผ่าน | Browser login/navigation/logout flow ตรวจ console error และ pageerror; Production build และ server ทำงานสำเร็จ |

## การตรวจเพิ่มเติม

- Unit tests **2/2 ผ่าน**: Scrypt password verification และ Session token/HMAC
- Browser acceptance tests **6/6 ผ่านใน Development**, **6/6 ผ่านใน Production**
- Cookie: HttpOnly, SameSite=Lax, มีวันหมดอายุ และ Secure ใน Production; `document.cookie` อ่านไม่ได้
- Session หมดอายุและ Token ปลอมเข้า Protected Route ไม่ได้
- ฐานข้อมูลเก็บ Token digest ไม่เก็บ Session Token จริง
- คำขอ Login/Logout จาก Origin อื่นได้ HTTP 403; GET ที่ endpoint เหล่านี้ได้ HTTP 405
- Server validation ปฏิเสธข้อมูลว่างและรหัสผ่านเกินความยาวที่กำหนด
- จำกัดการลอง Login รวม 10 ครั้งต่อนาทีสำหรับ MVP หนึ่ง process
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` ผ่าน
- `npm audit` หลังติดตั้ง dependency ที่แก้ไขแล้ว: **0 vulnerabilities**
- ตรวจภาพ Dashboard ที่ความกว้าง 1366px: Navigation, Welcome, ตัวเลข 0 ทั้ง 4 รายการ และ Logout แสดงครบ

Production ทดสอบบน loopback `127.0.0.1:3001` ของ Chrome ซึ่งรองรับ Secure Cookie สำหรับ localhost; ไม่ได้ Deploy ไปเซิร์ฟเวอร์ภายนอก เมื่อใช้งานจริงบนโดเมนต้องใช้ HTTPS และตั้ง `APP_ORIGIN` ให้ตรง

## ไฟล์ที่สร้าง

| กลุ่ม                   | ไฟล์และหน้าที่                                                                                                                                                                      |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Application             | `src/app/layout.tsx`, `page.tsx`, `globals.css`, `error.tsx`, `login/page.tsx`, `(protected)/layout.tsx` และหน้า dashboard/products/content/settings                                |
| Auth HTTP endpoints     | `src/app/api/auth/login/route.ts`, `src/app/api/auth/logout/route.ts`                                                                                                               |
| Business logic          | `src/lib/auth/crypto.ts`, `login.ts`, `request.ts`, `session.ts`, `src/lib/db.ts`, `src/lib/env.ts`                                                                                 |
| Shared UI               | `src/components/placeholder.tsx`, `public/icon.svg`                                                                                                                                 |
| Database                | `compose.yaml`, `prisma.config.ts`, `prisma/schema.prisma`, `prisma/migrations/20260907092447_init/migration.sql`, `migration_lock.toml`                                            |
| Setup และ configuration | `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`, `next-env.d.ts`, `eslint.config.mjs`, `.prettierignore`, `.gitignore`, `.env.example`, `.env` ที่ถูก ignore |
| Scripts                 | `scripts/setup-env.mjs`, `scripts/check-client-secrets.mjs`                                                                                                                         |
| Tests                   | `tests/crypto.test.ts`, `tests/e2e/auth.spec.ts`, `playwright.config.ts`                                                                                                            |
| Documentation           | `README.md`, `PHASE-1-ACCEPTANCE.md`; Next.js สร้าง `AGENTS.md` และ `CLAUDE.md` สำหรับคำแนะนำพัฒนาต่อ                                                                               |

ไฟล์แผนต้นฉบับ `ai-affiliate-content-system-plan.md` ไม่ได้แก้ไข

## สถานะส่งมอบ

- ตั้ง `.env` จริงและสุ่ม Secret แล้ว ไม่มีขั้นตอนตั้งค่าค้างสำหรับการใช้ในเครื่องนี้
- PostgreSQL ทำงานผ่าน Docker volume ที่เก็บข้อมูลถาวร
- เปิด Development server ที่ `http://127.0.0.1:3000`
- หยุด Production server ที่ใช้ทดสอบหลังตรวจเสร็จ
- วิธีรันและรายละเอียด Environment อยู่ใน [README.md](README.md)
- หยุดตามขอบเขต Phase 1 และรอคำสั่ง Phase 2
