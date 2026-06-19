'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-black text-white py-16 md:py-20 px-6 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-12 md:mb-16">
          {/* Brand */}
          <div className="col-span-2 md:col-span-2">
            <h3 className="text-4xl tracking-tight mb-4">USP</h3>
            <p className="text-white/40 text-sm leading-relaxed max-w-xs">
              Магазин обуви и одежды в Семее. Оригинальные модели ведущих брендов.
              Качество в каждой детали.
            </p>
            <div className="mt-6 space-y-1 text-sm text-white/30">
              <p>г. Семей, Казахстан</p>
              <a href="https://wa.me/77477574852" className="hover:text-white transition-colors">
                +7 747 757 48 52
              </a>
            </div>
          </div>

          {/* Каталог */}
          <div>
            <p className="text-white/30 text-xs mb-6 tracking-widest uppercase">Каталог</p>
            <div className="flex flex-col gap-3">
              <Link href="/catalog?category=shoes" className="text-white/60 hover:text-white transition-colors text-sm">
                Обувь
              </Link>
              <Link href="/catalog?category=clothing" className="text-white/60 hover:text-white transition-colors text-sm">
                Одежда
              </Link>
              <Link href="/catalog" className="text-white/60 hover:text-white transition-colors text-sm">
                Все товары
              </Link>
            </div>
          </div>

          {/* Контакты */}
          <div>
            <p className="text-white/30 text-xs mb-6 tracking-widest uppercase">Связаться</p>
            <div className="flex flex-col gap-3">
              <a
                href="https://www.instagram.com/usp_semsk/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-white transition-colors text-sm"
              >
                Instagram
              </a>
              <a
                href="https://t.me/+IP7xvYedaB82YzAy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-white transition-colors text-sm"
              >
                Telegram
              </a>
              <a
                href="https://wa.me/77477574852"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-white transition-colors text-sm"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/20 text-xs">© 2026 USP Store. Все права защищены.</p>
          <div className="flex gap-6 text-white/20 text-xs">
            <Link href="/account" className="hover:text-white/50 transition-colors">Аккаунт</Link>
            <Link href="/cart" className="hover:text-white/50 transition-colors">Корзина</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
