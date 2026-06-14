'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';

type Status = 'loading' | 'success' | 'error';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Токен не найден');
      return;
    }

    api.get(`/api/auth/verify-email?token=${token}`)
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Ссылка недействительна или истекла');
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-sm"
      >
        <Link href="/" className="block text-3xl font-light tracking-[0.3em] mb-16">USP</Link>

        {status === 'loading' && (
          <>
            <Loader className="w-12 h-12 mx-auto mb-6 animate-spin " />
            <p className="text-lg font-light ">Проверяем...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', duration: 0.5 }}>
              <CheckCircle className="w-16 h-16 mx-auto mb-6 text-green-500" />
            </motion.div>
            <h1 className="text-2xl font-light mb-3">Email подтверждён</h1>
            <p className="opacity-50 text-sm mb-10">Ваш аккаунт активирован. Можете войти в магазин.</p>
            <Link
              href="/account"
              className="inline-block bg-black text-white px-8 py-4 rounded-2xl text-sm uppercase tracking-widest hover:bg-black/80 transition-colors"
            >
              В личный кабинет
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 mx-auto mb-6 text-red-400" />
            <h1 className="text-2xl font-light mb-3">Ошибка</h1>
            <p className="opacity-50 text-sm mb-10">{message}</p>
            <Link
              href="/login"
              className="inline-block bg-black text-white px-8 py-4 rounded-2xl text-sm uppercase tracking-widest hover:bg-black/80 transition-colors"
            >
              На страницу входа
            </Link>
          </>
        )}
      </motion.div>
    </div>
  );
}
