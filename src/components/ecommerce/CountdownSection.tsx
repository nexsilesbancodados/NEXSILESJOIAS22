import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CountdownSectionProps {
  ativo: boolean;
  titulo?: string;
  subtitulo?: string;
  dataFim?: string;
  corPrimaria?: string;
  fontTitulos?: string;
  onVerProdutos?: () => void;
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="text-3xl md:text-5xl font-bold text-white tabular-nums"
        >
          {String(value).padStart(2, '0')}
        </motion.span>
      </AnimatePresence>
      <span className="text-xs md:text-sm text-white/80 uppercase tracking-wider mt-1">{label}</span>
    </div>
  );
}

export function CountdownSection({ ativo, titulo, subtitulo, dataFim, corPrimaria = '#B76E79', fontTitulos, onVerProdutos }: CountdownSectionProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!dataFim) return;
    const target = new Date(dataFim).getTime();

    const update = () => {
      const now = Date.now();
      const diff = target - now;
      if (diff <= 0) { setExpired(true); return; }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [dataFim]);

  if (!ativo || expired || !dataFim) return null;

  return (
    <section
      className="py-12 px-4"
      style={{ background: `linear-gradient(135deg, ${corPrimaria}, ${corPrimaria}dd)` }}
    >
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="text-center md:text-left">
          <h2
            className="text-2xl md:text-4xl font-bold text-white mb-2"
            style={{ fontFamily: fontTitulos }}
          >
            {titulo || 'Promoção Especial'}
          </h2>
          {subtitulo && <p className="text-white/90 text-lg">{subtitulo}</p>}
          {onVerProdutos && (
            <button
              onClick={onVerProdutos}
              className="mt-4 px-6 py-2.5 bg-white rounded-full font-semibold text-sm hover:bg-white/90 transition-colors"
              style={{ color: corPrimaria }}
            >
              Ver Produtos
            </button>
          )}
        </div>
        <div className="flex gap-4 md:gap-6">
          <TimeUnit value={timeLeft.days} label="Dias" />
          <span className="text-3xl md:text-5xl text-white/60 font-light self-start mt-1">:</span>
          <TimeUnit value={timeLeft.hours} label="Horas" />
          <span className="text-3xl md:text-5xl text-white/60 font-light self-start mt-1">:</span>
          <TimeUnit value={timeLeft.minutes} label="Min" />
          <span className="text-3xl md:text-5xl text-white/60 font-light self-start mt-1">:</span>
          <TimeUnit value={timeLeft.seconds} label="Seg" />
        </div>
      </div>
    </section>
  );
}
