import { requireSession } from "@/lib/auth/session";
import { listSocialAccounts } from "@/lib/social/service";
import Link from "next/link";
import { RemoveSocialAccount } from "@/components/social/remove-social-account";
export default async function Settings() {
  const { user } = await requireSession();
  const accounts = await listSocialAccounts(user.id);
  return (
    <>
      <h1>Settings</h1>
      <section className="panel">
        <h2>Social Accounts</h2>
        <p className="muted">
          Facebook, Instagram และ TikTok จะเชื่อมผ่าน OAuth โดย token
          ถูกเข้ารหัสในฐานข้อมูล
        </p>
        {accounts.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Platform</th>
                  <th>Account</th>
                  <th>Status</th>
                  <th>Expires</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => (
                  <tr key={a.id}>
                    <td>{a.platform}</td>
                    <td>{a.accountName}</td>
                    <td>{a.status}</td>
                    <td>{a.expiresAt?.toLocaleString() ?? "—"}</td>
                    <td>
                      <RemoveSocialAccount id={a.id} name={a.accountName} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">ยังไม่มีบัญชีที่เชื่อมต่อ</p>
        )}
        <p>
          <Link className="button-link" href="/api/social/facebook/connect">
            Connect Facebook Page
          </Link>
        </p>
      </section>
    </>
  );
}
