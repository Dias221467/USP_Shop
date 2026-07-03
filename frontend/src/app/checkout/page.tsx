'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import api from '@/lib/api';

interface CartItem {
  product_id: string;
  name: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
  subtotal: number;
  image?: string;
}

const PAYMENT_OPTIONS = [
  { value: 'kaspi', label: 'Kaspi Pay', desc: 'Оплата через Kaspi QR' },
  { value: 'cash', label: 'Наличные', desc: 'Оплата при получении' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [user, setUser] = useState<{ name: string; phone: string } | null>(null);
  const [form, setForm] = useState({
    city: 'Семей',
    street: '',
    house: '',
    flat: '',
    comment: '',
  });
  const [payment, setPayment] = useState('kaspi');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [orderId, setOrderId] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login?redirect=/checkout');
      return;
    }

    const saved = localStorage.getItem('cart');
    const parsed = saved ? JSON.parse(saved) : { items: [] };
    const cartItems: CartItem[] = parsed.items || [];
    if (cartItems.length === 0) {
      router.push('/cart');
      return;
    }
    setItems(cartItems);

    api.get('/api/me').then((res) => setUser(res.data)).catch(() => {});
  }, []);

  const total = items.reduce((sum, item) => sum + item.subtotal, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.street || !form.house) {
      setError('Укажите улицу и номер дома');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/api/orders', {
        shipping_address: {
          city: form.city,
          street: form.street,
          house: form.house,
          flat: form.flat,
          comment: form.comment,
        },
        payment_method: payment,
        items: items.map((item) => ({
          product_id: item.product_id,
          name: item.name,
          price: item.price,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
        })),
      });

      localStorage.removeItem('cart');
      window.dispatchEvent(new CustomEvent('cartUpdate'));
      setOrderId(res.data.id);
      setDone(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка при оформлении заказа');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="pt-32 pb-20 flex items-center justify-center px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-md w-full"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-10 h-10 text-green-500" />
            </motion.div>
            <h1 className="text-3xl font-light mb-3">Заказ оформлен!</h1>
            {orderId && (
              <p className="text-xs text-black/30 font-mono mb-6">
                Номер заказа: #{orderId.slice(-8).toUpperCase()}
              </p>
            )}

            {/* Состав заказа */}
            <div className="bg-black/[0.03] rounded-2xl p-5 mb-6 text-left">
              {items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm py-1.5">
                  <span className="text-black/60">
                    {item.name}
                    <span className="text-black/30"> · {item.color ? `${item.color}, ` : ''}{item.size} × {item.quantity}</span>
                  </span>
                  <span className="whitespace-nowrap ml-3">₸{item.subtotal.toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between pt-3 mt-2 border-t border-black/10 font-medium">
                <span>Итого</span>
                <span>₸{total.toLocaleString()}</span>
              </div>
            </div>

            {/* Что дальше */}
            <div className="text-left text-sm text-black/50 space-y-2.5 mb-8">
              <p className="flex gap-2"><span>1.</span> Мы позвоним вам в ближайшее время, чтобы подтвердить заказ.</p>
              {payment === 'kaspi' ? (
                <p className="flex gap-2"><span>2.</span> После подтверждения отправим счёт в Kaspi — оплатите его в приложении.</p>
              ) : (
                <p className="flex gap-2"><span>2.</span> Оплата наличными при получении.</p>
              )}
              <p className="flex gap-2"><span>3.</span> Заберите заказ в магазине в Семее или дождитесь доставки по указанному адресу.</p>
            </div>

            <div className="flex flex-col gap-3">
              <Link
                href="/account"
                className="w-full py-3 bg-black text-white rounded-xl text-xs uppercase tracking-widest hover:bg-black/80 transition-colors text-center"
              >
                Мои заказы
              </Link>
              <Link
                href="/catalog"
                className="w-full py-3 border border-black/10 rounded-xl text-xs uppercase tracking-widest hover:border-black/30 transition-colors text-center"
              >
                Продолжить покупки
              </Link>
            </div>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="pt-28 pb-20 px-4 md:px-8 lg:px-12">
        <div className="max-w-5xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl lg:text-6xl font-light mb-10 md:mb-16"
          >
            Оформление
          </motion.h1>

          <div className="grid md:grid-cols-[1fr_380px] gap-12">
            {/* Форма */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              onSubmit={handleSubmit}
              className="flex flex-col gap-10"
            >
              {/* Получатель */}
              {user && (
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-black mb-4">
                    Получатель
                  </p>
                  <div className="flex gap-4 p-4 bg-black/[0.03] rounded-2xl">
                    <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                      {user.name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-sm ">{user.phone}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Адрес */}
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-black mb-4">
                  Адрес доставки
                </p>
                <div className="flex flex-col gap-3">
                  <select
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full bg-black/[0.03] rounded-xl px-4 py-3.5 text-sm outline-none border border-transparent focus:border-black/20 focus:bg-white transition-all appearance-none"
                  >
                    {['Семей', 'Астана', 'Алматы', 'Усть-Каменогорск', 'Павлодар', 'Қарағанды', 'Шымкент', 'Актобе', 'Тараз', 'Атырау'].map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                  <div className="grid grid-cols-[1fr_120px] gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Улица"
                      value={form.street}
                      onChange={(e) => setForm({ ...form, street: e.target.value })}
                      className="bg-black/[0.03] rounded-xl px-4 py-3.5 text-sm outline-none border border-transparent focus:border-black/20 focus:bg-white transition-all"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Дом"
                      value={form.house}
                      onChange={(e) => setForm({ ...form, house: e.target.value })}
                      className="bg-black/[0.03] rounded-xl px-4 py-3.5 text-sm outline-none border border-transparent focus:border-black/20 focus:bg-white transition-all"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Квартира (необязательно)"
                    value={form.flat}
                    onChange={(e) => setForm({ ...form, flat: e.target.value })}
                    className="bg-black/[0.03] rounded-xl px-4 py-3.5 text-sm outline-none border border-transparent focus:border-black/20 focus:bg-white transition-all"
                  />
                  <textarea
                    placeholder="Комментарий к заказу (необязательно)"
                    value={form.comment}
                    onChange={(e) => setForm({ ...form, comment: e.target.value })}
                    rows={3}
                    className="bg-black/[0.03] rounded-xl px-4 py-3.5 text-sm outline-none border border-transparent focus:border-black/20 focus:bg-white transition-all resize-none"
                  />
                </div>
              </div>

              {/* Способ оплаты */}
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-black mb-4">
                  Способ оплаты
                </p>
                <div className="flex flex-col gap-3">
                  {PAYMENT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPayment(opt.value)}
                      className={`flex items-center justify-between px-5 py-4 rounded-2xl border transition-all text-left ${
                        payment === opt.value
                          ? 'border-black bg-black text-white'
                          : 'border-black/10 hover:border-black/30'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium">{opt.label}</p>
                        <p className={`text-xs mt-0.5 ${payment === opt.value ? 'opacity-50' : 'opacity-70'}`}>
                          {opt.desc}
                        </p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                        payment === opt.value ? 'border-white bg-white' : 'border-black/20'
                      }`} />
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-400 text-sm"
                >
                  {error}
                </motion.p>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-black text-white rounded-2xl text-xs uppercase tracking-widest hover:bg-black/80 transition-colors disabled:opacity-70"
              >
                {loading ? 'Оформляем...' : `Оформить заказ · ₸${total.toLocaleString()}`}
              </motion.button>
            </motion.form>

            {/* Сводка */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-black mb-4">
                Ваш заказ
              </p>
              <div className="border border-black/8 rounded-2xl p-6 flex flex-col gap-4">
                {items.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingBag className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    <p className="text-sm ">Корзина пуста</p>
                  </div>
                ) : (
                  <>
                    {items.map((item, i) => (
                      <div key={i} className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          <p className="text-xs  mt-0.5">
                            {[item.size, item.color].filter(Boolean).join(' · ')}
                            {item.quantity > 1 && ` · ${item.quantity} шт`}
                          </p>
                        </div>
                        <p className="text-sm flex-shrink-0">
                          ₸{(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    ))}

                    <div className="border-t border-black/5 pt-4 mt-2 flex justify-between items-center">
                      <span className="text-sm ">Итого</span>
                      <span className="text-lg font-medium">₸{total.toLocaleString()}</span>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
