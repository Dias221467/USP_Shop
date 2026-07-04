'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import api from '@/lib/api';
import { Product } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function SalesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    api.get('/api/products?discounted=true')
      .then((res) => setProducts(res.data?.items || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="pt-28 md:pt-32 pb-20 px-4 md:px-8 lg:px-12">
        <div className="max-w-[1600px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-16"
          >
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-4">
              <h1 className="text-5xl md:text-7xl lg:text-8xl tracking-tight">
                Скидки<span className="text-red-500">.</span>
              </h1>
              {!loading && products.length > 0 && (
                <p className="text-black/30 text-sm pb-2">
                  {products.length} {products.length === 1 ? 'товар' : products.length < 5 ? 'товара' : 'товаров'}
                </p>
              )}
            </div>
            <p className="text-black/40 text-sm">Товары по сниженным ценам — пока не разобрали</p>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[4/5] rounded-3xl bg-black/4 border border-black/5 animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-40">
              <p className="text-4xl font-light opacity-20 mb-6">Сейчас скидок нет</p>
              <Link href="/catalog" className="text-sm underline underline-offset-4 hover:opacity-60 transition-opacity">
                Смотреть каталог →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product, index) => {
                const imageUrl = product.images?.[0]
                  ? product.images[0].startsWith('http')
                    ? product.images[0]
                    : `${API_URL}${product.images[0]}`
                  : null;
                const percent = product.old_price
                  ? Math.round((1 - product.price / product.old_price) * 100)
                  : 0;

                return (
                  <div key={product.id}>
                    {product.stock > 0 ? (
                      <Link href={`/product/${product.id}`}>
                        <motion.div
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: index * 0.05, ease: [0.65, 0, 0.35, 1] }}
                          onHoverStart={() => setHoveredId(product.id)}
                          onHoverEnd={() => setHoveredId(null)}
                          className="group cursor-pointer"
                        >
                          <motion.div
                            className="aspect-[4/5] rounded-3xl overflow-hidden bg-white border border-black/8 relative"
                            animate={{ scale: hoveredId === product.id ? 0.98 : 1, boxShadow: hoveredId === product.id ? '0 8px 40px rgba(0,0,0,0.10)' : '0 2px 12px rgba(0,0,0,0.06)' }}
                            transition={{ duration: 0.4 }}
                          >
                            {percent > 0 && (
                              <span className="absolute top-4 left-4 z-10 bg-red-500 text-white text-xs px-3 py-1 rounded-full">
                                -{percent}%
                              </span>
                            )}
                            <motion.div
                              className="absolute inset-0 flex items-center justify-center p-10"
                              animate={{ scale: hoveredId === product.id ? 1.08 : 1 }}
                              transition={{ duration: 0.5, ease: [0.65, 0, 0.35, 1] }}
                            >
                              {imageUrl ? (
                                <img src={imageUrl} alt={product.name} className="w-full h-full object-contain" />
                              ) : (
                                <div className="flex flex-col items-center justify-center gap-3 opacity-20">
                                  <span className="text-5xl font-black">{product.brand.slice(0, 1)}</span>
                                  <span className="text-xs tracking-widest uppercase">{product.brand}</span>
                                </div>
                              )}
                            </motion.div>
                          </motion.div>

                          <div className="mt-4 px-1">
                            <p className="text-xs uppercase tracking-widest mb-1">{product.brand}</p>
                            <h3 className="font-light text-base leading-snug mb-1">{product.name}</h3>
                            <p className="font-light">
                              <span className="text-red-500">₸{product.price.toLocaleString()}</span>{' '}
                              {product.old_price ? (
                                <span className="line-through text-black/30 text-sm">₸{product.old_price.toLocaleString()}</span>
                              ) : null}
                            </p>
                          </div>
                        </motion.div>
                      </Link>
                    ) : (
                      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: index * 0.05 }}>
                        <div className="aspect-[4/5] rounded-3xl overflow-hidden bg-white border border-black/8 relative" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                          <div className="absolute inset-0 flex items-center justify-center p-10">
                            {imageUrl ? (
                              <img src={imageUrl} alt={product.name} className="w-full h-full object-contain" />
                            ) : (
                              <div className="flex flex-col items-center justify-center gap-3 opacity-20">
                                <span className="text-5xl font-black">{product.brand.slice(0, 1)}</span>
                              </div>
                            )}
                          </div>
                          <div className="absolute inset-0 bg-white/70 rounded-3xl" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="bg-black/80 text-white text-xs px-4 py-1.5 rounded-full">Нет в наличии</span>
                          </div>
                        </div>
                        <div className="mt-4 px-1">
                          <p className="text-xs uppercase tracking-widest mb-1 text-black/40">{product.brand}</p>
                          <h3 className="font-light text-base leading-snug mb-1 text-black/40">{product.name}</h3>
                          <p className="font-light text-black/40">₸{product.price.toLocaleString()}</p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
