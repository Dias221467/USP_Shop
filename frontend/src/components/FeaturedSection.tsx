'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export function FeaturedSection() {
  return (
    <section className="min-h-screen flex items-center bg-black text-white px-8 py-32">
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
              <p className="opacity-50">Эксклюзивная линия</p>
              <h2 className="text-7xl md:text-8xl tracking-tight font-light leading-[0.95]">
                Комфорт
                <br />в каждом
                <br />шаге
              </h2>
            </div>
            <p className="text-xl opacity-70 max-w-md leading-relaxed font-light">
              Наша обувь создана для тех, кто ценит минимализм и качество.
              Каждая деталь продумана до мелочей.
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/catalog?category=shoes"
                className="inline-block px-10 py-5 rounded-full border-2 border-white hover:bg-white hover:text-black transition-all duration-500"
              >
                Смотреть обувь
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.65, 0, 0.35, 1] }}
            className="aspect-square rounded-3xl bg-white/5 overflow-hidden"
          >
            <img
              src="https://images.unsplash.com/photo-1608379743498-ac08f6d022ba?w=800&q=80"
              alt="Featured"
              className="w-full h-full object-cover"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
