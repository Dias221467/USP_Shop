import api from './api';

// Гибридная корзина:
// - localStorage — источник для мгновенного UI (гость и залогиненный)
// - у залогиненного изменения дублируются на серверную корзину в фоне
// - при загрузке сайта локальная корзина сливается с серверной

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface CartItem {
  product_id: string;
  name: string;
  price: number;
  old_price?: number;
  size: string;
  color: string;
  quantity: number;
  max_qty?: number;
  image?: string;
  subtotal: number;
}

export interface CartState {
  items: CartItem[];
  total: number;
}

function hasToken(): boolean {
  return typeof window !== 'undefined' && !!localStorage.getItem('token');
}

export function getCart(): CartState {
  if (typeof window === 'undefined') return { items: [], total: 0 };
  try {
    const parsed = JSON.parse(localStorage.getItem('cart') || '{"items":[],"total":0}');
    return { items: parsed.items || [], total: parsed.total || 0 };
  } catch {
    return { items: [], total: 0 };
  }
}

function save(cart: CartState) {
  cart.total = cart.items.reduce((s, i) => s + i.subtotal, 0);
  localStorage.setItem('cart', JSON.stringify(cart));
  window.dispatchEvent(new Event('cartUpdate'));
}

const sameItem = (a: CartItem, b: { product_id: string; size: string; color: string }) =>
  a.product_id === b.product_id && a.size === b.size && a.color === b.color;

// Добавить товар (или +qty к существующей позиции). Возвращает false, если упёрлись в остаток.
export function addToCart(item: Omit<CartItem, 'subtotal' | 'quantity'>, quantity = 1): boolean {
  const cart = getCart();
  const existing = cart.items.find((i) => sameItem(i, item));
  const max = item.max_qty ?? Infinity;

  if (existing) {
    if (existing.quantity + quantity > max) return false;
    existing.quantity += quantity;
    existing.subtotal = existing.quantity * existing.price;
  } else {
    if (quantity > max) return false;
    cart.items.push({ ...item, quantity, subtotal: quantity * item.price });
  }
  save(cart);

  if (hasToken()) {
    api.post('/api/cart', {
      product_id: item.product_id,
      size: item.size,
      color: item.color,
      quantity,
    }).catch(() => {});
  }
  return true;
}

// Изменить количество позиции (в пределах 1..max_qty)
export function setQuantity(key: { product_id: string; size: string; color: string }, quantity: number) {
  const cart = getCart();
  const item = cart.items.find((i) => sameItem(i, key));
  if (!item) return;
  const max = item.max_qty ?? Infinity;
  item.quantity = Math.min(max, Math.max(1, quantity));
  item.subtotal = item.quantity * item.price;
  save(cart);

  if (hasToken()) {
    api.put('/api/cart', { ...key, quantity: item.quantity }).catch(() => {});
  }
}

export function removeFromCart(key: { product_id: string; size: string; color: string }) {
  const cart = getCart();
  cart.items = cart.items.filter((i) => !sameItem(i, key));
  save(cart);

  if (hasToken()) {
    api.put('/api/cart', { ...key, quantity: 0 }).catch(() => {});
  }
}

export function clearCart() {
  localStorage.removeItem('cart');
  window.dispatchEvent(new Event('cartUpdate'));
  if (hasToken()) {
    api.delete('/api/cart').catch(() => {});
  }
}

// Серверная позиция → локальный формат (картинка — в абсолютный URL)
function fromServer(item: any): CartItem {
  const image = item.image
    ? item.image.startsWith('http') ? item.image : `${API_URL}${item.image}`
    : '';
  return {
    product_id: item.product_id,
    name: item.name,
    price: item.price,
    old_price: item.old_price || undefined,
    size: item.size || '',
    color: item.color || '',
    quantity: item.quantity,
    max_qty: item.max_qty || undefined,
    image,
    subtotal: item.subtotal,
  };
}

// Слить локальную корзину с серверной (один раз за сессию, только для залогиненных).
// Локальные позиции, которых нет на сервере, доотправляются; сервер — источник правды.
let synced = false;
export async function syncCart() {
  if (!hasToken() || synced) return;
  synced = true;
  try {
    const res = await api.get('/api/cart');
    const serverItems: any[] = res.data?.items || [];
    const local = getCart();

    const missing = local.items.filter(
      (li) => !serverItems.some((si) => si.product_id === li.product_id && (si.size || '') === li.size && (si.color || '') === li.color)
    );
    for (const item of missing) {
      await api.post('/api/cart', {
        product_id: item.product_id,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
      }).catch(() => {});
    }

    const final = missing.length > 0 ? await api.get('/api/cart') : res;
    const finalItems: any[] = (missing.length > 0 ? final.data?.items : serverItems) || [];
    save({ items: finalItems.map(fromServer), total: 0 });
  } catch {
    synced = false; // попробуем при следующей загрузке
  }
}
