import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "성무일도 — Залбиралт цагийн ёслол",
  description: "몽골어 성무일도(시간전례) 이북 리더",
};

// Inline script to apply dark mode before first paint, preventing FOUC
const themeScript = `
(function(){
  try {
    var s = JSON.parse(localStorage.getItem('divine-office-reader-settings') || '{}');
    if (s.darkMode) document.documentElement.classList.add('dark');
  } catch(e) {}
})()
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mn" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="h-full bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
        {children}
      </body>
    </html>
  );
}
