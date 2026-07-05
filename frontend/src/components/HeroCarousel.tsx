'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { Product } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface Slide {
  id: string;
  image: string;
  model: string;
  watermark: string;
  price?: number;
  oldPrice?: number;
  href: string;
}

// Запасные слайды, если API недоступен или товаров нет
const FALLBACK_SLIDES: Slide[] = [
  { id: 'f1', image: '/sneakers/nike-sb-dunk-black.jpg', model: 'NIKE SB DUNK LOW', watermark: 'SB DUNK', href: '/catalog' },
  { id: 'f2', image: '/sneakers/adidas-samba-white.jpg', model: 'ADIDAS SAMBA OG', watermark: 'SAMBA', href: '/catalog' },
  { id: 'f3', image: '/sneakers/air-jordan-1-low-sage.jpg', model: 'AIR JORDAN 1 LOW', watermark: 'AJ1', href: '/catalog' },
];

// Из «Nike Air Force 1 '07 Triple White» делаем короткий водяной знак «AIR FORCE»
function makeWatermark(name: string, brand: string): string {
  let base = name;
  if (brand && base.toLowerCase().startsWith(brand.toLowerCase())) {
    base = base.slice(brand.length).trim();
  }
  const words = base.split(/\s+/).filter(Boolean);
  if (words.length === 0) return brand.toUpperCase();
  let result = words[0];
  for (let i = 1; i < words.length; i++) {
    if ((result + ' ' + words[i]).length > 12) break;
    result += ' ' + words[i];
  }
  return result.toUpperCase();
}

export function HeroCarousel() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    api.get('/api/products?limit=8')
      .then((res) => {
        const products: Product[] = (res.data?.items || []).filter((p: Product) => p.stock > 0 && p.images?.length);
        const real: Slide[] = products.slice(0, 6).map((p) => ({
          id: p.id,
          image: p.images[0].startsWith('http') ? p.images[0] : `${API_URL}${p.images[0]}`,
          model: p.name,
          watermark: makeWatermark(p.name, p.brand),
          price: p.price,
          oldPrice: p.old_price && p.old_price > p.price ? p.old_price : undefined,
          href: `/product/${p.id}`,
        }));
        setSlides(real.length > 0 ? real : FALLBACK_SLIDES);
      })
      .catch(() => setSlides(FALLBACK_SLIDES));
  }, []);

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setDirection(1);
      setCurrent((c) => (slides.length === 0 ? 0 : (c === slides.length - 1 ? 0 : c + 1)));
    }, 5000);
  };

  useEffect(() => {
    if (slides.length === 0) return;
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [slides.length]);

  if (slides.length === 0) {
    return <div className="w-full h-screen bg-[#f7f7f5]" />;
  }

  const prev = () => { setDirection(-1); setCurrent((c) => (c === 0 ? slides.length - 1 : c - 1)); resetTimer(); };
  const next = () => { setDirection(1); setCurrent((c) => (c === slides.length - 1 ? 0 : c + 1)); resetTimer(); };
  const slide = slides[Math.min(current, slides.length - 1)];

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#f7f7f5]">
      <div className="flex items-center justify-center h-full relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={`wm-${slide.id}`}
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.65, 0, 0.35, 1] } }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
          >
            <span
              className="font-black text-black/[0.07] whitespace-nowrap tracking-tight"
              style={{ fontSize: `min(11rem, ${120 / slide.watermark.length}vw)` }}
            >
              {slide.watermark}
            </span>
          </motion.div>
        </AnimatePresence>

        {/* Preload all images */}
        <div className="hidden">
          {slides.map((s) => <img key={s.id} src={s.image} alt="" />)}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`img-${slide.id}`}
            initial={{ x: direction * 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1, transition: { duration: 0.75, delay: 0.25, ease: [0.65, 0, 0.35, 1] } }}
            exit={{ x: direction * -300, opacity: 0, transition: { duration: 0.45, ease: [0.65, 0, 0.35, 1] } }}
            className="w-full max-w-xl md:max-w-2xl px-10 md:px-16 relative z-10"
          >
            <Link href={slide.href}>
              <img
                src={slide.image}
                alt={slide.model}
                className="w-full h-auto max-h-[55vh] object-contain mix-blend-multiply cursor-pointer"
                loading="eager"
              />
            </Link>
          </motion.div>
        </AnimatePresence>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`txt-${slide.id}`}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.65, 0, 0.35, 1] }}
            className="absolute bottom-20 md:bottom-20 left-0 right-0 text-center z-20 px-8 space-y-3"
          >
            <h2 className="text-lg md:text-2xl tracking-[0.2em] font-light uppercase text-[#222]">
              {slide.model}
            </h2>
            {slide.price !== undefined && (
              <p className="text-base md:text-lg font-light">
                {slide.oldPrice ? (
                  <>
                    <span className="text-red-500">₸{slide.price.toLocaleString()}</span>{' '}
                    <span className="line-through text-black/30 text-sm">₸{slide.oldPrice.toLocaleString()}</span>
                  </>
                ) : (
                  <span className="text-black/60">₸{slide.price.toLocaleString()}</span>
                )}
              </p>
            )}
            <Link
              href={slide.href}
              className="inline-block px-6 py-2.5 rounded-full text-xs tracking-widest uppercase border border-black/20 hover:border-black/50 hover:bg-black hover:text-white transition-all duration-300"
            >
              {slide.href === '/catalog' ? 'Смотреть в каталоге' : 'Смотреть товар'}
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>

      <button
        onClick={prev}
        className="absolute left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center hover:opacity-70 transition-opacity"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={next}
        className="absolute right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center hover:opacity-70 transition-opacity"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Slide counter */}
      <div className="absolute top-32 right-8 z-20 text-xs tracking-widest text-black/30 font-mono">
        {String(current + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
      </div>

      <div className="absolute bottom-8 left-0 right-0 z-20 flex justify-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); resetTimer(); }}
            className={`transition-all duration-500 rounded-full ${i === current ? 'w-6 h-1.5 bg-black' : 'w-1.5 h-1.5 bg-black/20'}`}
          />
        ))}
      </div>
    </div>
  );
}
