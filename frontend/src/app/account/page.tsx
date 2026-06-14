'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, LogOut, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import api from '@/lib/api';
import { User, Order } from '@/types';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Ожидает оплаты',
  paid: 'Оплачен',
  shipped: 'Отправлен',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-600',
  paid: 'bg-blue-50 text-blue-600',
  shipped: 'bg-purple-50 text-purple-600',
  delivered: 'bg-green-50 text-green-600',
  cancelled: 'bg-red-50 text-red-500',
};

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    Promise.all([
      api.get('/api/auth/me'),
      api.get('/api/orders'),
    ])
      .then(([userRes, ordersRes]) => {
        setUser(userRes.data);
        setOrders(ordersRes.data || []);
      })
      .catch(() => {
        localStorage.removeItem('token');
        router.push('/login');
      })
      .finally(() => setLoading(false));
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-black/20 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="pt-32 pb-20 px-8 md:px-12">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mb-16 flex items-start justify-between"
          >
            <div>
              <h1 className="text-6xl md:text-7xl font-light tracking-tight mb-3">{user.name}</h1>
              <p className="opacity-40">{user.email}</p>
              {user.phone && <p className="opacity-40 text-sm mt-1">{user.phone}</p>}
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-2 text-sm opacity-30 hover:opacity-70 transition-opacity mt-4"
            >
              <LogOut className="w-4 h-4" />
              Выйти
            </button>
          </motion.div>

          {/* Заказы */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-light">Мои заказы</h2>
              {orders.length > 0 && (
                <span className="text-sm opacity-40">{orders.length} заказ{orders.length === 1 ? '' : orders.length < 5 ? 'а' : 'ов'}</span>
              )}
            </div>

            {orders.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-24 border border-black/5 rounded-3xl"
              >
                <Package className="w-12 h-12 mx-auto mb-4 opacity-10" />
                <p className="text-xl font-light opacity-30 mb-6">Заказов пока нет</p>
                <Link
                  href="/catalog"
                  className="inline-flex items-center gap-2 text-sm uppercase tracking-widest bg-black text-white px-6 py-3 rounded-full hover:bg-black/80 transition-colors"
                >
                  Перейти в каталог
                </Link>
              </motion.div>
            ) : (
              <div className="flex flex-col gap-4">
                {orders.map((order, i) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.08 }}
                    className="border border-black/8 rounded-2xl p-6 hover:border-black/20 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-xs opacity-40 mb-1">
                          {new Date(order.created_at).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                        <p className="text-sm opacity-60 font-mono">#{order.id.slice(-8).toUpperCase()}</p>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full ${STATUS_COLORS[order.status] || 'bg-black/5 text-black/50'}`}>
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 mb-4">
                      {order.items.map((item, j) => (
                        <div key={j} className="flex justify-between text-sm">
                          <span className="opacity-70">
                            {item.name}
                            {item.size && <span className="opacity-50"> · {item.size}</span>}
                            {item.quantity > 1 && <span className="opacity-50"> × {item.quantity}</span>}
                          </span>
                          <span className="opacity-60">₸{item.subtotal.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-black/5 pt-4 flex justify-between items-center">
                      <span className="text-sm opacity-40">Итого</span>
                      <span className="text-base">₸{order.total.toLocaleString()}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
