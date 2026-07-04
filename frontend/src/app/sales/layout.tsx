import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Скидки',
  description: 'Обувь и одежда по сниженным ценам в USP Store Семей.',
};

export default function SalesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
