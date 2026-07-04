import type { Metadata } from 'next';
import { ProductView } from './ProductView';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const res = await fetch(`${API_URL}/api/products/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error('not found');
    const p = await res.json();

    const title = `${p.name} — USP Store`;
    const description = p.description
      ? p.description.slice(0, 160)
      : `${p.brand} · ₸${Number(p.price).toLocaleString('ru-RU')} · Магазин обуви и одежды USP в Семее`;
    const image = p.images?.[0]
      ? p.images[0].startsWith('http') ? p.images[0] : `${API_URL}${p.images[0]}`
      : undefined;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: image ? [{ url: image }] : undefined,
        type: 'website',
        siteName: 'USP Store',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: image ? [image] : undefined,
      },
    };
  } catch {
    return { title: 'Товар — USP Store' };
  }
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  return <ProductView id={id} />;
}
