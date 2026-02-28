import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface BannerItem {
  id: string;
  imagem_url: string;
  titulo?: string;
  subtitulo?: string;
  cta_texto?: string;
  cta_link?: string;
  cor_overlay?: string;
  opacity?: number;
  posicao_texto?: 'esquerda' | 'centro' | 'direita';
  ativo?: boolean;
  ordem?: number;
}

interface HeroCarouselProps {
  banners: BannerItem[];
  fallbackSlides?: { image: string; title: string; subtitle: string; cta: string }[];
  fontTitulos?: string;
  corPrimaria?: string;
}

export function HeroCarousel({ banners, fallbackSlides, fontTitulos, corPrimaria = '#B76E79' }: HeroCarouselProps) {
  const activeBanners = banners?.filter(b => b.ativo !== false).sort((a, b) => (a.ordem || 0) - (b.ordem || 0)) || [];

  const useFallback = activeBanners.length === 0;
  const slides = useFallback
    ? (fallbackSlides || []).map((s, i) => ({
        id: `fallback-${i}`,
        imagem_url: s.image,
        titulo: s.title,
        subtitulo: s.subtitle,
        cta_texto: s.cta,
        cta_link: '#produtos',
        cor_overlay: 'rgba(0,0,0,0.3)',
        posicao_texto: 'centro' as const,
      }))
    : activeBanners;

  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const next = useCallback(() => {
    setDirection(1);
    setIndex(i => (i + 1) % slides.length);
  }, [slides.length]);

  const prev = useCallback(() => {
    setDirection(-1);
    setIndex(i => (i - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, slides.length]);

  if (slides.length === 0) return null;

  const current = slides[index];
  const textAlign = current.posicao_texto === 'esquerda' ? 'items-start text-left' : current.posicao_texto === 'direita' ? 'items-end text-right' : 'items-center text-center';

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
  };

  return (
    <section className="relative w-full h-[50vh] md:h-[70vh] overflow-hidden">
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={current.id}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${current.imagem_url})` }}
          />
          <div
            className="absolute inset-0"
            style={{ backgroundColor: current.cor_overlay || 'rgba(0,0,0,0.3)', opacity: ('opacity' in current ? (current as any).opacity : undefined) ?? 0.4 }}
          />
          <div className={`relative h-full flex flex-col justify-center px-6 md:px-16 lg:px-24 ${textAlign}`}>
            {current.titulo && (
              <h1
                className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-3 drop-shadow-lg max-w-2xl"
                style={{ fontFamily: fontTitulos || 'inherit' }}
              >
                {current.titulo}
              </h1>
            )}
            {current.subtitulo && (
              <p className="text-lg md:text-2xl text-white/90 italic mb-6 drop-shadow max-w-xl">
                {current.subtitulo}
              </p>
            )}
            {current.cta_texto && (
              <a
                href={current.cta_link || '#produtos'}
                className="inline-block px-8 py-3 rounded-full text-white font-semibold text-sm md:text-base transition-all hover:scale-105 hover:shadow-xl"
                style={{ backgroundColor: corPrimaria }}
              >
                {current.cta_texto}
              </a>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {slides.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 z-10 bg-white/20 backdrop-blur-sm hover:bg-white/40 rounded-full p-2 transition-colors">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 z-10 bg-white/20 backdrop-blur-sm hover:bg-white/40 rounded-full p-2 transition-colors">
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => { setDirection(i > index ? 1 : -1); setIndex(i); }}
                className={`w-2.5 h-2.5 rounded-full transition-all ${i === index ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/70'}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
