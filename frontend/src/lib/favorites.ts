import api from './api';

// Гибридное избранное:
// - localStorage — всегда источник для мгновенного UI (гость и залогиненный)
// - у залогиненного изменения дублируются на сервер в фоне,
//   а при загрузке сайта локальное сливается с серверным

function hasToken(): boolean {
  return typeof window !== 'undefined' && !!localStorage.getItem('token');
}

function save(favs: string[]) {
  localStorage.setItem('favorites', JSON.stringify(favs));
  window.dispatchEvent(new Event('favUpdate'));
}

export function getFavorites(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('favorites') || '[]');
  } catch {
    return [];
  }
}

export function isFavorite(id: string): boolean {
  return getFavorites().includes(id);
}

export function toggleFavorite(id: string): boolean {
  const favs = getFavorites();
  const idx = favs.indexOf(id);
  const added = idx < 0;
  if (added) {
    favs.push(id);
  } else {
    favs.splice(idx, 1);
  }
  save(favs);

  // Залогиненному — дублируем на сервер в фоне, UI не ждёт
  if (hasToken()) {
    (added ? api.post(`/api/favorites/${id}`) : api.delete(`/api/favorites/${id}`)).catch(() => {});
  }
  return added;
}

// Слить локальное избранное с серверным (вызывается при загрузке страницы).
// Работает один раз за сессию, только для залогиненных.
let synced = false;
export async function syncFavorites() {
  if (!hasToken() || synced) return;
  synced = true;
  try {
    const res = await api.post('/api/favorites/sync', { ids: getFavorites() });
    if (Array.isArray(res.data)) save(res.data);
  } catch {
    synced = false; // не получилось — попробуем при следующей загрузке
  }
}
