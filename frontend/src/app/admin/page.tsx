'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, X, Upload, Package, ShoppingBag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import api from '@/lib/api';
import { Product } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

type Tab = 'products' | 'orders';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Ожидает',
  paid: 'Оплачен',
  shipped: 'Отправлен',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700',
  paid: 'bg-blue-50 text-blue-700',
  shipped: 'bg-purple-50 text-purple-700',
  delivered: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-600',
};

const EMPTY_FORM = {
  name: '', brand: '', description: '', price: '',
  category: 'shoes', sizes: '', colors: '', stock: '', images: [] as string[],
};

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (payload.role !== 'admin') { router.push('/'); return; }
    } catch { router.push('/'); return; }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pRes, oRes] = await Promise.all([
        api.get('/api/products'),
        api.get('/api/admin/orders'),
      ]);
      setProducts(pRes.data || []);
      setOrders(oRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => { setEditProduct(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (p: Product) => {
    setEditProduct(p);
    setForm({
      name: p.name, brand: p.brand, description: p.description,
      price: String(p.price), category: p.category,
      sizes: p.sizes.join(', '), colors: p.colors.join(', '),
      stock: String(p.stock), images: [...p.images],
    });
    setShowModal(true);
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await api.post('/api/admin/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm((f) => ({ ...f, images: [...f.images, res.data.url] }));
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx: number) => {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  };

  const saveProduct = async () => {
    if (!form.name || !form.brand || !form.price) return;
    setSaving(true);
    try {
      const body = {
        name: form.name, brand: form.brand, description: form.description,
        price: parseFloat(form.price), category: form.category,
        sizes: form.sizes.split(',').map((s) => s.trim()).filter(Boolean),
        colors: form.colors.split(',').map((c) => c.trim()).filter(Boolean),
        stock: parseInt(form.stock) || 0,
        images: form.images,
      };
      if (editProduct) {
        await api.put(`/api/admin/products/${editProduct.id}`, body);
      } else {
        await api.post('/api/admin/products', body);
      }
      setShowModal(false);
      loadData();
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (id: string) => {
    await api.delete(`/api/admin/products/${id}`);
    setDeleteId(null);
    loadData();
  };

  const updateOrderStatus = async (id: string, status: string) => {
    await api.patch(`/api/admin/orders/${id}/status`, { status });
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Header />

      <div className="pt-28 pb-20 px-8 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <h1 className="text-4xl font-light">Панель управления</h1>
            {tab === 'products' && (
              <button
                onClick={openAdd}
                className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl text-sm hover:bg-black/80 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Добавить товар
              </button>
            )}
          </div>

          {/* Табы */}
          <div className="flex gap-1 p-1 bg-black/5 rounded-xl mb-8 w-fit">
            {([['products', 'Товары', Package], ['orders', 'Заказы', ShoppingBag]] as const).map(([key, label, Icon]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm transition-all ${
                  tab === key ? 'bg-black text-white' : 'hover:bg-black/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === key ? 'bg-white/20' : 'bg-black/10'}`}>
                  {key === 'products' ? products.length : orders.length}
                </span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-black/20 border-t-black rounded-full animate-spin" />
            </div>
          ) : tab === 'products' ? (
            /* ── Товары ── */
            <div className="flex flex-col gap-3">
              {products.length === 0 && (
                <div className="text-center py-20 text-black/30">Товаров пока нет</div>
              )}
              {products.map((p) => {
                const img = p.images?.[0]
                  ? p.images[0].startsWith('http') ? p.images[0] : `${API_URL}${p.images[0]}`
                  : null;
                return (
                  <div key={p.id} className="bg-white rounded-2xl p-4 flex items-center gap-4 border border-black/5">
                    <div className="w-16 h-16 rounded-xl bg-[#f5f5f5] flex-shrink-0 overflow-hidden flex items-center justify-center">
                      {img ? (
                        <img src={img} alt={p.name} className="w-full h-full object-contain p-1" />
                      ) : (
                        <span className="text-lg font-black opacity-10">{p.brand[0]}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{p.name}</p>
                      <p className="text-xs text-black/40 mt-0.5">{p.brand} · {p.category === 'shoes' ? 'Обувь' : 'Одежда'}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-medium">₸{p.price.toLocaleString()}</p>
                      <p className="text-xs text-black/40 mt-0.5">
                        {p.stock > 0 ? `${p.stock} шт` : <span className="text-red-400">Нет в наличии</span>}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => openEdit(p)}
                        className="p-2 rounded-lg hover:bg-black/5 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(p.id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ── Заказы ── */
            <div className="flex flex-col gap-3">
              {orders.length === 0 && (
                <div className="text-center py-20 text-black/30">Заказов пока нет</div>
              )}
              {orders.map((order) => (
                <div key={order.id} className="bg-white rounded-2xl p-5 border border-black/5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-mono text-sm font-medium">#{order.id?.slice(-8).toUpperCase()}</p>
                      <p className="text-xs text-black/40 mt-0.5">
                        {new Date(order.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-base font-medium">₸{order.total?.toLocaleString()}</span>
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className={`text-xs px-3 py-1.5 rounded-full border-0 outline-none cursor-pointer font-medium ${STATUS_COLORS[order.status] || 'bg-black/5'}`}
                      >
                        {Object.entries(STATUS_LABELS).map(([v, l]) => (
                          <option key={v} value={v}>{l}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    {order.items?.map((item: any, i: number) => (
                      <p key={i} className="text-sm text-black/60">
                        {item.name}
                        {item.size && ` · ${item.size}`}
                        {item.quantity > 1 && ` × ${item.quantity}`}
                      </p>
                    ))}
                  </div>
                  {order.shipping_address && (
                    <p className="text-xs text-black/30 mt-2">
                      {order.shipping_address.city}, {order.shipping_address.street}, {order.shipping_address.house}
                      {order.shipping_address.flat && `, кв. ${order.shipping_address.flat}`}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Модалка добавить/редактировать */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25 }}
              className="bg-white rounded-3xl p-8 w-full max-w-xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-light">
                  {editProduct ? 'Редактировать товар' : 'Новый товар'}
                </h2>
                <button onClick={() => setShowModal(false)} className="p-1 hover:opacity-50 transition-opacity">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {/* Фото */}
                <div>
                  <p className="text-xs uppercase tracking-widest text-black/40 mb-2">Фото</p>
                  <div className="flex gap-2 flex-wrap">
                    {form.images.map((img, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden bg-[#f5f5f5]">
                        <img
                          src={img.startsWith('http') ? img : `${API_URL}${img}`}
                          alt=""
                          className="w-full h-full object-contain p-1"
                        />
                        <button
                          onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      className="w-20 h-20 rounded-xl border-2 border-dashed border-black/15 flex flex-col items-center justify-center gap-1 hover:border-black/30 transition-colors"
                    >
                      {uploading ? (
                        <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-4 h-4 opacity-30" />
                          <span className="text-[10px] opacity-30">Загрузить</span>
                        </>
                      )}
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => { if (e.target.files?.[0]) uploadImage(e.target.files[0]); }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs uppercase tracking-widest text-black/40 mb-1 block">Название</label>
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full bg-black/[0.03] rounded-xl px-4 py-3 text-sm outline-none border border-transparent focus:border-black/20" />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest text-black/40 mb-1 block">Бренд</label>
                    <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })}
                      className="w-full bg-black/[0.03] rounded-xl px-4 py-3 text-sm outline-none border border-transparent focus:border-black/20" />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest text-black/40 mb-1 block">Категория</label>
                    <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full bg-black/[0.03] rounded-xl px-4 py-3 text-sm outline-none border border-transparent focus:border-black/20 appearance-none">
                      <option value="shoes">Обувь</option>
                      <option value="clothing">Одежда</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest text-black/40 mb-1 block">Цена (₸)</label>
                    <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                      className="w-full bg-black/[0.03] rounded-xl px-4 py-3 text-sm outline-none border border-transparent focus:border-black/20" />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest text-black/40 mb-1 block">Остаток (шт)</label>
                    <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })}
                      className="w-full bg-black/[0.03] rounded-xl px-4 py-3 text-sm outline-none border border-transparent focus:border-black/20" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs uppercase tracking-widest text-black/40 mb-1 block">Размеры (через запятую)</label>
                    <input value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })}
                      placeholder="39, 40, 41, 42, 43"
                      className="w-full bg-black/[0.03] rounded-xl px-4 py-3 text-sm outline-none border border-transparent focus:border-black/20" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs uppercase tracking-widest text-black/40 mb-1 block">Цвета (через запятую)</label>
                    <input value={form.colors} onChange={(e) => setForm({ ...form, colors: e.target.value })}
                      placeholder="Black, White, Red"
                      className="w-full bg-black/[0.03] rounded-xl px-4 py-3 text-sm outline-none border border-transparent focus:border-black/20" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs uppercase tracking-widest text-black/40 mb-1 block">Описание</label>
                    <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={3} className="w-full bg-black/[0.03] rounded-xl px-4 py-3 text-sm outline-none border border-transparent focus:border-black/20 resize-none" />
                  </div>
                </div>

                <button
                  onClick={saveProduct}
                  disabled={saving || !form.name || !form.brand || !form.price}
                  className="w-full py-3.5 bg-black text-white rounded-xl text-sm hover:bg-black/80 transition-colors disabled:opacity-30"
                >
                  {saving ? 'Сохраняем...' : editProduct ? 'Сохранить' : 'Добавить товар'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Подтверждение удаления */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl p-8 max-w-sm w-full text-center"
            >
              <p className="text-lg font-light mb-2">Удалить товар?</p>
              <p className="text-sm text-black/40 mb-6">Это действие нельзя отменить</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)}
                  className="flex-1 py-3 border border-black/10 rounded-xl text-sm hover:border-black/30 transition-colors">
                  Отмена
                </button>
                <button onClick={() => deleteProduct(deleteId)}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl text-sm hover:bg-red-600 transition-colors">
                  Удалить
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
