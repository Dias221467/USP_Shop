'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import api from '@/lib/api';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.next !== form.confirm) {
      setError('Пароли не совпадают');
      return;
    }
    if (form.next.length < 6) {
      setError('Новый пароль должен быть не менее 6 символов');
      return;
    }

    setLoading(true);
    try {
      await api.patch('/api/change-password', {
        current_password: form.current,
        new_password: form.next,
      });
      setDone(true);
      setTimeout(() => router.push('/account'), 2500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка при смене пароля');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="pt-32 pb-20 px-8 md:px-12 flex justify-center">
        <div className="w-full max-w-md">
          <Link
            href="/account"
            className="inline-flex items-center gap-2 text-sm opacity-40 hover:opacity-80 transition-opacity mb-10"
          >
            <ArrowLeft className="w-4 h-4" />
            Вернуться в аккаунт
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl font-light mb-2">Сменить пароль</h1>
            <p className="text-sm opacity-40 mb-10">Введите текущий и новый пароль</p>

            {done ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center py-12"
              >
                <CheckCircle className="w-14 h-14 mb-5 opacity-80" />
                <p className="text-xl font-light mb-2">Пароль изменён</p>
                <p className="text-sm opacity-40">Перенаправляем в аккаунт...</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* Текущий пароль */}
                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-[0.15em] text-black/40 mb-2">
                    Текущий пароль
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      required
                      value={form.current}
                      onChange={(e) => setForm({ ...form, current: e.target.value })}
                      placeholder="Введите текущий пароль"
                      className="w-full bg-black/[0.03] rounded-xl px-4 py-3.5 text-sm text-black placeholder:text-black/25 outline-none border border-transparent focus:border-black/20 focus:bg-white transition-all pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-black/30 hover:text-black/60 transition-colors"
                    >
                      {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Новый пароль */}
                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-[0.15em] text-black/40 mb-2">
                    Новый пароль
                  </label>
                  <div className="relative">
                    <input
                      type={showNext ? 'text' : 'password'}
                      required
                      value={form.next}
                      onChange={(e) => setForm({ ...form, next: e.target.value })}
                      placeholder="Минимум 6 символов"
                      className="w-full bg-black/[0.03] rounded-xl px-4 py-3.5 text-sm text-black placeholder:text-black/25 outline-none border border-transparent focus:border-black/20 focus:bg-white transition-all pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNext(!showNext)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-black/30 hover:text-black/60 transition-colors"
                    >
                      {showNext ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Подтверждение */}
                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-[0.15em] text-black/40 mb-2">
                    Подтвердите новый пароль
                  </label>
                  <input
                    type="password"
                    required
                    value={form.confirm}
                    onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                    placeholder="Повторите пароль"
                    className="w-full bg-black/[0.03] rounded-xl px-4 py-3.5 text-sm text-black placeholder:text-black/25 outline-none border border-transparent focus:border-black/20 focus:bg-white transition-all"
                  />
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-400 text-xs px-1"
                  >
                    {error}
                  </motion.p>
                )}

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileTap={{ scale: 0.98 }}
                  className="mt-2 w-full py-4 bg-black text-white rounded-xl text-xs uppercase tracking-widest hover:bg-black/80 transition-colors disabled:opacity-40"
                >
                  {loading ? 'Сохраняем...' : 'Сохранить пароль'}
                </motion.button>
              </form>
            )}
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
