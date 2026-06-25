'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

interface CartItem {
  product_id: string;
  name: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
  max_qty?: number;
  image: string;
  subtotal: number;
}

interface CartState {
  items: CartItem[];
  total: number;
}

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartState>({ items: [], total: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const raw = localStorage.getItem('cart');
    if (raw) setCart(JSON.parse(raw));
  }, []);

  const updateQty = (index: number, delta: number) => {
    const updated = { ...cart };
    const item = updated.items[index];
    const max = item.max_qty ?? Infinity;
    updated.items[index].quantity = Math.min(max, Math.max(1, item.quantity + delta));
    updated.items[index].subtotal = updated.items[index].quantity * updated.items[index].price;
    updated.total = updated.items.reduce((s, i) => s + i.subtotal, 0);
    setCart(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
    window.dispatchEvent(new Event('cartUpdate'));
  };

  const remove = (index: number) => {
    const updated = { ...cart };
    updated.items.splice(index, 1);
    updated.total = updated.items.reduce((s, i) => s + i.subtotal, 0);
    setCart(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
    window.dispatchEvent(new Event('cartUpdate'));
  };

  const checkout = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login?redirect=/checkout');
      return;
    }
    router.push('/checkout');
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="pt-28 pb-20 px-4 md:px-8 lg:px-12">
        <div className="max-w-4xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-5xl md:text-6xl lg:text-7xl font-light tracking-tight mb-10 md:mb-16"
          >
            Корзина
          </motion.h1>

          {cart.items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-32"
            >
              <ShoppingBag className="w-16 h-16 mx-auto mb-6 opacity-10" />
              <p className="text-2xl font-light  mb-8">Корзина пуста</p>
              <Link
                href="/catalog"
                className="inline-flex items-center gap-2 text-sm uppercase tracking-widest bg-black text-white px-8 py-4 rounded-full hover:bg-black/80 transition-colors"
              >
                В каталог <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 flex flex-col gap-4">
                <AnimatePresence>
                  {cart.items.map((item, i) => (
                    <motion.div
                      key={`${item.product_id}-${item.size}-${item.color}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex gap-5 p-4 rounded-2xl bg-black/[0.02] hover:bg-black/[0.04] transition-colors"
                    >
                      <div className="w-28 h-28 rounded-xl bg-[#f0f0f0] flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-contain p-2" />
                        ) : (
                          <span className="text-xl font-black opacity-10">USP</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-light text-base leading-snug mb-1 truncate">{item.name}</h3>
                        <p className="text-sm  mb-3">
                          {item.size && `Размер: ${item.size}`}
                          {item.size && item.color && ' · '}
                          {item.color}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => updateQty(i, -1)}
                              className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 transition-colors flex items-center justify-center text-lg"
                            >
                              −
                            </button>
                            <span className="w-6 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQty(i, 1)}
                              className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 transition-colors flex items-center justify-center text-lg"
                            >
                              +
                            </button>
                          </div>
                          <p className="font-light">₸{item.subtotal.toLocaleString()}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => remove(i)}
                        className="self-start p-2 opacity-20 hover:opacity-60 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="lg:col-span-1">
                <div className="sticky top-28 bg-black/[0.02] rounded-3xl p-8">
                  <h2 className="text-xl font-light mb-6">Итого</h2>

                  <div className="flex justify-between items-center mb-2 text-sm ">
                    <span>Товары ({cart.items.reduce((s, i) => s + i.quantity, 0)} шт.)</span>
                    <span>₸{cart.total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center mb-6 text-sm ">
                    <span>Доставка</span>
                    <span>По договорённости</span>
                  </div>

                  <div className="border-t border-black/10 pt-6 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-lg">Сумма</span>
                      <span className="text-xl">₸{cart.total.toLocaleString()}</span>
                    </div>
                  </div>

                  <motion.button
                    onClick={checkout}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 bg-black text-white rounded-2xl text-sm uppercase tracking-widest hover:bg-black/80 transition-colors flex items-center justify-center gap-2"
                  >
                    Оформить <ArrowRight className="w-4 h-4" />
                  </motion.button>

                  <Link
                    href="/catalog"
                    className="block text-center text-sm  hover:opacity-70 transition-opacity mt-4"
                  >
                    Продолжить покупки
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
