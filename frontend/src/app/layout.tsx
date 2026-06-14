import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "USP Store — Обувь и одежда",
  description: "Магазин обуви и одежды в Семее",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="antialiased">{children}</body>
    </html>
  );
}
