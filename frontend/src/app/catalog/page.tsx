'use client';
import { useState, useEffect, useMemo, Suspense } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, Heart } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import api from '@/lib/api';
import { getFavorites, toggleFavorite } from '@/lib/favorites';
import { Product } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const FILTERS = [
  { label: 'Все', value: '' },
  { label: 'Обувь', value: 'shoes' },
  { label: 'Одежда', value: 'clothing' },
];

const SORTS = [
  { label: 'Сначала новинки', value: 'new' },
  { label: 'Цена: по возрастанию', value: 'price_asc' },
  { label: 'Цена: по убыванию', value: 'price_desc' },
];

const NEW_DAYS = 14;
const PAGE_SIZE = 24;

function isNew(p: Product): boolean {
  if (!p.created_at) return false;
  return Date.now() - new Date(p.created_at).getTime() < NEW_DAYS * 24 * 60 * 60 * 1000;
}

function CatalogContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [brands, setBrands] = useState<string[]>([]);
  const [category, setCategory] = useState(categoryParam);
  const [brand, setBrand] = useState('');
  const [sort, setSort] = useState('new');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [favs, setFavs] = useState<string[]>([]);

  useEffect(() => {
    setFavs(getFavorites());
    const sync = () => setFavs(getFavorites());
    window.addEventListener('favUpdate', sync);
    return () => window.removeEventListener('favUpdate', sync);
  }, []);

  // Список брендов для кнопок — один раз
  useEffect(() => {
    api.get('/api/products/brands')
      .then((res) => setBrands(res.data || []))
      .catch(() => setBrands([]));
  }, []);

  useEffect(() => {
    setCategory(categoryParam);
    setBrand('');
    setPage(1);
  }, [categoryParam]);

  // Поиск с задержкой, чтобы не слать запрос на каждую букву
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Смена фильтров — возврат на первую страницу
  useEffect(() => {
    setPage(1);
  }, [category, brand, debouncedSearch, sort]);

  // Основной запрос: все фильтры и пагинация на бэке
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (brand) params.set('brand', brand);
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (sort !== 'new') params.set('sort', sort);
    params.set('page', String(page));
    params.set('limit', String(PAGE_SIZE));

    api.get(`/api/products?${params.toString()}`)
      .then((res) => {
        setProducts(res.data?.items || []);
        setTotal(res.data?.total || 0);
        setTotalPages(res.data?.total_pages || 1);
      })
      .catch(() => {
        setProducts([]);
        setTotal(0);
        setTotalPages(1);
      })
      .finally(() => setLoading(false));
  }, [category, brand, debouncedSearch, sort, page]);

  const goToPage = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Номера страниц: все если мало, иначе с многоточиями вокруг текущей
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | '...')[] = [1];
    if (page > 3) pages.push('...');
    for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++) pages.push(p);
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  }, [page, totalPages]);

  const onToggleFav = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(id);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="pt-28 md:pt-32 pb-20 px-4 md:px-8 lg:px-12">
        <div className="max-w-[1600px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-12"
          >
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
              <h1 className="text-5xl md:text-7xl lg:text-8xl tracking-tight">Каталог</h1>
              {!loading && (
                <p className="text-black/30 text-sm pb-2">
                  {total} {total === 1 ? 'товар' : total < 5 ? 'товара' : 'товаров'}
                </p>
              )}
            </div>

            {/* Поиск */}
            <div className="relative max-w-md mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск по названию или бренду..."
                className="w-full bg-black/[0.04] rounded-full pl-11 pr-5 py-3 text-sm outline-none border border-transparent focus:border-black/20 transition-colors"
              />
            </div>

            {/* Категории */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setCategory(f.value)}
                  className={`px-6 py-2 rounded-full text-sm transition-all duration-300 ${
                    category === f.value
                      ? 'bg-black text-white'
                      : 'bg-black/5 text-black hover:bg-black/10'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Бренды + сортировка */}
            <div className="flex flex-wrap items-center gap-2">
              {brands.length > 1 && (
                <>
                  <button
                    onClick={() => setBrand('')}
                    className={`px-4 py-1.5 rounded-full text-xs transition-all duration-300 ${
                      brand === '' ? 'bg-black text-white' : 'bg-black/5 hover:bg-black/10'
                    }`}
                  >
                    Все бренды
                  </button>
                  {brands.map((b) => (
                    <button
                      key={b}
                      onClick={() => setBrand(brand === b ? '' : b)}
                      className={`px-4 py-1.5 rounded-full text-xs transition-all duration-300 ${
                        brand === b ? 'bg-black text-white' : 'bg-black/5 hover:bg-black/10'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </>
              )}
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="ml-auto bg-black/[0.04] rounded-full px-4 py-2 text-xs outline-none border border-transparent focus:border-black/20 appearance-none cursor-pointer"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[4/5] rounded-3xl bg-black/4 border border-black/5 animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-40">
              <p className="text-4xl font-light opacity-20">Товары не найдены</p>
            </div>
          ) : (
            <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product, index) => {
                const toUrl = (img: string) => (img.startsWith('http') ? img : `${API_URL}${img}`);
                const imageUrl = product.images?.[0] ? toUrl(product.images[0]) : null;
                const hoverImageUrl = product.images?.[1] ? toUrl(product.images[1]) : null;
                const discounted = !!product.old_price && product.old_price > product.price;
                const fav = favs.includes(product.id);

                return (
                  <div key={product.id}>
                    {product.stock > 0 ? (
                      <Link href={`/product/${product.id}`}>
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.05, ease: [0.65, 0, 0.35, 1] }}
                      onHoverStart={() => setHoveredId(product.id)}
                      onHoverEnd={() => setHoveredId(null)}
                      className="group cursor-pointer"
                    >
                      <motion.div
                        className="aspect-[4/5] rounded-3xl overflow-hidden bg-white border border-black/8 relative"
                        animate={{ scale: hoveredId === product.id ? 0.98 : 1, boxShadow: hoveredId === product.id ? '0 8px 40px rgba(0,0,0,0.10)' : '0 2px 12px rgba(0,0,0,0.06)' }}
                        transition={{ duration: 0.4 }}
                      >
                        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                          {discounted && (
                            <span className="bg-red-500 text-white text-xs px-3 py-1 rounded-full w-fit">
                              -{Math.round((1 - product.price / product.old_price!) * 100)}%
                            </span>
                          )}
                          {isNew(product) && (
                            <span className="bg-black text-white text-xs px-3 py-1 rounded-full w-fit">NEW</span>
                          )}
                        </div>
                        <button
                          onClick={(e) => onToggleFav(e, product.id)}
                          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/80 backdrop-blur flex items-center justify-center hover:scale-110 transition-transform"
                        >
                          <Heart className={`w-4 h-4 ${fav ? 'fill-red-500 text-red-500' : 'text-black/40'}`} />
                        </button>
                        <motion.div
                          className="absolute inset-0 flex items-center justify-center p-10"
                          animate={{ scale: hoveredId === product.id ? 1.08 : 1 }}
                          transition={{ duration: 0.5, ease: [0.65, 0, 0.35, 1] }}
                        >
                          {imageUrl ? (
                            <div className="relative w-full h-full">
                              <img src={imageUrl} alt={product.name}
                                className={`w-full h-full object-contain transition-opacity duration-300 ${hoverImageUrl && hoveredId === product.id ? 'opacity-0' : 'opacity-100'}`}
                                onError={(e) => { const t = e.currentTarget; t.style.display = 'none'; const p = t.parentElement; if (p) p.innerHTML = `<div class="flex flex-col items-center justify-center gap-3 opacity-20"><span class="text-5xl font-black">${product.brand.slice(0,1)}</span><span class="text-xs tracking-widest uppercase">${product.brand}</span></div>`; }}
                              />
                              {hoverImageUrl && (
                                <img src={hoverImageUrl} alt={product.name}
                                  className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${hoveredId === product.id ? 'opacity-100' : 'opacity-0'}`}
                                />
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center gap-3 opacity-20">
                              <span className="text-5xl font-black">{product.brand.slice(0,1)}</span>
                              <span className="text-xs tracking-widest uppercase">{product.brand}</span>
                            </div>
                          )}
                        </motion.div>
                      </motion.div>

                      <div className="mt-4 px-1">
                        <p className="text-xs uppercase tracking-widest mb-1">{product.brand}</p>
                        <h3 className="font-light text-base leading-snug mb-1">{product.name}</h3>
                        {discounted ? (
                          <p className="font-light">
                            <span className="text-red-500">₸{product.price.toLocaleString()}</span>{' '}
                            <span className="line-through text-black/30 text-sm">₸{product.old_price!.toLocaleString()}</span>
                          </p>
                        ) : (
                          <p className="font-light">₸{product.price.toLocaleString()}</p>
                        )}
                      </div>
                    </motion.div>
                      </Link>
                    ) : (
                      <Link href={`/product/${product.id}`}>
                      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: index * 0.05 }} className="cursor-pointer group">
                        <div className="aspect-[4/5] rounded-3xl overflow-hidden bg-white border border-black/8 relative" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                          <div className="absolute inset-0 flex items-center justify-center p-10">
                            {imageUrl ? (
                              <img src={imageUrl} alt={product.name} className="w-full h-full object-contain" />
                            ) : (
                              <div className="flex flex-col items-center justify-center gap-3 opacity-20">
                                <span className="text-5xl font-black">{product.brand.slice(0,1)}</span>
                              </div>
                            )}
                          </div>
                          <div className="absolute inset-0 bg-white/70 rounded-3xl" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="bg-black/80 text-white text-xs px-4 py-1.5 rounded-full">Нет в наличии</span>
                          </div>
                          <button
                            onClick={(e) => onToggleFav(e, product.id)}
                            className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/80 backdrop-blur flex items-center justify-center hover:scale-110 transition-transform"
                          >
                            <Heart className={`w-4 h-4 ${fav ? 'fill-red-500 text-red-500' : 'text-black/40'}`} />
                          </button>
                        </div>
                        <div className="mt-4 px-1">
                          <p className="text-xs uppercase tracking-widest mb-1 text-black/40">{product.brand}</p>
                          <h3 className="font-light text-base leading-snug mb-1 text-black/40">{product.name}</h3>
                          <p className="font-light text-black/40">₸{product.price.toLocaleString()}</p>
                        </div>
                      </motion.div>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Пагинация */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-16">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-full text-sm bg-black/5 hover:bg-black/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  ←
                </button>
                {pageNumbers.map((p, i) =>
                  p === '...' ? (
                    <span key={`dots-${i}`} className="px-2 text-black/30 text-sm">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      className={`w-10 h-10 rounded-full text-sm transition-all ${
                        page === p ? 'bg-black text-white' : 'bg-black/5 hover:bg-black/10'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-full text-sm bg-black/5 hover:bg-black/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  →
                </button>
              </div>
            )}
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="w-8 h-8 border-2 border-black/20 border-t-black rounded-full animate-spin" /></div>}>
      <CatalogContent />
    </Suspense>
  );
}
