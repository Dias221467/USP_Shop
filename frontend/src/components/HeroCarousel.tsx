'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Slide {
  id: number;
  image: string;
  model: string;
  watermark: string;
  accent?: string;
}

const slides: Slide[] = [
  { id: 1, image: '/sneakers/nike-sb-dunk-black.jpg', model: 'NIKE SB DUNK LOW', watermark: 'SB DUNK' },
  { id: 2, image: '/sneakers/adidas-samba-white.jpg', model: 'ADIDAS SAMBA OG', watermark: 'SAMBA' },
  { id: 3, image: '/sneakers/air-jordan-1-low-sage.jpg', model: 'AIR JORDAN 1 LOW', watermark: 'AJ1' },
  { id: 4, image: '/sneakers/nike-p6000-black.jpg', model: 'NIKE P-6000', watermark: 'P-6000', accent: '#d4af37' },
  { id: 5, image: '/sneakers/adidas-samba-black.jpg', model: 'ADIDAS SAMBA OG', watermark: 'SAMBA' },
  { id: 6, image: '/sneakers/new-balance-1906d.jpg', model: 'NEW BALANCE 1906D', watermark: '1906D' },
  { id: 7, image: '/sneakers/adidas-centennial-cream.jpg', model: 'ADIDAS CENTENNIAL 85', watermark: 'CENTENNIAL' },
];

export function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setDirection(1);
      setCurrent((c) => (c === slides.length - 1 ? 0 : c + 1));
    }, 5000);
  };

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const prev = () => { setDirection(-1); setCurrent((c) => (c === 0 ? slides.length - 1 : c - 1)); resetTimer(); };
  const next = () => { setDirection(1); setCurrent((c) => (c === slides.length - 1 ? 0 : c + 1)); resetTimer(); };
  const slide = slides[current];

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#f7f7f5]">
      <div className="flex items-center justify-center h-full relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={`wm-${slide.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
          >
            <span className="text-[4rem] md:text-[7rem] font-black text-black/[0.05] whitespace-nowrap">
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
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction * -300, opacity: 0 }}
            transition={{ duration: 0.75, ease: [0.65, 0, 0.35, 1] }}
            className="w-full max-w-xl md:max-w-2xl px-10 md:px-16 relative z-10"
          >
            <img src={slide.image} alt={slide.model} className="w-full h-auto object-contain" loading="eager" />
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
            <h2
              className="text-xl md:text-3xl tracking-[0.2em] font-light uppercase"
              style={{ color: slide.accent || '#222222' }}
            >
              {slide.model}
            </h2>
            <a
              href="/catalog"
              className="inline-block px-6 py-2.5 rounded-full text-xs tracking-widest uppercase border border-black/20 hover:border-black/50 hover:bg-black hover:text-white transition-all duration-300"
              style={{ color: slide.accent || undefined }}
            >
              Смотреть в каталоге
            </a>
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
