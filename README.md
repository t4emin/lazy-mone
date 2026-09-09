# AI Affiliate Content System

เว็บแอปส่วนตัวสำหรับจัดการ Affiliate Content — เสร็จถึง **Phase 13: AI Usage & Cost Tracking** ตาม `ai-affiliate-content-system-plan.md`

## สิ่งที่ใช้งานได้

- Login ด้วย Username / Password ที่ตรวจสอบบน Server
- Session อายุ 7 วัน เก็บ Cookie แบบ HttpOnly, SameSite=Lax และ Secure ใน Production
- PostgreSQL เก็บเฉพาะ HMAC digest ของ Session Token พร้อมวันหมดอายุ
- Logout ลบ Session ในฐานข้อมูล ทำให้ Cookie เก่าใช้ซ้ำไม่ได้
- `/` และ `/login` redirect ตามสถานะ Login
- `/dashboard`, `/products`, `/content`, `/settings` ตรวจ Session ที่ Server ทุกหน้า
- Dashboard แสดง Welcome จำนวนสินค้าและ Draft จริงของผู้ใช้ ส่วน Video/Post ยังเป็น 0
- Product Library: รายการสินค้า, เพิ่ม, แก้ไข, รายละเอียด และลบพร้อมยืนยัน
- เก็บ Platform, Product URL, Affiliate URL, ราคาเป็น THB, Description, Features, Notes และ Status
- อัปโหลดหลายรูป, Preview ก่อนอัปโหลด, ดูรูปขนาดเต็ม, ตั้งรูปหลัก และลบรูป
- Create Content: เลือกประเภท แพลตฟอร์ม ภาษา โทน กลุ่มเป้าหมาย และคำสั่งเพิ่มเติม
- Content Editor: แก้ Hook, Video Script, Caption, CTA, Hashtags และบันทึก Draft/Ready
- Asset Library: ใช้รูปสินค้าที่อัปโหลดเป็นรูปอ้างอิงได้ และสร้างภาพ AI สำหรับแต่ละ Content พร้อม Prompt, สัดส่วน, Provider และ Model
- หน้ารวม Content แสดงสินค้า สถานะ Provider และ Model พร้อมเปิดกลับมาแก้ไข
- AI Video: สร้าง Video Job ผ่าน Runway, ติดตามสถานะจริง, เปิดผลลัพธ์ MP4 และ retry งานที่ล้มเหลว
- AI Voice Over: สร้าง MP3 จาก Script ผ่าน OpenAI TTS เลือก Voice, Language และ Speed ได้ พร้อมฟังและลบ Audio Asset
- เชื่อม Facebook Page ผ่าน OAuth โดยเข้ารหัส token ในฐานข้อมูล
- เผยแพร่ Facebook text post, เก็บผลลัพธ์และ error history
- ตั้งเวลา, เปลี่ยนเวลา และยกเลิก Facebook text post ได้
- Calendar รายเดือนสำหรับดู Content ที่ตั้งเวลาโพสต์ไว้
- AI Usage history สำหรับ text, image, video และ voice ที่สร้างสำเร็จ

## เปิดใช้ในเครื่องนี้

ตั้ง `.env` และฐานข้อมูลไว้แล้ว เปิด Docker Desktop จากนั้น:

```sh
npm run db:up
npm run db:migrate
npm run dev
```

เข้า **http://127.0.0.1:3000**

บัญชีทดสอบตามแผน: **madao / P@ssw0rd1**

ใช้ URL ให้ตรง `APP_ORIGIN` เพื่อให้การตรวจ Origin ของฟอร์มทำงานถูกต้อง

## ติดตั้งใหม่

ต้องมี Node.js 22.12+ (ทดสอบด้วย 22.23.2), npm และ Docker Desktop

```sh
npm ci
npm run setup:env
# กรอกรหัสผ่านเริ่มต้นตามแผน โปรแกรมจะสร้าง hash และสุ่ม secret ให้
npm run db:up
npm run db:migrate
npm run dev
```

`setup:env` ไม่เขียนทับ `.env` ที่มีอยู่ และตั้งสิทธิ์ไฟล์เป็น `0600` การกรอกรหัสผ่านในขั้นตอนนี้มองเห็นได้บน Terminal

PostgreSQL ใช้พอร์ต `127.0.0.1:55432` และ Docker volume `lazy-money_postgres_data` ข้อมูลยังอยู่เมื่อหยุดหรือเริ่ม Container ใหม่

```sh
npm run db:down  # หยุดฐานข้อมูลโดยเก็บข้อมูลใน volume
```

## Environment

ดูรูปแบบใน `.env.example` — `.env` จริงถูกยกเว้นใน `.gitignore`

| ตัวแปร                | หน้าที่                                                                    |
| --------------------- | -------------------------------------------------------------------------- |
| `DATABASE_URL`        | PostgreSQL connection string สำหรับ Prisma และแอป                          |
| `ADMIN_USERNAME`      | ชื่อผู้ใช้ของ MVP                                                          |
| `ADMIN_PASSWORD_HASH` | Scrypt hash รูปแบบ `scrypt:salt:hash` ไม่ใช่รหัสผ่านจริง                   |
| `SESSION_SECRET`      | Secret อย่างน้อย 32 ตัวอักษรสำหรับ HMAC ของ Session Token                  |
| `APP_ORIGIN`          | Origin ที่อนุญาตให้ส่งฟอร์ม เช่น `http://127.0.0.1:3000` ไม่มี `/` ต่อท้าย |
| `POSTGRES_USER`       | User สำหรับ Docker PostgreSQL                                              |
| `POSTGRES_PASSWORD`   | รหัสผ่านของฐานข้อมูลที่สุ่มโดย setup script                                |
| `POSTGRES_DB`         | ชื่อฐานข้อมูล                                                              |

ไม่มีตัวแปร Secret ที่ใช้ prefix `NEXT_PUBLIC_` และโมดูลที่เข้าถึงฐานข้อมูล/Environment ใช้ `server-only`

ตัวแปร AI:

```env
AI_TEXT_PROVIDER=openai
OPENAI_TEXT_MODEL=gpt-5.4-mini
OPENAI_API_KEY=
AI_IMAGE_PROVIDER=openai
OPENAI_IMAGE_MODEL=gpt-image-2
AI_VIDEO_PROVIDER=runway
RUNWAY_VIDEO_MODEL=gen4.5
RUNWAYML_API_SECRET=
AI_AUDIO_PROVIDER=openai
OPENAI_AUDIO_MODEL=gpt-4o-mini-tts
```

ใส่ API Key จริงหลัง `OPENAI_API_KEY=` ใน `.env` ของเครื่อง/Server โดยไม่ใส่ใน Browser หรือ Source code แล้ว restart server บัญชี API ต้องมีสิทธิ์ใช้ Model และโควตาที่เพียงพอ ค่า Model ปรับได้โดยไม่แก้โค้ด ตัวแรกใช้ OpenAI ผ่าน Responses API พร้อม Structured Outputs และ `store: false`

## โครงสร้าง

```text
src/app/                 Pages, layout และ HTTP route handlers
src/components/          UI ที่ใช้ร่วมกัน
src/lib/auth/            ตรวจ credentials, session, token และ origin
src/lib/products/        Product services, validation, HTTP และ image processing
src/lib/content/         Generation, draft services และ validation
src/lib/ai/              AITextProvider interface, prompt, provider factory และ OpenAI adapter
src/lib/storage/         AssetStorage interface และ Local File System adapter
src/lib/db.ts            Prisma connection
src/lib/env.ts           Server environment validation
prisma/                  User / Session / Product / ProductAsset / ContentDraft และ migrations
scripts/                 สร้าง .env และตรวจ Client Bundle
tests/                   Unit tests และ Browser acceptance tests
compose.yaml             PostgreSQL สำหรับ Local Development
```

UI ไม่เรียกฐานข้อมูลโดยตรง การอ่าน Session ผ่าน service layer และแยก User ออกจาก Session เพื่อรองรับผู้ใช้หลายคนในอนาคต

## Product Library

1. เปิด `/products` แล้วกด **Add Product**
2. กรอก Product Name และ Platform (Shopee, TikTok Shop หรือ Other); ข้อมูลอื่นเว้นว่างได้
3. กด **Save Product** เพื่อไปหน้ารายละเอียด แล้วเลือกหลายไฟล์และกด **Upload Images**
4. รูปแรกเป็น Main Image อัตโนมัติ เปลี่ยนได้ด้วย **Set Main Image**
5. ถ้าลบรูปหลัก ระบบเลือกรูปที่เหลือแทนให้อัตโนมัติ การลบสินค้าจะลบรูปที่เกี่ยวข้องด้วย

รองรับ JPG/JPEG/PNG/WebP ไม่เกิน **5 MB ต่อรูป**, **5 รูปต่อครั้ง**, **10 รูปต่อสินค้า** และ **20 ล้านพิกเซล** ไม่รับภาพเคลื่อนไหว ระบบตรวจรูปจริงด้วย Sharp และ re-encode เพื่อลบ metadata ไม่เชื่อเพียงนามสกุลไฟล์หรือ MIME จาก Browser

รูปเก็บใน `.data/uploads/` นอก `public/` และถูก Git ignore เปิดรูปผ่าน `/api/assets/[id]` ซึ่งตรวจ Session และเจ้าของสินค้าก่อนเสมอ ชื่อไฟล์บนดิสก์เป็น UUID; ในหน้าจอยังเห็นชื่อเดิม การเก็บรูปใช้ `AssetStorage` interface เพื่อเปลี่ยนเป็น S3-compatible storage ภายหลังได้

ข้อมูลสินค้าเก็บใน PostgreSQL และมี `userId` ใช้กรองทุกคำขอ ราคาเก็บเป็น Decimal(12,2) เพื่อรักษาทศนิยม Transaction และ partial unique index ป้องกันการตั้งรูปหลักซ้ำเมื่อส่งคำขอพร้อมกัน

การสำรองข้อมูลต้องเก็บ **ทั้ง PostgreSQL และ `.data/uploads/`** หากย้ายแอปต้องย้ายทั้งสองส่วน ระบบ local storage ต้องใช้ดิสก์ถาวร สำหรับการขยายหลาย instance ให้เปลี่ยน adapter เป็น shared storage

การอัปโหลดเป็นทั้งชุด: หากไฟล์ใดไม่ผ่าน จะย้อนกลับทั้งชุดและเก็บข้อมูลสินค้าเดิมไว้ การลบข้อมูลในฐานข้อมูลเกิดก่อนลบไฟล์จริง; ถ้าดิสก์ลบไฟล์ไม่ได้ จะบันทึกชื่อไฟล์ค้างใน Terminal เพื่อให้จัดการภายหลัง โดยไม่มี URL เปิดไฟล์นั้นจากแอปอีก

Phase 2 ไม่ต้องเพิ่ม Environment Variable ใดๆ หลังเปลี่ยน Prisma schema ให้รัน `npm run db:generate` และ restart dev server เพื่อใช้ Client รุ่นใหม่

## AI Text Content (Phase 3)

1. เปิดรายละเอียดสินค้าแล้วกด **Create Content**
2. เลือกประเภทคอนเทนต์ 6 แบบ แพลตฟอร์มเป้าหมาย 5 แบบ ภาษาไทย/อังกฤษ โทน และข้อมูลเพิ่มเติม
3. กด **Generate Content** ระบบส่งชื่อ Description, Features, Price, Platform และ Affiliate URL ของสินค้าจากฐานข้อมูลไปยัง AI
4. เมื่อสำเร็จ ระบบบันทึกฉบับร่างเริ่มต้นอัตโนมัติ แล้วเปิด **Content Editor** เพื่อป้องกันการสูญเสียผลที่สร้างไปแล้ว
5. แก้ข้อความทั้ง 5 ส่วน เลือก **Draft** หรือ **Ready** แล้วกด **Save Draft / Status**
6. เปิดจาก `/content` เพื่อแก้ไขภายหลัง หรือลบคอนเทนต์ด้วยปุ่ม Delete Content

AI Provider และ Model บันทึกจากผลที่ Server ได้รับ ไม่รับข้อมูลเหล่านี้จากฟอร์มแก้ไข การเปิดสองหน้าแล้วบันทึกทับกันจะถูกปฏิเสธด้วย version check เพื่อไม่ให้ข้อความหาย สินค้าที่มีคอนเทนต์อยู่จะลบไม่ได้จนกว่าจะลบคอนเทนต์ที่เกี่ยวข้องก่อน

รองรับ error เมื่อไม่มี Key, Key/สิทธิ์ผิด, โควตาไม่พอ, network timeout และผลลัพธ์ผิดรูปแบบ จะไม่สร้างข้อความปลอมทดแทน ไม่บันทึก Draft ที่ข้อมูลไม่ครบ และไม่ retry การเรียก AI อัตโนมัติ แต่ละผู้ใช้สร้างพร้อมกันได้หนึ่งคำขอใน MVP ที่รันหนึ่ง process

หากสินค้าถูกลบขณะ AI กำลังทำงาน จะไม่บันทึกคอนเทนต์ผูกกับสินค้าที่หายไป แม้ Provider อาจคิดค่า API ไปแล้ว กรณี process หยุดหรือฐานข้อมูลล้มหลัง AI ตอบสำเร็จอาจต้องสร้างใหม่; Phase นี้ยังไม่มี job queue หรือประวัติต้นทุน

เพิ่ม Provider ใหม่โดย implement `AITextProvider.generateContent()` ใน `src/lib/ai/providers/` แล้วลงทะเบียนใน `getTextProvider()` โดยไม่แก้หน้าจอหรือ schema ของ Draft

## Asset Library + AI Image (Phase 4)

1. เปิด Content Editor แล้วเลื่อนมาที่ **AI Image Assets**
2. ระบุ Prompt และเลือกสัดส่วน 1:1, 4:5, 9:16 หรือ 16:9
3. เลือกรูปสินค้าที่อัปโหลดไว้ได้สูงสุด 4 รูปเพื่อใช้เป็นรูปอ้างอิง หรือสร้างจาก Prompt อย่างเดียว
4. กด **Generate AI Image** ระบบบันทึก PNG เป็น Asset ที่ผูกกับ Content และ Product พร้อม Prompt, Aspect Ratio, Provider และ Model
5. เปิดภาพเต็มหรือกด Delete Image เพื่อลบไฟล์และข้อมูล Asset พร้อมกัน

ระบบใช้ OpenAI Images API ผ่าน Server เท่านั้นและกำหนดคุณภาพ `low` สำหรับภาพที่สร้างจาก Prompt เพื่อลดค่าใช้จ่ายระหว่างใช้งานทั่วไป ไม่มีการ retry อัตโนมัติ และจำกัดการสร้างพร้อมกันหนึ่งคำขอต่อผู้ใช้ใน MVP ภาพที่มีรูปอ้างอิงจะส่งไปยัง Images Edit endpoint โดยไม่รับไฟล์หรือ provenance จาก Client โดยตรง

## AI Video (Phase 5)

ในหน้า Content Editor เลือกภาพอ้างอิง, ความยาว 5 หรือ 10 วินาที, สัดส่วน และ prompt แล้วกด **Create Video Job**. ระบบส่งงานให้ Runway ผ่าน Server, แสดง progress จริง, เก็บ Provider/Model/Prompt/Duration/Created/Estimated Cost/Output และบันทึก MP4 กลับเป็น Asset เมื่อเสร็จ งาน failed กดดู error และ Retry ได้

## Voice Generation (Phase 6)

ในหน้า Content Editor ส่วน **AI Voice Over** จะเริ่มจาก Script ปัจจุบันของ Content. เลือก Voice, ภาษา Thai/English และความเร็ว 0.75×–1.5× แล้วกด **Generate Voice Over**. ระบบเรียก OpenAI Audio Speech API ผ่าน Server, บันทึก MP3 ใน private storage เป็น `audio` Asset และแสดงตัวเล่นเสียงกับปุ่มลบ

OpenAI API รองรับ input ไม่เกิน 4,096 ตัวอักษร, voice และ speed 0.25–4.0; หน้า MVP จำกัดตัวเลือกที่ใช้งานง่ายกว่าไว้ที่ 0.75×–1.5×. ดู [OpenAI Audio API](https://platform.openai.com/docs/api-reference/audio/voice-consent-list) สำหรับ provider fields ที่ใช้อยู่

## ตรวจสอบ

```sh
npm run lint
npm run typecheck
npm test
npm run build
TEST_ADMIN_PASSWORD='P@ssw0rd1' npm run test:secrets
# ต้องมี npm run dev เปิดอยู่และติดตั้ง Google Chrome
TEST_ADMIN_PASSWORD='P@ssw0rd1' npm run test:e2e
```

Browser tests ใช้ฐานข้อมูลที่ตั้งใน `.env` สร้าง Session และสินค้าทดสอบจริง แล้วลบข้อมูลทดสอบผ่าน API ควรรันกับฐานข้อมูลสำหรับพัฒนา Project `rate-limit` รันหลัง `flows` เพื่อไม่ให้การทดสอบจำกัด Login รบกวนชุดอื่น ถ้าจะรันทันทีอีกครั้งให้ restart server หรือรอ 1 นาที

ทดสอบเฉพาะคลังสินค้า:

```sh
TEST_ADMIN_PASSWORD='P@ssw0rd1' npm run test:e2e -- --project=flows tests/e2e/products.spec.ts
```

ทดสอบ Flow AI แบบแยกจากแอปจริง โดยใช้คำตอบจำลองที่ขอบเขต HTTP ของ Provider และใช้ฐานข้อมูลจริง:

```sh
npm run build
TEST_ADMIN_PASSWORD='P@ssw0rd1' npm run test:e2e:ai
```

คำสั่งนี้เปิด Production test server ชั่วคราวที่ `127.0.0.1:3100` แล้วปิดหลังทดสอบ ใช้ Key ปลอมเฉพาะ process ทดสอบและโหลด `tests/helpers/mock-openai.mjs` โดยตรง ไม่มีตัวเลือก mock ในแอปปกติ ผลถูกระบุ `MOCK` / `mock-openai-model` และลบทิ้งเมื่อทดสอบเสร็จ ชุดทดสอบนี้ **ไม่ยืนยันคุณภาพหรือการเชื่อมต่อ OpenAI จริง**

ตรวจ live หลังตั้ง Key: เลือกสินค้า กด Generate แล้วตรวจว่าข้อความทั้ง 5 ส่วนอิงสินค้าถูกต้องและเป็นภาษา/รูปแบบที่เลือก จากนั้นแก้ไข บันทึก Refresh และตรวจ Provider/Model ในหน้าคอนเทนต์

## Production build

```sh
npm run build
npm start
```

สำหรับการนำไปใช้งานบนเซิร์ฟเวอร์ ตั้ง `APP_ORIGIN` เป็น HTTPS URL จริงและให้ reverse proxy รับ HTTPS เพราะ Cookie ใน Production ใช้ `Secure` บัญชีและรหัสผ่านทดสอบเป็นข้อมูลที่อยู่ในเอกสารแผน ควรตั้งรหัสผ่านส่วนตัวและสร้าง hash ใหม่ก่อนเปิดใช้ภายนอก

ทดสอบ Production ในเครื่องโดยใช้ loopback ของ Chrome:

```sh
APP_ORIGIN=http://127.0.0.1:3001 npm start -- --port 3001
# อีก Terminal:
TEST_BASE_URL=http://127.0.0.1:3001 TEST_PRODUCTION=1 TEST_ADMIN_PASSWORD='P@ssw0rd1' npm run test:e2e
```

Login limiter ของ MVP เก็บในหน่วยความจำ จำกัดรวมทั้งแอป 10 ครั้งต่อนาที ใช้สำหรับแอปส่วนตัวที่รันหนึ่ง process; ถ้าขยายเป็นหลาย instance ต้องเปลี่ยนเป็น shared limiter

Prisma tooling ใช้ overrides ของ `deepmerge-ts` และ `mysql2` เป็นรุ่นที่แก้ advisory แล้ว โดยตรวจ Prisma generate, migration และ build หลังอัปเดต

แนวทางอ้างอิง: [Next.js Authentication](https://nextjs.org/docs/app/guides/authentication), [Prisma 7 configuration](https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7), [Sharp image validation options](https://sharp.pixelplumbing.com/api-constructor/)

AI reference: [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [GPT-5.4 Mini](https://developers.openai.com/api/docs/models/gpt-5.4-mini), [OpenAI Audio API](https://platform.openai.com/docs/api-reference/audio/voice-consent-list)

ดูผลตรวจตามรายการใน `PHASE-*-ACCEPTANCE.md` และสถานะงานที่ยังดำเนินการใน `PHASE-*-STATUS.md`
