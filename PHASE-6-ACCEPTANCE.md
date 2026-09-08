# Phase 6 — Voice Generation

ตรวจวันที่ 8 กันยายน 2026

**Phase 6 เสร็จสมบูรณ์:** ระบบสร้าง voice over จาก Script ผ่าน provider adapter, เก็บ MP3 เป็น private Audio Asset และ preview เสียงจากหน้า Content ได้

## Acceptance Criteria

| รายการตามแผน                                     | สถานะ                                                                                   |
| ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| Script → Voice Provider → Generate → Audio Asset | ผ่าน: Server ตรวจ Content/ownership, เรียก provider และเก็บ MP3 เป็น `audio` Asset      |
| Provider                                         | ผ่าน: OpenAI TTS provider ผ่าน `AIAudioProvider` interface                              |
| Voice                                            | ผ่าน: เลือก built-in voice ได้ 13 เสียง                                                 |
| Language                                         | ผ่าน: Thai หรือ English ถูก validate, ส่งเป็น instruction ให้ provider และเก็บกับ Asset |
| Speed                                            | ผ่าน: เลือก 0.75×, 1×, 1.25× หรือ 1.5× และเก็บกับ Asset                                 |
| Preview Audio                                    | ผ่าน: HTML audio player อ่าน MP3 ผ่าน authenticated asset route                         |
| ลบ Audio Asset                                   | ผ่าน: ลบ record และไฟล์ private storage พร้อมกัน                                        |

## ผลทดสอบ

- Migration `20260908150000_voice_generation` apply แล้ว
- OpenAI audio adapter unit test ตรวจ endpoint, model, input, voice, language, speed และ MP3 bytes
- `npm run typecheck`, `npm run lint`, `npm test` (**9/9 ผ่าน**) และ `npm run build` ผ่าน
- ไม่ได้สร้างเสียงจริงเพิ่มระหว่างการตรวจครั้งนี้ เพื่อไม่ให้เรียกเก็บค่า API โดยไม่จำเป็น; การกด Generate Voice Over ใน UI ใช้ `OPENAI_API_KEY` ที่ตั้งไว้จริง
