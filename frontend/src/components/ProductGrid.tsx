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
    api.get('/api/products?limit=6').then((res) => {
      const data = res.data?.items || [];
      setProducts(data.length > 0 ? data : MOCK);
    }).catch(() => setProducts(MOCK));
  }, []);

  return (
    <section className="py-20 md:py-32 px-6 md:px-8 bg-white">
      <div className="max-w-[1600px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-12 md:mb-20 flex justify-between items-end"
        >
          <h2 className="text-5xl md:text-7xl lg:text-8xl tracking-tight font-light">Коллекция</h2>
          <Link href="/catalog" className="text-sm  hover:opacity-100 transition-opacity pb-4">
            Смотреть всё →
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product, index) => {
            const toUrl = (img: string) => (img.startsWith('http') ? img : `${API_URL}${img}`);
            const imageUrl = product.images?.[0]
              ? toUrl(product.images[0])
              : 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80';
            const hoverImageUrl = product.images?.[1] ? toUrl(product.images[1]) : null;

            return (
              <div key={product.id}>
                {product.stock > 0 ? (
                  <Link href={`/product/${product.id}`}>
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
                        className="aspect-[4/5] rounded-3xl overflow-hidden relative bg-white border border-black/8"
                        animate={{ scale: hoveredId === product.id ? 0.98 : 1, boxShadow: hoveredId === product.id ? '0 8px 40px rgba(0,0,0,0.10)' : '0 2px 12px rgba(0,0,0,0.06)' }}
                        transition={{ duration: 0.6, ease: [0.65, 0, 0.35, 1] }}
                      >
                        <motion.div
                          className="absolute inset-0 flex items-center justify-center p-12"
                          animate={{ scale: hoveredId === product.id ? 1.1 : 1, rotate: hoveredId === product.id ? -5 : 0 }}
                          transition={{ duration: 0.6, ease: [0.65, 0, 0.35, 1] }}
                        >
                          <div className="relative w-full h-full">
                            <img src={imageUrl} alt={product.name}
                              className={`w-full h-full object-contain drop-shadow-xl transition-opacity duration-300 ${hoverImageUrl && hoveredId === product.id ? 'opacity-0' : 'opacity-100'}`}
                              onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                            {hoverImageUrl && (
                              <img src={hoverImageUrl} alt={product.name}
                                className={`absolute inset-0 w-full h-full object-contain drop-shadow-xl transition-opacity duration-300 ${hoveredId === product.id ? 'opacity-100' : 'opacity-0'}`}
                              />
                            )}
                          </div>
                        </motion.div>
                        <motion.div
                          className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/60 to-transparent"
                          animate={{ opacity: hoveredId === product.id ? 1 : 0, y: hoveredId === product.id ? 0 : 20 }}
                          transition={{ duration: 0.4 }}
                        >
                          <h3 className="text-white text-2xl mb-2">{product.name}</h3>
                          <p className="text-white/90 text-xl">₸{product.price.toLocaleString()}</p>
                        </motion.div>
                      </motion.div>
                      <motion.div className="mt-6 px-2" animate={{ opacity: hoveredId === product.id ? 0 : 1, y: hoveredId === product.id ? -10 : 0 }} transition={{ duration: 0.4 }}>
                        <p className="text-xs uppercase tracking-widest text-black/40 mb-1">{product.brand}</p>
                        <h3 className="text-lg font-light mb-1">{product.name}</h3>
                        {product.old_price && product.old_price > product.price ? (
                          <p className="text-base">
                            <span className="text-red-500">₸{product.price.toLocaleString()}</span>{' '}
                            <span className="line-through text-black/30 text-sm">₸{product.old_price.toLocaleString()}</span>
                          </p>
                        ) : (
                          <p className="text-base">₸{product.price.toLocaleString()}</p>
                        )}
                      </motion.div>
                    </motion.div>
                  </Link>
                ) : (
                  <Link href={`/product/${product.id}`}>
                  <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.8, delay: index * 0.15 }} className="cursor-pointer">
                    <div className="aspect-[4/5] rounded-3xl overflow-hidden relative bg-white border border-black/8" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                      <div className="absolute inset-0 flex items-center justify-center p-12">
                        <img src={imageUrl} alt={product.name} className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      </div>
                      <div className="absolute inset-0 bg-white/70 rounded-3xl" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="bg-black/80 text-white text-xs px-4 py-1.5 rounded-full">Нет в наличии</span>
                      </div>
                    </div>
                    <div className="mt-6 px-2">
                      <p className="text-xs uppercase tracking-widest text-black/30 mb-1">{product.brand}</p>
                      <h3 className="text-lg font-light mb-1 text-black/40">{product.name}</h3>
                      <p className="text-base text-black/30">₸{product.price.toLocaleString()}</p>
                    </div>
                  </motion.div>
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
