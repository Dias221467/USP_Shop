'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-black text-white py-20 px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mb-16">
          <div>
            <h3 className="text-3xl tracking-tight mb-6">USP</h3>
            <p className="opacity-50 text-sm leading-relaxed">
              Магазин обуви и одежды. Качество в каждой детали.
            </p>
          </div>

          <div>
            <p className=" text-xs mb-6 tracking-widest uppercase">Каталог</p>
            <div className="flex flex-col gap-3">
              <Link href="/catalog?category=shoes" className=" hover:opacity-100 transition-opacity text-sm">
                Обувь
              </Link>
              <Link href="/catalog?category=clothing" className=" hover:opacity-100 transition-opacity text-sm">
                Одежда
              </Link>
              <Link href="/catalog" className=" hover:opacity-100 transition-opacity text-sm">
                Все коллекции
              </Link>
            </div>
          </div>

          <div>
            <p className=" text-xs mb-6 tracking-widest uppercase">Контакты</p>
            <div className="flex flex-col gap-3">
              <a href="https://www.instagram.com/usp_semsk/" target="_blank" rel="noopener noreferrer" className=" hover:opacity-100 transition-opacity text-sm">
                Instagram
              </a>
              <a href="https://t.me/+IP7xvYedaB82YzAy" target="_blank" rel="noopener noreferrer" className=" hover:opacity-100 transition-opacity text-sm">
                Telegram
              </a>
              <a href="https://wa.me/77477574852" target="_blank" rel="noopener noreferrer" className=" hover:opacity-100 transition-opacity text-sm">
                WhatsApp
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className=" text-xs">© 2026 USP Store. Все права защищены.</p>
          <p className=" text-xs">Семей, Казахстан</p>
        </div>
      </div>
    </footer>
  );
}
