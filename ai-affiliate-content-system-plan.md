# AI Affiliate Content System — Development Plan

## Project Goal

สร้าง Web Application สำหรับใช้งานส่วนตัว เพื่อช่วยจัดการสินค้า Affiliate และสร้าง Content ด้วย AI

ระบบในระยะแรกให้เน้น:

- Feature ใช้งานได้จริงก่อน
- Code structure อ่านง่าย
- สามารถพัฒนาต่อได้
- ไม่ต้องเน้น UI/Animation
- Desktop-first
- รองรับการเพิ่ม AI Provider และ Social Platform ในอนาคต

เป้าหมาย Flow ระยะยาว:

```text
Login
  ↓
Product Library
  ↓
Upload Product Images
  ↓
Create Content
  ↓
Generate Script / Caption ด้วย AI
  ↓
Generate Image / Video / Voice
  ↓
Preview
  ↓
Save Draft
  ↓
Publish / Schedule Social Media
  ↓
Track History / Cost / Analytics
```

---

# Recommended Stack

```text
Next.js
TypeScript
App Router

Database:
PostgreSQL

ORM:
Prisma

Authentication:
Custom Session Authentication สำหรับ MVP

Storage:
Phase แรกใช้ local file system ก่อน
ภายหลังเปลี่ยนเป็น S3-compatible storage

Validation:
Zod

Styling:
CSS Modules / SCSS / CSS ปกติ
ไม่จำเป็นต้องใช้ Tailwind

AI:
ออกแบบ Provider Adapter
ห้ามผูกระบบกับ AI Provider เจ้าเดียว
```

---

# General Coding Rules

1. ใช้ TypeScript
2. หลีกเลี่ยง `any`
3. แยก Business Logic ออกจาก UI
4. Component ห้ามทำงาน Database โดยตรง
5. API Key และ Secret ทั้งหมดต้องอยู่ใน `.env`
6. ห้าม expose API Key หรือ Secret ไปยัง Browser
7. Validate Input ฝั่ง Server
8. ทำ Error Handling
9. ตั้งชื่อ Function / Variable ให้อ่านเข้าใจง่าย
10. Code ต้องเตรียมพร้อมสำหรับเปลี่ยนจาก Single User → Multi User ในอนาคต
11. Phase ปัจจุบันห้ามทำ Feature ของ Phase ถัดไปเกินความจำเป็น
12. UI ใช้แบบเรียบง่ายที่สุดก่อน
13. ทุก Phase ต้องหยุดหลังผ่าน Acceptance Criteria และรอคำสั่งก่อนทำ Phase ถัดไป

---

# PHASE 1 — Authentication + Application Base

## Goal

ให้ระบบเปิดใช้งานได้จริง และต้อง Login ก่อนเข้าใช้งานส่วนหลัก

Phase นี้ยังไม่ต้องมี Product, AI, Image Generation, Video Generation หรือ Social Media Integration

---

## 1.1 Login

สร้าง Route:

```text
/login
```

Form:

```text
Username
Password

[ Login ]
```

MVP ใช้ User เดียว:

```text
username: madao
password: P@ssw0rd1
```

ห้ามใส่ Password ลงใน Client Component

Credential ต้องตรวจสอบจาก Server เท่านั้น

Environment Variables:

```env
ADMIN_USERNAME=madao
ADMIN_PASSWORD_HASH=
SESSION_SECRET=
DATABASE_URL=
```

ให้สร้าง Password Hash จาก:

```text
P@ssw0rd1
```

ห้ามเก็บ Password แบบ Plain Text ใน Database หรือ Client-side code

---

## 1.2 Authentication Flow

เมื่อ Login สำเร็จ:

```text
/login
   ↓
verify credentials
   ↓
create secure session
   ↓
/dashboard
```

Session ต้องมีคุณสมบัติ:

- HTTP Only
- Secure เมื่ออยู่ Production
- SameSite
- มี Expiration
- Browser JavaScript อ่าน Session Token ไม่ได้

---

## 1.3 Route Protection

Routes ต่อไปนี้ต้องเข้าไม่ได้ถ้ายังไม่ Login:

```text
/dashboard
/products
/content
/settings
```

ถ้ายังไม่ Login:

```text
/dashboard
    ↓
redirect
    ↓
/login
```

ถ้า Login แล้วและเปิด `/login`:

```text
/login
   ↓
redirect
   ↓
/dashboard
```

---

## 1.4 Logout

ต้องมีปุ่ม:

```text
Logout
```

เมื่อกด:

```text
destroy session
↓
redirect /login
```

หลัง Logout แล้ว Session เดิมต้องใช้งานไม่ได้

---

## 1.5 Application Layout

หลัง Login ใช้ Layout ง่ายๆ:

```text
-----------------------------------------
AI Affiliate System

Dashboard
Products
Content
Settings

                            Logout
-----------------------------------------

Page Content
```

Navigation ที่ Feature ยังไม่เสร็จสามารถเป็น Placeholder ได้

ยังไม่ต้องออกแบบ UI ให้สวย

---

## 1.6 Dashboard

สร้าง:

```text
/dashboard
```

แสดง:

```text
Dashboard

Welcome, madao

Products: 0
Draft Contents: 0
Generated Videos: 0
Published Posts: 0
```

Phase นี้ใช้ค่า `0` ไปก่อน

---

## 1.7 Database Foundation

Setup:

```text
PostgreSQL
Prisma
```

Phase 1 ยังไม่ต้องสร้าง Schema ใหญ่

สามารถเตรียม `User` Model สำหรับอนาคตได้ เช่น:

```text
User
- id
- username
- createdAt
- updatedAt
```

Authentication MVP ยังให้ใช้ Single User Credential ตาม Environment Variable ก่อน

---

## 1.8 Environment

สร้าง:

```text
.env.example
```

ตัวอย่าง:

```env
DATABASE_URL=
ADMIN_USERNAME=
ADMIN_PASSWORD_HASH=
SESSION_SECRET=
```

`.env` จริงต้องอยู่ใน `.gitignore`

---

## Phase 1 Acceptance Criteria

Phase 1 ถือว่าเสร็จเมื่อผ่านทั้งหมด:

- [ ] `npm run dev` เปิดระบบได้
- [ ] `/` redirect ตาม Login State
- [ ] เปิด `/login` ได้
- [ ] Login ด้วย `madao / P@ssw0rd1` สำเร็จ
- [ ] Password ผิด Login ไม่ได้
- [ ] Username ผิด Login ไม่ได้
- [ ] Login สำเร็จ redirect ไป `/dashboard`
- [ ] Refresh หน้าแล้วยัง Login อยู่
- [ ] `/dashboard` ถูก Protect
- [ ] `/products` ถูก Protect
- [ ] `/content` ถูก Protect
- [ ] `/settings` ถูก Protect
- [ ] Logout ได้
- [ ] Logout แล้ว Session เดิมใช้งานต่อไม่ได้
- [ ] Secret ไม่ปรากฏใน Client Bundle
- [ ] `.env` ไม่ถูก Commit
- [ ] Prisma เชื่อม PostgreSQL สำเร็จ
- [ ] ไม่มี Error สำคัญใน Browser Console หรือ Terminal

---

# PHASE 2 — Product Library

## Goal

สามารถสร้างและจัดการสินค้า Affiliate ได้

---

## 2.1 Product List

Route:

```text
/products
```

แสดงสินค้าแบบ Table ง่ายๆ:

```text
Name
Platform
Price
Affiliate Link
Status
Created
Actions
```

Actions:

```text
View
Edit
Delete
```

---

## 2.2 Create Product

Route:

```text
/products/new
```

Fields:

```text
Product Name *
Platform *

- Shopee
- TikTok Shop
- Other

Product URL

Affiliate URL

Price

Description

Product Features

Notes

Status
- Active
- Inactive
```

---

## 2.3 Product Images

รองรับ Upload หลายรูปต่อสินค้า

ต้องสามารถ:

- Upload หลายรูป
- Preview รูป
- Delete รูป
- ตั้ง Main Image

รองรับอย่างน้อย:

```text
jpg
jpeg
png
webp
```

กำหนด File Size Limit

Phase 2 ใช้ Local Storage/File System ก่อนได้

แต่ Storage Layer ต้องออกแบบให้เปลี่ยน Provider ภายหลังได้

---

## 2.4 Product Detail

Route:

```text
/products/[id]
```

แสดง:

```text
Product Info
Images
Affiliate Link
Description
Features
Created Date
Updated Date
```

Actions:

```text
Edit
Create Content
Delete
```

`Create Content` สามารถเป็น Placeholder ได้จนถึง Phase 3

---

## 2.5 Database

Models หลัก:

```text
Product
ProductAsset
```

Product:

```text
id
name
platform
productUrl
affiliateUrl
price
description
features
notes
status
createdAt
updatedAt
```

ProductAsset:

```text
id
productId
type
filePath
fileName
mimeType
fileSize
isPrimary
createdAt
```

---

## Phase 2 Acceptance Criteria

- [ ] Create Product ได้
- [ ] Edit Product ได้
- [ ] Delete Product ได้
- [ ] ดู Product List ได้
- [ ] ดู Product Detail ได้
- [ ] Upload หลายรูปได้
- [ ] Delete รูปได้
- [ ] ตั้ง Main Image ได้
- [ ] Validation ทำงาน
- [ ] Affiliate URL เก็บได้
- [ ] Refresh แล้วข้อมูลยังอยู่
- [ ] Product ทุก Route ต้อง Login ก่อน

---

# PHASE 3 — AI Text Content

## Goal

เลือกสินค้าแล้วให้ AI ช่วยสร้าง Content สำหรับ Social Media

Phase นี้ทำเฉพาะ Text AI

ยังไม่ทำ AI Image หรือ AI Video

---

## 3.1 Create Content

จาก Product Detail:

```text
Create Content
```

Route:

```text
/products/[id]/content/new
```

Content Type:

```text
Product Review
Short Review
Product Recommendation
Comparison
Promotion
Educational
```

Target Platform:

```text
Facebook
TikTok
Instagram
Shopee
Generic
```

Options:

```text
Language
Tone
Target Audience
Additional Instructions
```

---

## 3.2 Generate

ส่ง Product Data:

```text
Name
Description
Features
Price
Platform
Affiliate URL
```

ไปยัง AI Provider

AI Response ต้องประกอบด้วย:

```text
Hook
Video Script
Caption
CTA
Hashtags
```

---

## 3.3 AI Provider Architecture

ห้ามผูก OpenAI หรือ Provider อื่นไว้ทั่ว Project

สร้าง Interface กลาง เช่น:

```text
AITextProvider
generateContent()
```

Suggested structure:

```text
lib/
  ai/
    providers/
      openai.ts
      gemini.ts
      claude.ts

    text-provider.ts
    ai-service.ts
```

Phase 3 Implement จริงเพียง Provider เดียวก่อนได้

Architecture ต้องพร้อมเพิ่ม Provider อื่น

---

## 3.4 Content Editor

หลัง Generate ต้องสามารถแก้:

```text
Hook
Script
Caption
CTA
Hashtags
```

---

## 3.5 Save Draft

Draft ต้องเก็บ:

```text
Product
Content Type
Target Platform
Hook
Script
Caption
CTA
Hashtags
AI Provider
AI Model
Status
Created
Updated
```

Status:

```text
draft
ready
```

---

## Phase 3 Acceptance Criteria

- [ ] เลือก Product แล้ว Create Content ได้
- [ ] AI อ่าน Product Data ได้
- [ ] Generate Hook ได้
- [ ] Generate Script ได้
- [ ] Generate Caption ได้
- [ ] Generate CTA ได้
- [ ] Generate Hashtags ได้
- [ ] User แก้ผลลัพธ์ได้
- [ ] Save Draft ได้
- [ ] Refresh แล้ว Draft ยังอยู่
- [ ] เก็บ AI Provider และ Model ที่ใช้

---

# PHASE 4 — Asset Library + AI Image

## Goal

ให้ Content ใช้รูปสินค้าที่ Upload ไว้ และสามารถสร้างรูปใหม่จาก AI ได้

---

## Features

เลือก Existing Product Images ได้

หรือ:

```text
Generate AI Image
```

AI Image Settings:

```text
Prompt
Reference Product Images
Aspect Ratio

- 1:1
- 4:5
- 9:16
- 16:9

AI Provider
Model
```

ผลลัพธ์ต้องถูกเก็บเป็น Asset

---

## Asset Types

```text
product_image
generated_image
video
audio
```

Generated Asset ต้องเก็บ Relation ว่า:

```text
Content ไหน
Product ไหน
Provider ไหน
Model ไหน
Prompt อะไร
```

---

# PHASE 5 — AI Video Generation

## Goal

สร้าง Video จาก Product Content

Flow:

```text
Product
+
Script
+
Selected Images
↓
AI Video Generation
```

Settings:

```text
AI Provider
Model
Duration
Aspect Ratio
Prompt
Reference Images
```

AI Video ต้องใช้ Job Status:

```text
pending
processing
completed
failed
```

เก็บ Video Generation History:

```text
Provider
Model
Prompt
Duration
Created
Status
Estimated Cost
Output
```

ต้อง Retry ได้เมื่อ Failed

---

# PHASE 6 — Voice Generation

## Goal

สร้าง Voice Over จาก Script

Flow:

```text
Script
↓
Voice Provider
↓
Voice Selection
↓
Generate
↓
Audio Asset
```

Settings:

```text
Provider
Voice
Language
Speed
```

ต้อง Preview Audio ได้

---

# PHASE 7 — Internal Video Composer

## Goal

ลดค่า AI Video โดยประกอบคลิปจาก Asset ที่มีอยู่เอง

Input:

```text
Product Images
Generated Images
Voice Over
Text
Transitions
```

Output:

```text
MP4
```

แนะนำ Server-side Rendering ด้วย FFmpeg

Basic Scene:

```text
Scene 1
Image
Duration
Text

Scene 2
Image
Duration
Text
```

Effects เบื้องต้น:

```text
Pan
Zoom
Fade
Slide
```

ไม่ต้องทำ Editor ซับซ้อนแบบ CapCut

---

# PHASE 8 — Content Preview

Route:

```text
/content/[id]
```

แสดง:

```text
Product
Video Preview
Images
Hook
Script
Caption
CTA
Hashtags
Affiliate URL
```

Status:

```text
Draft
Ready
Published
```

---

# PHASE 9 — Social Account Connections

## Goal

เชื่อม Social Platform

เตรียมรองรับ:

```text
Facebook
Instagram
TikTok
```

Shopee ให้พิจารณาแยกตาม API ที่สามารถใช้งานจริงได้

SocialAccount:

```text
id
platform
accountName
externalAccountId
token
refreshToken
expiresAt
status
```

Token ต้อง Encrypt

ห้ามเก็บ Token แบบ Plain Text

---

# PHASE 10 — Social Publisher

## Goal

เลือก Content แล้ว Publish ไป Social Media

ตัวอย่าง:

```text
Publish to

[x] Facebook
[x] Instagram
[ ] TikTok
```

Caption ของแต่ละ Platform ต้องแก้แยกกันได้

เก็บ Publish Result:

```text
Platform
External Post ID
Status
Published At
Error Message
```

Status:

```text
pending
publishing
published
failed
```

Failed ต้อง Retry ได้

---

# PHASE 11 — Scheduling

ตั้งเวลาโพสต์ได้

```text
Publish Date
Publish Time
```

Actions:

```text
Schedule
Cancel Schedule
Reschedule
```

---

# PHASE 12 — Content Calendar

แสดง Scheduled Content ตามวันที่

สามารถกดจาก Calendar ไป Content Detail ได้

---

# PHASE 13 — AI Usage & Cost Tracking

เก็บทุก AI Generation:

```text
Provider
Model
Type

- text
- image
- video
- voice

Input Usage
Output Usage
Estimated Cost
Created
```

Dashboard:

```text
Text AI
Image AI
Video AI
Voice AI
Total Cost
```

---

# PHASE 14 — AI Budget

ตั้ง Monthly AI Budget เช่น:

```text
2,000 THB
```

Feature:

```text
Warn at 80%
Stop Generation at 100%
```

---

# PHASE 15 — Analytics

ถ้า Platform/API รองรับ ให้เก็บ:

```text
Views
Likes
Comments
Shares
Clicks
Orders
Commission
```

ดู Performance แยกตาม:

```text
Product
Content
Platform
```

---

# PHASE 16 — Affiliate Intelligence

เมื่อมีข้อมูลมากพอ ให้ AI วิเคราะห์ Performance

ตัวอย่าง:

```text
This product is performing well.

Recommended:
Create another comparison video.
```

AI สามารถแนะนำ:

- Product ที่ควรทำ Content เพิ่ม
- Content Type ที่ทำผลงานดี
- Platform ที่เหมาะ
- หัวข้อ Comparison
- Hook ใหม่
- แนวทาง Optimize Content

---

# Development Order

```text
Phase 1
Authentication
↓
Phase 2
Product Library
↓
Phase 3
AI Text
↓
Phase 4
AI Image
↓
Phase 5
AI Video
↓
Phase 6
Voice
↓
Phase 7
Video Composer
↓
Phase 8
Content Preview
↓
Phase 9-10
Social Integration
↓
Phase 11-12
Scheduling
↓
Phase 13-14
Cost Tracking
↓
Phase 15-16
Analytics + Intelligence
```

---

# CURRENT TASK FOR CODEX

## IMPORTANT

ตอนนี้ให้ทำ **PHASE 1 เท่านั้น**

ห้ามเริ่ม Phase 2 หรือ Phase อื่น

Current Goal:

```text
Project Setup
+
PostgreSQL / Prisma Foundation
+
Login
+
Secure Session
+
Protected Routes
+
Dashboard
+
Logout
```

Test Credential:

```text
Username: madao
Password: P@ssw0rd1
```

## Codex Workflow

1. อ่านเอกสารนี้ทั้งหมดก่อน
2. เข้าใจ Architecture ระยะยาว
3. Implement เฉพาะ Phase 1
4. อย่าสร้าง Feature ของ Phase 2+
5. หลัง Implement ให้ Run/Test ตาม Phase 1 Acceptance Criteria
6. Fix Error ที่พบใน Scope ของ Phase 1
7. สรุปไฟล์ที่สร้าง/แก้
8. สรุปวิธี Run Project
9. สรุป Environment Variables ที่ต้องตั้ง
10. รายงาน Acceptance Criteria ว่าผ่านข้อไหนบ้าง
11. จากนั้นหยุด และรอคำสั่งสำหรับ Phase 2
