import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "USP Store — Обувь и одежда в Семее",
    template: "%s — USP Store",
  },
  description: "Оригинальные кроссовки и одежда в Семее. Nike, Adidas, New Balance и другие бренды. Самовывоз и доставка по Казахстану.",
  openGraph: {
    title: "USP Store — Обувь и одежда в Семее",
    description: "Оригинальные кроссовки и одежда в Семее. Самовывоз и доставка по Казахстану.",
    type: "website",
    siteName: "USP Store",
    locale: "ru_RU",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="antialiased">{children}</body>
    </html>
  );
}
