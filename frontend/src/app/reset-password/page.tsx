'use client';
import { useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Пароли не совпадают');
      return;
    }
    if (password.length < 6) {
      setError('Минимум 6 символов');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/auth/reset-password', { token, password });
      setDone(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ссылка недействительна или истекла');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-8">
        <div className="text-center">
          <Link href="/" className="block text-3xl font-light tracking-[0.3em] mb-10">USP</Link>
          <p className="">Недействительная ссылка</p>
          <Link href="/forgot-password" className="block mt-6 text-sm underline underline-offset-4  hover:opacity-80">
            Запросить новую
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm"
      >
        <Link href="/" className="block text-3xl font-light tracking-[0.3em] mb-10">USP</Link>

        {!done ? (
          <>
            <h1 className="text-2xl font-light mb-2">Новый пароль</h1>
            <p className="text-sm  mb-8">Придумайте новый пароль для аккаунта.</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="relative">
                <label className="block text-[11px] font-medium uppercase tracking-[0.15em] text-black mb-2">Новый пароль</label>
                <input
                  type={showPwd ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Минимум 6 символов"
                  className="w-full bg-black/[0.03] rounded-xl px-4 py-3.5 text-sm outline-none border border-transparent focus:border-black/20 focus:bg-white transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 bottom-3.5 text-black hover:text-black transition-colors"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-medium uppercase tracking-[0.15em] text-black mb-2">Повторите пароль</label>
                <input
                  type={showPwd ? 'text' : 'password'}
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Повторите пароль"
                  className="w-full bg-black/[0.03] rounded-xl px-4 py-3.5 text-sm outline-none border border-transparent focus:border-black/20 focus:bg-white transition-all"
                />
              </div>

              {error && <p className="text-red-400 text-xs">{error}</p>}

              <motion.button
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.98 }}
                className="mt-2 w-full py-4 bg-black text-white rounded-xl text-xs uppercase tracking-widest hover:bg-black/80 transition-colors disabled:opacity-70"
              >
                {loading ? 'Сохраняем...' : 'Сохранить пароль'}
              </motion.button>
            </form>
          </>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
              <CheckCircle className="w-16 h-16 mx-auto mb-6 text-green-500" />
            </motion.div>
            <h1 className="text-2xl font-light mb-3">Пароль изменён</h1>
            <p className="text-sm ">Перенаправляем на страницу входа...</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
