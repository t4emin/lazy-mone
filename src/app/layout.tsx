import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "AI Affiliate System",
  description: "Personal affiliate content workspace",
  icons: { icon: "/icon.svg" },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
