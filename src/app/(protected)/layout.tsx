import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSession();
  return (
    <>
      <header className="app-header">
        <Link className="brand" href="/dashboard">
          AI Affiliate System
        </Link>
        <nav aria-label="Main navigation">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/products">Products</Link>
          <Link href="/content">Content</Link>
          <Link href="/calendar">Calendar</Link>
          <Link href="/usage">AI Usage</Link>
          <Link href="/settings">Settings</Link>
        </nav>
        <form action="/api/auth/logout" method="post">
          <button className="secondary" type="submit">
            Logout
          </button>
        </form>
      </header>
      <main className="page">{children}</main>
    </>
  );
}
