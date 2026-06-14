'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import api from '@/lib/api';
import { Product } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const MOCK: Product[] = [
  { id: 'm1', name: 'Nike SB Dunk Low', brand: 'Nike', price: 89000, category: 'shoes', images: ['/sneakers/nike-sb-dunk-black.jpg'], sizes: ['41','42','43'], colors: ['Black'], stock: 5, description: '', is_active: true },
  { id: 'm2', name: 'Adidas Samba OG', brand: 'Adidas', price: 79000, category: 'shoes', images: ['/sneakers/adidas-samba-white.jpg'], sizes: ['40','41','42'], colors: ['White'], stock: 8, description: '', is_active: true },
  { id: 'm3', name: 'Air Jordan 1 Low', brand: 'Jordan', price: 95000, category: 'shoes', images: ['/sneakers/air-jordan-1-low-sage.jpg'], sizes: ['41','42','43'], colors: ['Sage'], stock: 3, description: '', is_active: true },
  { id: 'm4', name: 'Nike P-6000', brand: 'Nike', price: 72000, category: 'shoes', images: ['/sneakers/nike-p6000-black.jpg'], sizes: ['42','43','44'], colors: ['Black'], stock: 6, description: '', is_active: true },
  { id: 'm5', name: 'Adidas Samba OG', brand: 'Adidas', price: 79000, category: 'shoes', images: ['/sneakers/adidas-samba-black.jpg'], sizes: ['40','41','42'], colors: ['Black'], stock: 4, description: '', is_active: true },
  { id: 'm6', name: 'New Balance 1906D', brand: 'New Balance', price: 85000, category: 'shoes', images: ['/sneakers/new-balance-1906d.jpg'], sizes: ['41','42','43'], colors: ['Grey'], stock: 2, description: '', is_active: true },
];

export function ProductGrid() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    api.get('/api/products').then((res) => {
      const data = res.data?.slice(0, 6) || [];
      setProducts(data.length > 0 ? data : MOCK);
    }).catch(() => setProducts(MOCK));
  }, []);

  const bgColors = ['#f0f0f0', '#fafafa', '#f8f8f8', '#2a2a2a', '#e8e8e8', '#f5f5f5'];

  return (
    <section className="py-32 px-8 bg-white">
      <div className="max-w-[1600px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-20 flex justify-between items-end"
        >
          <h2 className="text-7xl md:text-8xl tracking-tight font-light">Коллекция</h2>
          <Link href="/catalog" className="text-sm opacity-50 hover:opacity-100 transition-opacity pb-4">
            Смотреть всё →
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product, index) => {
            const bg = bgColors[index % bgColors.length];
            const isDark = bg === '#2a2a2a';
            const imageUrl = product.images?.[0]
              ? product.images[0].startsWith('http')
                ? product.images[0]
                : `${API_URL}${product.images[0]}`
              : 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80';

            return (
              <Link href={`/product/${product.id}`} key={product.id}>
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-100px' }}
                  transition={{ duration: 0.8, delay: index * 0.15, ease: [0.65, 0, 0.35, 1] }}
                  onHoverStart={() => setHoveredId(product.id)}
                  onHoverEnd={() => setHoveredId(null)}
                  className="group cursor-pointer"
                >
                  <motion.div
                    className="aspect-[4/5] rounded-3xl overflow-hidden relative"
                    animate={{ backgroundColor: bg, scale: hoveredId === product.id ? 0.98 : 1 }}
                    transition={{ duration: 0.6, ease: [0.65, 0, 0.35, 1] }}
                  >
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center p-12"
                      animate={{
                        scale: hoveredId === product.id ? 1.1 : 1,
                        rotate: hoveredId === product.id ? -5 : 0,
                      }}
                      transition={{ duration: 0.6, ease: [0.65, 0, 0.35, 1] }}
                    >
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="w-full h-full object-contain drop-shadow-xl"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </motion.div>

                    <motion.div
                      className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/60 to-transparent"
                      animate={{
                        opacity: hoveredId === product.id ? 1 : 0,
                        y: hoveredId === product.id ? 0 : 20,
                      }}
                      transition={{ duration: 0.4 }}
                    >
                      <h3 className="text-white text-2xl mb-2">{product.name}</h3>
                      <p className="text-white/90 text-xl">₸{product.price.toLocaleString()}</p>
                    </motion.div>
                  </motion.div>

                  <motion.div
                    className="mt-6 text-center"
                    animate={{
                      opacity: hoveredId === product.id ? 0 : 1,
                      y: hoveredId === product.id ? -10 : 0,
                    }}
                    transition={{ duration: 0.4 }}
                  >
                    <h3 className={`text-xl mb-1 font-light ${isDark ? '' : ''}`}>{product.name}</h3>
                    <p className="opacity-60">₸{product.price.toLocaleString()}</p>
                  </motion.div>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
