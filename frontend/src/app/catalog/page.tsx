'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import api from '@/lib/api';
import { Product } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const MOCK_PRODUCTS: Product[] = [
  { id: 'm1', name: 'Nike SB Dunk Low', brand: 'Nike', price: 89000, category: 'shoes', images: ['/sneakers/nike-sb-dunk-black.jpg'], sizes: ['40','41','42','43','44'], colors: ['Black/White'], stock: 5, description: '', is_active: true },
  { id: 'm2', name: 'Adidas Samba OG', brand: 'Adidas', price: 79000, category: 'shoes', images: ['/sneakers/adidas-samba-white.jpg'], sizes: ['39','40','41','42','43'], colors: ['White/Black'], stock: 8, description: '', is_active: true },
  { id: 'm3', name: 'Air Jordan 1 Low', brand: 'Jordan', price: 95000, category: 'shoes', images: ['/sneakers/air-jordan-1-low-sage.jpg'], sizes: ['40','41','42','43','44','45'], colors: ['Sage/White'], stock: 3, description: '', is_active: true },
  { id: 'm4', name: 'Nike P-6000', brand: 'Nike', price: 72000, category: 'shoes', images: ['/sneakers/nike-p6000-black.jpg'], sizes: ['41','42','43','44'], colors: ['Black/Gold'], stock: 6, description: '', is_active: true },
  { id: 'm5', name: 'Adidas Samba OG', brand: 'Adidas', price: 79000, category: 'shoes', images: ['/sneakers/adidas-samba-black.jpg'], sizes: ['39','40','41','42','43'], colors: ['Black/White'], stock: 4, description: '', is_active: true },
  { id: 'm6', name: 'New Balance 1906D', brand: 'New Balance', price: 85000, category: 'shoes', images: ['/sneakers/new-balance-1906d.jpg'], sizes: ['40','41','42','43','44'], colors: ['Grey'], stock: 2, description: '', is_active: true },
  { id: 'm7', name: 'Adidas Centennial 85', brand: 'Adidas', price: 68000, category: 'shoes', images: ['/sneakers/adidas-centennial-cream.jpg'], sizes: ['40','41','42','43'], colors: ['Cream/Black'], stock: 7, description: '', is_active: true },
  { id: 'm8', name: 'ASICS GEL-NYC', brand: 'ASICS', price: 82000, category: 'shoes', images: ['/sneakers/asics-gel-nyc.jpg'], sizes: ['40','41','42','43','44'], colors: ['Grey/White'], stock: 0, description: '', is_active: true },
];

const FILTERS = [
  { label: 'Все', value: '' },
  { label: 'Обувь', value: 'shoes' },
  { label: 'Одежда', value: 'clothing' },
];

export default function CatalogPage() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState(initialCategory);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const url = category ? `/api/products?category=${category}` : '/api/products';
    api.get(url)
      .then((res) => {
        const data = res.data || [];
        setProducts(data.length > 0 ? data : MOCK_PRODUCTS);
      })
      .catch(() => setProducts(MOCK_PRODUCTS))
      .finally(() => setLoading(false));
  }, [category]);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="pt-32 pb-20 px-8 md:px-12">
        <div className="max-w-[1600px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-16"
          >
            <h1 className="text-7xl md:text-8xl tracking-tight mb-10">Каталог</h1>

            <div className="flex gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setCategory(f.value)}
                  className={`px-6 py-2 rounded-full text-sm transition-all duration-300 ${
                    category === f.value
                      ? 'bg-black text-white'
                      : 'bg-black/5 text-black hover:bg-black/10'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[4/5] rounded-3xl bg-black/5 animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-40">
              <p className="text-4xl font-light opacity-20">Товары не найдены</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product, index) => {
                const imageUrl = product.images?.[0]
                  ? product.images[0].startsWith('http')
                    ? product.images[0]
                    : `${API_URL}${product.images[0]}`
                  : null;

                return (
                  <Link href={`/product/${product.id}`} key={product.id}>
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.05, ease: [0.65, 0, 0.35, 1] }}
                      onHoverStart={() => setHoveredId(product.id)}
                      onHoverEnd={() => setHoveredId(null)}
                      className="group cursor-pointer"
                    >
                      <motion.div
                        className="aspect-[4/5] rounded-3xl overflow-hidden bg-[#f5f5f5] relative"
                        animate={{ scale: hoveredId === product.id ? 0.98 : 1 }}
                        transition={{ duration: 0.4 }}
                      >
                        <motion.div
                          className="absolute inset-0 flex items-center justify-center p-10"
                          animate={{ scale: hoveredId === product.id ? 1.08 : 1 }}
                          transition={{ duration: 0.5, ease: [0.65, 0, 0.35, 1] }}
                        >
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={product.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                const target = e.currentTarget;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = `<div class="flex flex-col items-center justify-center gap-3 opacity-20"><span class="text-5xl font-black">${product.brand.slice(0,1)}</span><span class="text-xs tracking-widest uppercase">${product.brand}</span></div>`;
                                }
                              }}
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center gap-3 opacity-20">
                              <span className="text-5xl font-black">{product.brand.slice(0,1)}</span>
                              <span className="text-xs tracking-widest uppercase">{product.brand}</span>
                            </div>
                          )}
                        </motion.div>

                        {product.stock === 0 && (
                          <div className="absolute top-4 left-4 bg-black/70 text-white text-xs px-3 py-1 rounded-full">
                            Нет в наличии
                          </div>
                        )}
                      </motion.div>

                      <div className="mt-4 px-1">
                        <p className="text-xs opacity-40 uppercase tracking-widest mb-1">{product.brand}</p>
                        <h3 className="font-light text-base leading-snug mb-1">{product.name}</h3>
                        <p className="font-light">₸{product.price.toLocaleString()}</p>
                      </div>
                    </motion.div>
                  </Link>
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
