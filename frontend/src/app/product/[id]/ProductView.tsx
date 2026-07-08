'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ShoppingBag, Check, Heart } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import api from '@/lib/api';
import { isFavorite, toggleFavorite } from '@/lib/favorites';
import { addToCart as addItemToCart } from '@/lib/cart';
import { Product } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export function ProductView({ id }: { id: string }) {
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [activeImage, setActiveImage] = useState(0);
  const [added, setAdded] = useState(false);
  const [fav, setFav] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setFav(isFavorite(id));
  }, [id]);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    api.get(`/api/products/${id}`)
      .then((res) => {
        const p: Product = res.data;
        setProduct(p);
        if (p.colors?.length) setSelectedColor(p.colors[0]);
      })
      .catch(() => router.push('/catalog'))
      .finally(() => setLoading(false));
  }, [id]);

  const addToCart = () => {
    if (!product || !selectedSize) return;
    const colorKey = selectedColor.toLowerCase();
    const sizeMax = product.color_stock?.[colorKey]?.[selectedSize]
      ?? product.size_stock?.[selectedSize];

    const ok = addItemToCart({
      product_id: product.id,
      name: product.name,
      price: product.price,
      old_price: product.old_price && product.old_price > product.price ? product.old_price : undefined,
      size: selectedSize,
      color: selectedColor,
      image: images[activeImage] || images[0] || '',
      max_qty: sizeMax ?? undefined,
    });

    if (!ok) {
      showToast(`Этого размера осталось только ${sizeMax} шт.`);
      return;
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="pt-24 pb-20">
          <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
            <div className="h-5 w-36 bg-black/5 rounded-full mb-10 animate-pulse" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-24">
              {/* Скелетон фото */}
              <div className="aspect-square rounded-3xl bg-black/5 animate-pulse" />
              {/* Скелетон инфо */}
              <div className="lg:pt-8 animate-pulse">
                <div className="h-4 w-24 bg-black/5 rounded-full mb-4" />
                <div className="h-10 w-3/4 bg-black/5 rounded-xl mb-3" />
                <div className="h-10 w-1/2 bg-black/5 rounded-xl mb-8" />
                <div className="h-8 w-32 bg-black/5 rounded-full mb-10" />
                <div className="h-4 w-20 bg-black/5 rounded-full mb-3" />
                <div className="flex gap-2 mb-10">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="w-14 h-14 bg-black/5 rounded-xl" />
                  ))}
                </div>
                <div className="h-16 w-full bg-black/5 rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const images = product.images?.length
    ? product.images.map((img) =>
        img.startsWith('http') ? img : `${API_URL}${img}`
      )
    : [null];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
          <Link href="/catalog" className="inline-flex items-center gap-2 text-sm  hover:opacity-80 transition-opacity mb-10">
            <ChevronLeft className="w-4 h-4" />
            Назад в каталог
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-24">
            {/* Изображения */}
            <div className="flex gap-4">
              {images.length > 1 && (
                <div className="flex flex-col gap-3">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={`w-16 h-16 rounded-xl overflow-hidden bg-[#f5f5f5] flex-shrink-0 transition-all ${
                        i === activeImage ? 'ring-2 ring-black' : 'opacity-50 hover:opacity-80'
                      }`}
                    >
                      {img && <img src={img} alt="" className="w-full h-full object-contain p-1" />}
                    </button>
                  ))}
                </div>
              )}

              <motion.div
                className="flex-1 aspect-square rounded-3xl bg-[#f5f5f5] overflow-hidden flex items-center justify-center p-12"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeImage}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.4 }}
                    className="w-full h-full flex items-center justify-center"
                  >
                    {images[activeImage] ? (
                      <img src={images[activeImage]!} alt={product.name} className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-6xl font-black opacity-10">USP</span>
                    )}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Инфо */}
            <div className="lg:pt-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <p className="text-sm uppercase tracking-widest mb-3 text-black/40">{product.brand}</p>
                <h1 className="text-4xl md:text-5xl font-light leading-tight mb-4">{product.name}</h1>
                <div className="flex items-center gap-4 mb-8 flex-wrap">
                  {product.old_price && product.old_price > product.price ? (
                    <div className="flex items-center gap-3">
                      <p className="text-3xl text-red-500">₸{product.price.toLocaleString()}</p>
                      <p className="text-xl line-through text-black/30">₸{product.old_price.toLocaleString()}</p>
                      <span className="text-xs px-3 py-1 rounded-full bg-red-500 text-white">
                        -{Math.round((1 - product.price / product.old_price) * 100)}%
                      </span>
                    </div>
                  ) : (
                    <p className="text-3xl">₸{product.price.toLocaleString()}</p>
                  )}
                  {product.stock > 0 && product.stock <= 4 && (
                    <span className="text-xs px-3 py-1 rounded-full bg-orange-50 text-orange-500">
                      Осталось {product.stock} шт.
                    </span>
                  )}
                  {product.stock === 0 && (
                    <span className="text-xs px-3 py-1 rounded-full bg-red-50 text-red-400">
                      Нет в наличии
                    </span>
                  )}
                  {product.stock > 4 && (
                    <span className="text-xs px-3 py-1 rounded-full bg-green-50 text-green-600">
                      В наличии
                    </span>
                  )}
                </div>

                {product.description && (
                  <p className="text-sm  leading-relaxed mb-10">{product.description}</p>
                )}

                {/* Цвет */}
                {product.colors?.length > 0 && (
                  <div className="mb-8">
                    <p className="text-xs  uppercase tracking-widest mb-3">Цвет — {selectedColor}</p>
                    <div className="flex gap-2">
                      {product.colors.map((color, i) => (
                        <button
                          key={color}
                          onClick={() => { setSelectedColor(color); if (i < images.length) setActiveImage(i); setSelectedSize(''); }}
                          className={`px-4 py-2 rounded-full text-sm border transition-all ${
                            selectedColor === color
                              ? 'border-black bg-black text-white'
                              : 'border-black/20 hover:border-black/50'
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Размер */}
                {product.sizes?.length > 0 && (() => {
                  const colorKey = selectedColor.toLowerCase();
                  const colorSizes = product.color_stock?.[colorKey];
                  const allSizes = colorSizes
                    ? Object.keys(colorSizes)
                    : product.sizes;
                  const isSoldOut = (size: string) => colorSizes ? (colorSizes[size] ?? 0) === 0 : false;
                  return (
                  <div className="mb-10">
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-xs uppercase tracking-widest">Размер</p>
                      {!selectedSize && (
                        <p className="text-xs text-red-400">Выберите размер</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {allSizes.map((size) => {
                        const soldOut = isSoldOut(size);
                        return (
                        <button
                          key={size}
                          onClick={() => !soldOut && setSelectedSize(size)}
                          disabled={soldOut}
                          className={`w-14 h-14 rounded-xl text-sm transition-all relative ${
                            soldOut
                              ? 'bg-black/5 text-black/25 cursor-not-allowed'
                              : selectedSize === size
                              ? 'bg-black text-white'
                              : 'bg-black/5 hover:bg-black/10'
                          }`}
                        >
                          {size}
                          {soldOut && (
                            <span className="absolute inset-0 flex items-center justify-center">
                              <span className="w-8 border-t border-black/20 rotate-45 absolute" />
                            </span>
                          )}
                        </button>
                        );
                      })}
                    </div>
                  </div>
                  );
                })()}

                {/* Кнопки */}
                <div className="flex gap-3">
                <motion.button
                  onClick={addToCart}
                  disabled={!selectedSize || product.stock === 0}
                  whileTap={{ scale: 0.98 }}
                  className={`flex-1 py-5 rounded-2xl text-base tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-3 ${
                    product.stock === 0
                      ? 'bg-black/10 text-black cursor-not-allowed'
                      : !selectedSize
                      ? 'bg-black/10 text-black cursor-not-allowed'
                      : added
                      ? 'bg-green-500 text-white'
                      : 'bg-black text-white hover:bg-black/80'
                  }`}
                >
                  {product.stock === 0 ? (
                    'Нет в наличии'
                  ) : added ? (
                    <><Check className="w-5 h-5" /> Добавлено</>
                  ) : (
                    <><ShoppingBag className="w-5 h-5" /> В корзину</>
                  )}
                </motion.button>
                <motion.button
                  onClick={() => setFav(toggleFavorite(product.id))}
                  whileTap={{ scale: 0.9 }}
                  className={`w-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                    fav ? 'bg-red-50' : 'bg-black/5 hover:bg-black/10'
                  }`}
                  title={fav ? 'Убрать из избранного' : 'В избранное'}
                >
                  <Heart className={`w-5 h-5 ${fav ? 'fill-red-500 text-red-500' : ''}`} />
                </motion.button>
                </div>

                {added && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 text-center"
                  >
                    <Link href="/cart" className="text-sm hover:opacity-100 underline underline-offset-2">
                      Перейти в корзину →
                    </Link>
                  </motion.div>
                )}

                {/* Delivery info */}
                <div className="mt-8 pt-8 border-t border-black/5 space-y-3">
                  <div className="flex items-center gap-3 text-sm text-black/50">
                    <span className="text-lg">🏪</span>
                    <span>Самовывоз из магазина в Семее</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-black/50">
                    <span className="text-lg">📦</span>
                    <span>Доставка по Казахстану от 1 000 ₸</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-black/50">
                    <span className="text-lg">💳</span>
                    <span>Оплата Kaspi Pay или наличными</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* Тост-уведомление */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-8 inset-x-0 z-50 flex justify-center pointer-events-none px-4"
          >
            <div className="bg-black text-white text-sm px-6 py-3.5 rounded-full shadow-xl">
              {toast}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
