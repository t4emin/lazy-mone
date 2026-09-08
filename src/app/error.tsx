"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="page">
      <h1>ระบบไม่พร้อมใช้งานชั่วคราว</h1>
      <p>กรุณาลองอีกครั้ง หากยังพบปัญหา ให้ตรวจสอบการเชื่อมต่อฐานข้อมูล</p>
      <button onClick={reset}>ลองอีกครั้ง</button>
    </main>
  );
}
