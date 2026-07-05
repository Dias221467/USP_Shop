import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
});

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
    <html lang="ru" className={manrope.className}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
