import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Cookie, Settings, X } from 'lucide-react';
import { COOKIE_CONSENT_KEY, type CookieConsent } from '@/lib/lgpd-config';

const CONSENT_VERSION = '1.0';

export function CookieConsentBanner() {
  const [show, setShow] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!raw) {
        const timer = setTimeout(() => setShow(true), 1200);
        return () => clearTimeout(timer);
      }
      const parsed = JSON.parse(raw) as CookieConsent;
      if (parsed.versao !== CONSENT_VERSION) {
        setShow(true);
      }
    } catch {
      setShow(true);
    }
  }, []);

  const save = (data: Partial<CookieConsent>) => {
    const payload: CookieConsent = {
      necessarios: true,
      analiticos: data.analiticos ?? false,
      marketing: data.marketing ?? false,
      timestamp: new Date().toISOString(),
      versao: CONSENT_VERSION,
    };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(payload));
    setShow(false);
    setShowSettings(false);
  };

  const acceptAll = () => save({ analiticos: true, marketing: true });
  const rejectAll = () => save({ analiticos: false, marketing: false });
  const savePrefs = () => save({ analiticos: analytics, marketing });

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-4 pointer-events-none"
        >
          <div className="max-w-4xl mx-auto pointer-events-auto rounded-xl border border-border bg-card shadow-2xl p-5 sm:p-6">
            {!showSettings ? (
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <Cookie className="w-5 h-5 mt-0.5 text-primary flex-shrink-0" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-semibold text-foreground mb-1">Usamos cookies</p>
                    <p>
                      Utilizamos cookies necessários para o funcionamento e, com seu consentimento, cookies
                      analíticos e de marketing. Veja nossa{' '}
                      <a href="/cookies" className="text-primary underline">Política de Cookies</a> e{' '}
                      <a href="/politica-privacidade" className="text-primary underline">Privacidade</a>.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <Button variant="ghost" size="sm" onClick={() => setShowSettings(true)}>
                    <Settings className="w-3.5 h-3.5 mr-1.5" /> Preferências
                  </Button>
                  <Button variant="outline" size="sm" onClick={rejectAll}>Rejeitar opcionais</Button>
                  <Button size="sm" onClick={acceptAll}>Aceitar todos</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-foreground">Preferências de cookies</p>
                  <button onClick={() => setShowSettings(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4 p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm font-medium text-foreground">Necessários</p>
                      <p className="text-xs text-muted-foreground">Autenticação e sessão. Sempre ativos.</p>
                    </div>
                    <Switch checked disabled />
                  </div>
                  <div className="flex items-start justify-between gap-4 p-3 rounded-lg border border-border">
                    <div>
                      <p className="text-sm font-medium text-foreground">Analíticos</p>
                      <p className="text-xs text-muted-foreground">Métricas agregadas de uso da plataforma.</p>
                    </div>
                    <Switch checked={analytics} onCheckedChange={setAnalytics} />
                  </div>
                  <div className="flex items-start justify-between gap-4 p-3 rounded-lg border border-border">
                    <div>
                      <p className="text-sm font-medium text-foreground">Marketing</p>
                      <p className="text-xs text-muted-foreground">Personalização de ofertas e remarketing.</p>
                    </div>
                    <Switch checked={marketing} onCheckedChange={setMarketing} />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={rejectAll}>Rejeitar todos</Button>
                  <Button size="sm" onClick={savePrefs}>Salvar preferências</Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
