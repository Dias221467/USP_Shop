'use client';

import { ShoppingBag, Menu, User } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';

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

export function Header() {
  const [cartCount, setCartCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

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

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1, ease: [0.65, 0, 0.35, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 text-black transition-all duration-500 ${
        scrolled ? 'bg-white/90 backdrop-blur-md shadow-[0_1px_0_0_rgba(0,0,0,0.06)]' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-8 md:px-12 py-8 flex items-center justify-between">
        <button className="lg:hidden hover:opacity-60 transition-opacity duration-300">
          <Menu className="w-6 h-6" />
        </button>

        <Link href="/" className="text-3xl tracking-tight font-light">
          USP
        </Link>

        <nav className="hidden lg:flex gap-16 absolute left-1/2 -translate-x-1/2">
          <Link href="/catalog?category=shoes" className="hover:opacity-50 transition-opacity duration-300">
            Обувь
          </Link>
          <Link href="/catalog?category=clothing" className="hover:opacity-50 transition-opacity duration-300">
            Одежда
          </Link>
          <Link href="/catalog" className="hover:opacity-50 transition-opacity duration-300">
            Коллекции
          </Link>
        </nav>

        <div className="flex items-center gap-6">
          {isAdmin && (
            <Link href="/admin" className="text-xs uppercase tracking-widest hover:opacity-50 transition-opacity duration-300">
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
  );
}
