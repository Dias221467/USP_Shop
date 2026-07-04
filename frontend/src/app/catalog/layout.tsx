import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Каталог',
  description: 'Каталог обуви и одежды USP Store — Nike, Adidas, New Balance и другие бренды в Семее.',
};

export default function CatalogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
