'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ArrowLeft, Mail } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';

type Tab = 'login' | 'register';

function Field({
  label, type, value, onChange, placeholder, children,
}: {
  label: string; type: string; value: string;
  onChange: (v: string) => void; placeholder: string; children?: React.ReactNode;
}) {
  return (
    <div className="relative group">
      <label className="block text-[11px] font-medium uppercase tracking-[0.15em] text-black mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-black/[0.03] rounded-xl px-4 py-3.5 text-sm text-black placeholder:text-black outline-none border border-transparent focus:border-black/20 focus:bg-white transition-all duration-200 pr-10"
        />
        {children}
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/account';

  const [tab, setTab] = useState<Tab>('login');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [registered, setRegistered] = useState('');
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [regForm, setRegForm] = useState({ name: '', email: '', phone: '', password: '' });

  useEffect(() => {
    if (localStorage.getItem('token')) router.push(redirect);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailNotVerified(false);
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', loginForm);
      localStorage.setItem('token', res.data.token);
      router.push(redirect);
    } catch (err: any) {
      const msg = err.response?.data?.error || '';
      if (msg === 'email not verified') {
        setEmailNotVerified(true);
      } else {
        setFailedAttempts((n) => n + 1);
        setError(msg || 'Неверный email или пароль');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/api/auth/register', regForm);
      setRegistered(regForm.email);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async (email: string) => {
    setResending(true);
    try {
      await api.post('/api/auth/resend-verification', { email });
      setResent(true);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Левая панель */}
      <div className="hidden lg:flex lg:w-[45%] bg-black flex-col justify-between p-12 relative overflow-hidden">
        {/* Декор: угловые линии */}
        <div className="absolute top-0 left-0 w-40 h-40 border-l border-t border-white/10 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-40 h-40 border-r border-b border-white/10 pointer-events-none" />

        <Link href="/" className="flex items-center gap-2 text-white hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />
          На главную
        </Link>

        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.65, 0, 0.35, 1] }}
          >
            <p className="text-white/20 text-xs tracking-[0.4em] uppercase mb-6">SEMEY · KAZAKHSTAN</p>
            <h1 className="text-white text-7xl font-light tracking-[0.15em] leading-none">USP</h1>
            <div className="mt-8 w-12 h-px bg-white/20" />
            <p className="text-white text-sm mt-6 leading-relaxed max-w-xs">
              Магазин обуви и одежды. Качество в каждой детали.
            </p>
          </motion.div>
        </div>

        {/* Большой фоновый текст */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
          <span className="text-[16rem] font-black text-white/[0.025] leading-none">U</span>
        </div>

        <p className="text-white/15 text-xs">© 2026 USP Store</p>
      </div>

      {/* Правая панель */}
      <div className="flex-1 bg-white flex items-center justify-center px-8 py-16">
        <div className="w-full max-w-[360px]">
          {/* Мобильный лого */}
          <Link href="/" className="lg:hidden flex items-center gap-2 text-black hover:text-black transition-colors text-sm mb-10">
            <ArrowLeft className="w-4 h-4" />
            USP
          </Link>

          {/* Экран после регистрации */}
          {registered ? (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center py-8">
              <Mail className="w-14 h-14 mx-auto mb-6 opacity-20" />
              <h2 className="text-2xl font-light mb-3">Проверьте почту</h2>
              <p className="text-sm text-black leading-relaxed mb-8">
                Мы отправили письмо на<br />
                <span className="text-black font-medium">{registered}</span><br />
                Подтвердите email чтобы войти.
              </p>
              {resent ? (
                <p className="text-green-500 text-sm">Письмо отправлено повторно</p>
              ) : (
                <button
                  onClick={() => resendVerification(registered)}
                  disabled={resending}
                  className="text-sm  hover:opacity-80 transition-opacity underline underline-offset-4"
                >
                  {resending ? 'Отправляем...' : 'Не пришло письмо? Отправить снова'}
                </button>
              )}
            </motion.div>
          ) : (

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-light mb-1">
              {tab === 'login' ? 'Добро пожаловать' : 'Создать аккаунт'}
            </h2>
            <p className="text-sm text-black mb-8">
              {tab === 'login' ? 'Войдите в свой аккаунт' : 'Регистрация займёт минуту'}
            </p>

            {/* Табы */}
            <div className="flex gap-1 p-1 bg-black/[0.04] rounded-xl mb-8">
              {(['login', 'register'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setError(''); }}
                  className={`flex-1 py-2 text-xs uppercase tracking-widest rounded-lg transition-all duration-300 ${
                    tab === t ? 'bg-black text-white shadow-sm' : 'text-black hover:text-black'
                  }`}
                >
                  {t === 'login' ? 'Войти' : 'Регистрация'}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {tab === 'login' ? (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={handleLogin}
                  className="flex flex-col gap-3"
                >
                  <Field
                    label="Email" type="email" placeholder="example@mail.com"
                    value={loginForm.email} onChange={(v) => setLoginForm({ ...loginForm, email: v })}
                  />
                  <Field
                    label="Пароль" type={showPwd ? 'text' : 'password'} placeholder="Ваш пароль"
                    value={loginForm.password} onChange={(v) => setLoginForm({ ...loginForm, password: v })}
                  >
                    <button
                      type="button" onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-black hover:text-black transition-colors"
                    >
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </Field>

                  {error && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs px-1">
                      {error}
                    </motion.p>
                  )}

                  {emailNotVerified && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <p className="text-amber-700 text-xs mb-2">Email не подтверждён. Проверьте почту или запросите новое письмо.</p>
                      {resent ? (
                        <p className="text-green-600 text-xs">Письмо отправлено</p>
                      ) : (
                        <button
                          type="button"
                          onClick={() => resendVerification(loginForm.email)}
                          disabled={resending}
                          className="text-xs text-amber-700 underline underline-offset-2 hover:text-amber-900 transition-colors"
                        >
                          {resending ? 'Отправляем...' : 'Отправить письмо повторно'}
                        </button>
                      )}
                    </motion.div>
                  )}

                  <motion.button
                    type="submit" disabled={loading} whileTap={{ scale: 0.98 }}
                    className="mt-2 w-full py-4 bg-black text-white rounded-xl text-xs uppercase tracking-widest hover:bg-black/80 transition-colors disabled:opacity-70"
                  >
                    {loading ? 'Входим...' : 'Войти'}
                  </motion.button>

                  {failedAttempts >= 2 ? (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-black/[0.03] rounded-xl p-4 text-center"
                    >
                      <p className="text-xs  mb-2">Не можете войти?</p>
                      <Link href="/forgot-password" className="text-sm font-medium hover:opacity-70 transition-opacity">
                        Сбросить пароль →
                      </Link>
                    </motion.div>
                  ) : (
                    <Link href="/forgot-password" className="block text-center text-xs  hover:opacity-70 transition-opacity mt-1">
                      Забыли пароль?
                    </Link>
                  )}
                </motion.form>
              ) : (
                <motion.form
                  key="register"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={handleRegister}
                  className="flex flex-col gap-3"
                >
                  <Field
                    label="Имя" type="text" placeholder="Ваше имя"
                    value={regForm.name} onChange={(v) => setRegForm({ ...regForm, name: v })}
                  />
                  <Field
                    label="Email" type="email" placeholder="example@mail.com"
                    value={regForm.email} onChange={(v) => setRegForm({ ...regForm, email: v })}
                  />
                  <Field
                    label="Телефон" type="tel" placeholder="+7 777 000 00 00"
                    value={regForm.phone} onChange={(v) => setRegForm({ ...regForm, phone: v })}
                  />
                  <Field
                    label="Пароль" type={showPwd ? 'text' : 'password'} placeholder="Минимум 6 символов"
                    value={regForm.password} onChange={(v) => setRegForm({ ...regForm, password: v })}
                  >
                    <button
                      type="button" onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-black hover:text-black transition-colors"
                    >
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </Field>

                  {error && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs px-1">
                      {error}
                    </motion.p>
                  )}

                  <motion.button
                    type="submit" disabled={loading} whileTap={{ scale: 0.98 }}
                    className="mt-2 w-full py-4 bg-black text-white rounded-xl text-xs uppercase tracking-widest hover:bg-black/80 transition-colors disabled:opacity-70"
                  >
                    {loading ? 'Создаём аккаунт...' : 'Создать аккаунт'}
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
          )} {/* конец registered ? ... : ( */}
        </div>
      </div>
    </div>
  );
}
