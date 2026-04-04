import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "성무일도 — Залбиралт цагийн ёслол",
  description: "몽골어 성무일도(시간전례) 이북 리더",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mn" className="h-full">
      <body className="h-full bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
        {children}
      </body>
    </html>
  );
}
