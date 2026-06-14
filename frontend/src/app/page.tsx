import { Header } from '@/components/layout/Header';
import { HeroCarousel } from '@/components/HeroCarousel';
import { ProductGrid } from '@/components/ProductGrid';
import { FeaturedSection } from '@/components/FeaturedSection';
import { Footer } from '@/components/layout/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <HeroCarousel />
      <ProductGrid />
      <FeaturedSection />
      <Footer />
    </div>
  );
}
