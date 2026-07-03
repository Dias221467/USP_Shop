'use client';

import { ShoppingBag, Menu, User, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

function getTokenRole(): string | null {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.role || null;
  } catch {
    return null;
  }
}

const NAV_LINKS: { href: string; label: string; accent?: boolean }[] = [
  { href: '/catalog?category=shoes', label: 'Обувь' },
  { href: '/catalog?category=clothing', label: 'Одежда' },
  { href: '/catalog', label: 'Коллекции' },
  { href: '/sales', label: 'Скидки', accent: true },
];

export function Header() {
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setIsAdmin(getTokenRole() === 'admin');
  }, []);

  useEffect(() => {
    const syncCart = () => {
      const cart = localStorage.getItem('cart');
      if (cart) {
        const parsed = JSON.parse(cart);
        setCartCount(parsed?.items?.length || 0);
      }
    };
    syncCart();
    window.addEventListener('cartUpdate', syncCart);
    return () => window.removeEventListener('cartUpdate', syncCart);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: [0.65, 0, 0.35, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 text-black transition-all duration-500 ${
          scrolled || menuOpen ? 'bg-white/90 backdrop-blur-md shadow-[0_1px_0_0_rgba(0,0,0,0.06)]' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-6 flex items-center justify-between">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden hover:opacity-60 transition-opacity duration-300 w-10 h-10 flex items-center justify-center"
          >
            <AnimatePresence mode="wait" initial={false}>
              {menuOpen ? (
                <motion.span key="x" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }} transition={{ duration: 0.2 }}>
                  <X className="w-6 h-6" />
                </motion.span>
              ) : (
                <motion.span key="menu" initial={{ opacity: 0, rotate: 90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: -90 }} transition={{ duration: 0.2 }}>
                  <Menu className="w-6 h-6" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          <Link href="/" className="text-3xl tracking-tight font-light">
            USP
          </Link>

          <nav className="hidden lg:flex gap-16 absolute left-1/2 -translate-x-1/2 text-sm">
            {NAV_LINKS.map(({ href, label, accent }) => (
              <Link key={href} href={href} className={`transition-opacity duration-300 hover:opacity-50 ${accent ? 'text-red-500' : ''}`}>
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-5">
            {isAdmin && (
              <Link href="/admin" className="hidden lg:block text-xs uppercase tracking-widest hover:opacity-50 transition-opacity duration-300">
                Админ
              </Link>
            )}
            <Link href="/account" className="hover:opacity-50 transition-opacity duration-300">
              <User className="w-5 h-5" />
            </Link>
            <Link href="/cart" className="hover:opacity-50 transition-opacity duration-300 relative">
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-black text-white text-[10px] flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 bg-black/20 z-40 lg:hidden"
            />

            {/* Drawer */}
            <motion.div
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.4, ease: [0.65, 0, 0.35, 1] }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-white z-40 lg:hidden flex flex-col pt-24 pb-10 px-8"
            >
              <nav className="flex flex-col gap-1">
                {NAV_LINKS.map(({ href, label, accent }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`text-2xl font-light py-3 border-b border-black/5 hover:opacity-50 transition-opacity ${accent ? 'text-red-500' : ''}`}
                  >
                    {label}
                  </Link>
                ))}
                <Link
                  href="/account"
                  className="text-2xl font-light py-3 border-b border-black/5 hover:opacity-50 transition-opacity"
                >
                  Аккаунт
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="text-2xl font-light py-3 border-b border-black/5 hover:opacity-50 transition-opacity"
                  >
                    Админ
                  </Link>
                )}
              </nav>

              <div className="mt-auto">
                <p className="text-xs text-black/30 tracking-widest uppercase">Семей, Казахстан</p>
                <p className="text-xs text-black/30 mt-1">© 2026 USP Store</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
