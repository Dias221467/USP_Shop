'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const STATS = [
  { value: '500+', label: 'Моделей' },
  { value: '2+', label: 'Года на рынке' },
  { value: '1000+', label: 'Довольных клиентов' },
];

export function FeaturedSection() {
  return (
    <section className="bg-black text-white overflow-hidden">
      {/* Главный блок */}
      <div className="min-h-screen flex items-center px-8 py-32">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.65, 0, 0.35, 1] }}
              className="space-y-12"
            >
              <div className="space-y-6">
                <p className="text-white/50 text-xs tracking-[0.4em] uppercase">Эксклюзивная линия</p>
                <h2 className="text-7xl md:text-8xl tracking-tight font-light leading-[0.95]">
                  Комфорт
                  <br />в каждом
                  <br />шаге
                </h2>
                <div className="w-16 h-px bg-white/20" />
              </div>
              <p className="text-lg text-white/60 max-w-md leading-relaxed font-light">
                Наша обувь создана для тех, кто ценит минимализм и качество.
                Каждая деталь продумана до мелочей.
              </p>
              <div className="flex gap-4">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    href="/catalog?category=shoes"
                    className="inline-block px-8 py-4 rounded-full bg-white text-black text-sm hover:bg-white/90 transition-all duration-300"
                  >
                    Смотреть обувь
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    href="/catalog"
                    className="inline-block px-8 py-4 rounded-full border border-white/30 text-sm hover:border-white transition-all duration-300"
                  >
                    Весь каталог
                  </Link>
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.65, 0, 0.35, 1] }}
              className="relative"
            >
              <div className="aspect-square rounded-3xl overflow-hidden bg-white/5">
                <img
                  src="/sneakers/nike-sb-dunk-black.jpg"
                  alt="Featured sneaker"
                  className="w-full h-full object-contain p-12 hover:scale-105 transition-transform duration-700"
                />
              </div>
              {/* Floating badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="absolute -bottom-6 -left-6 bg-white text-black rounded-2xl px-6 py-4"
              >
                <p className="text-xs text-black/40 uppercase tracking-widest mb-1">Семей</p>
                <p className="font-medium">USP Store</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Статистика */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-8 py-16">
          <div className="grid grid-cols-3 gap-8">
            {STATS.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="text-center"
              >
                <p className="text-4xl md:text-5xl font-light mb-2">{stat.value}</p>
                <p className="text-white/40 text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Категории */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Link href="/catalog?category=shoes">
                <div className="group relative rounded-3xl overflow-hidden bg-white/5 hover:bg-white/10 transition-all duration-500 p-12 h-64 flex flex-col justify-between">
                  <p className="text-xs tracking-[0.3em] uppercase text-white/40">Категория</p>
                  <div>
                    <h3 className="text-4xl font-light mb-3">Обувь</h3>
                    <p className="text-white/40 text-sm group-hover:text-white/60 transition-colors">
                      Смотреть коллекцию →
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.6 }}
            >
              <Link href="/catalog?category=clothing">
                <div className="group relative rounded-3xl overflow-hidden bg-white/5 hover:bg-white/10 transition-all duration-500 p-12 h-64 flex flex-col justify-between">
                  <p className="text-xs tracking-[0.3em] uppercase text-white/40">Категория</p>
                  <div>
                    <h3 className="text-4xl font-light mb-3">Одежда</h3>
                    <p className="text-white/40 text-sm group-hover:text-white/60 transition-colors">
                      Смотреть коллекцию →
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
