import { requireSession } from "@/lib/auth/session";
import { listSocialAccounts } from "@/lib/social/service";
export default async function Settings() {
  const { user } = await requireSession();
  const accounts = await listSocialAccounts(user.id);
  return (
    <><h1>Settings</h1><section className="panel"><h2>Social Accounts</h2><p className="muted">Facebook, Instagram และ TikTok จะเชื่อมผ่าน OAuth โดย token ถูกเข้ารหัสในฐานข้อมูล</p>{accounts.length ? <div className="table-wrap"><table><thead><tr><th>Platform</th><th>Account</th><th>Status</th><th>Expires</th></tr></thead><tbody>{accounts.map(a=><tr key={a.id}><td>{a.platform}</td><td>{a.accountName}</td><td>{a.status}</td><td>{a.expiresAt?.toLocaleString()??"—"}</td></tr>)}</tbody></table></div> : <p className="muted">ยังไม่มีบัญชีที่เชื่อมต่อ</p>}<p className="muted">ต้องตั้ง OAuth Client ID และ Secret ของแต่ละแพลตฟอร์มก่อนจึงจะแสดงปุ่มเชื่อมบัญชีได้</p></section></>
  );
}
