import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CookieConsentProps {
  nomeLoja: string;
  roseGold: string;
}

export function CookieConsent({ nomeLoja, roseGold }: CookieConsentProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('cookie_consent');
    if (!accepted) {
      const timer = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-[60] p-4"
        >
          <div className="max-w-4xl mx-auto p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-xl border"
            style={{ backgroundColor: '#2D2D2D', borderColor: 'rgba(255,255,255,0.1)' }}>
            <div className="flex-1">
              <p className="text-xs leading-relaxed text-white/80" style={{ fontFamily: "'Inter', sans-serif" }}>
                🍪 A {nomeLoja} utiliza cookies para melhorar sua experiência, personalizar ofertas e analisar tráfego.
                Ao continuar navegando, você concorda com nossa{' '}
                <span className="underline cursor-pointer" style={{ color: '#D4A0A7' }}>Política de Privacidade</span>.
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={accept}
                className="px-5 py-2 text-[10px] uppercase tracking-[0.15em] text-white transition-all hover:opacity-90"
                style={{ backgroundColor: roseGold, fontFamily: "'Inter', sans-serif" }}
              >
                Aceitar
              </button>
              <button
                onClick={accept}
                className="px-5 py-2 text-[10px] uppercase tracking-[0.15em] border border-white/30 text-white/70 transition-all hover:border-white/60"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                Rejeitar
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
