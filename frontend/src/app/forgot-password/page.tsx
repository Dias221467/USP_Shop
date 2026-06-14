'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/api/auth/forgot-password', { email });
      setSent(true);
    } catch {
      setError('Что-то пошло не так. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm"
      >
        <Link href="/login" className="inline-flex items-center gap-2 text-sm  hover:opacity-80 transition-opacity mb-12">
          <ArrowLeft className="w-4 h-4" />
          Назад
        </Link>

        <Link href="/" className="block text-3xl font-light tracking-[0.3em] mb-10">USP</Link>

        {!sent ? (
          <>
            <h1 className="text-2xl font-light mb-2">Забыли пароль?</h1>
            <p className="text-sm  mb-8">Введите email — мы отправим ссылку для сброса.</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-[0.15em] text-black mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@mail.com"
                  className="w-full bg-black/[0.03] rounded-xl px-4 py-3.5 text-sm outline-none border border-transparent focus:border-black/20 focus:bg-white transition-all"
                />
              </div>

              {error && <p className="text-red-400 text-xs">{error}</p>}

              <motion.button
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-black text-white rounded-xl text-xs uppercase tracking-widest hover:bg-black/80 transition-colors disabled:opacity-70"
              >
                {loading ? 'Отправляем...' : 'Отправить ссылку'}
              </motion.button>
            </form>
          </>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
            <Mail className="w-14 h-14 mx-auto mb-6 opacity-20" />
            <h1 className="text-2xl font-light mb-3">Письмо отправлено</h1>
            <p className="text-sm  leading-relaxed mb-10">
              Проверьте {email}.<br />Ссылка действительна 1 час.
            </p>
            <Link href="/login" className="text-sm  hover:opacity-80 transition-opacity underline underline-offset-4">
              Вернуться на страницу входа
            </Link>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
