import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
const messages: Record<string, string> = {
  invalid: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
  limited: "ลองเข้าสู่ระบบบ่อยเกินไป กรุณารอ 1 นาทีแล้วลองอีกครั้ง",
  unavailable: "ระบบไม่พร้อมใช้งานชั่วคราว กรุณาลองอีกครั้ง",
};
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await getSession()) redirect("/dashboard");
  const { error } = await searchParams;
  return (
    <main className="login-shell">
      <section className="login-card">
        <p className="eyebrow">AI AFFILIATE SYSTEM</p>
        <h1>Login</h1>
        <p className="muted">เข้าสู่ระบบเพื่อจัดการพื้นที่ทำงานของคุณ</p>
        {error && messages[error] && (
          <p className="error" role="alert">
            {messages[error]}
          </p>
        )}
        <form action="/api/auth/login" method="post" className="login-form">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            autoComplete="username"
            required
            maxLength={100}
            autoCapitalize="none"
          />
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            maxLength={256}
          />
          <button type="submit">Login</button>
        </form>
      </section>
    </main>
  );
}
