'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import api from '@/lib/api';
import { getFavorites, toggleFavorite } from '@/lib/favorites';
import { Product } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function FavoritesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [favs, setFavs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = getFavorites();
    setFavs(ids);
    if (ids.length === 0) {
      setLoading(false);
      return;
    }
    api.get('/api/products')
      .then((res) => setProducts((res.data || []).filter((p: Product) => ids.includes(p.id))))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const remove = (id: string) => {
    toggleFavorite(id);
    setFavs((prev) => prev.filter((f) => f !== id));
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

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
            <h1 className="text-5xl md:text-7xl lg:text-8xl tracking-tight mb-4">Избранное</h1>
            {!loading && products.length > 0 && (
              <p className="text-black/30 text-sm">
                {products.length} {products.length === 1 ? 'товар' : products.length < 5 ? 'товара' : 'товаров'}
              </p>
            )}
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[4/5] rounded-3xl bg-black/4 border border-black/5 animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-40">
              <p className="text-4xl font-light opacity-20 mb-6">Пока пусто</p>
              <p className="text-sm text-black/40 mb-8">Нажимайте на сердечко на карточке товара, чтобы сохранить его сюда</p>
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
                const discounted = !!product.old_price && product.old_price > product.price;

                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.05 }}
                  >
                    <div className="relative">
                      <Link href={`/product/${product.id}`}>
                        <div className="aspect-[4/5] rounded-3xl overflow-hidden bg-white border border-black/8 relative hover:shadow-lg transition-shadow" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                          {discounted && (
                            <span className="absolute top-4 left-4 z-10 bg-red-500 text-white text-xs px-3 py-1 rounded-full">
                              -{Math.round((1 - product.price / product.old_price!) * 100)}%
                            </span>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center p-10">
                            {imageUrl ? (
                              <img src={imageUrl} alt={product.name} className="w-full h-full object-contain" />
                            ) : (
                              <div className="flex flex-col items-center justify-center gap-3 opacity-20">
                                <span className="text-5xl font-black">{product.brand.slice(0, 1)}</span>
                              </div>
                            )}
                          </div>
                          {product.stock === 0 && (
                            <>
                              <div className="absolute inset-0 bg-white/70 rounded-3xl" />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="bg-black/80 text-white text-xs px-4 py-1.5 rounded-full">Нет в наличии</span>
                              </div>
                            </>
                          )}
                        </div>
                      </Link>
                      <button
                        onClick={() => remove(product.id)}
                        className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/80 backdrop-blur flex items-center justify-center hover:scale-110 transition-transform"
                        title="Убрать из избранного"
                      >
                        <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                      </button>
                    </div>

                    <div className="mt-4 px-1">
                      <p className="text-xs uppercase tracking-widest mb-1">{product.brand}</p>
                      <h3 className="font-light text-base leading-snug mb-1">{product.name}</h3>
                      {discounted ? (
                        <p className="font-light">
                          <span className="text-red-500">₸{product.price.toLocaleString()}</span>{' '}
                          <span className="line-through text-black/30 text-sm">₸{product.old_price!.toLocaleString()}</span>
                        </p>
                      ) : (
                        <p className="font-light">₸{product.price.toLocaleString()}</p>
                      )}
                    </div>
                  </motion.div>
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
