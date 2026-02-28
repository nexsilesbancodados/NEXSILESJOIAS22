import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PopupBoasVindasProps {
  ativo: boolean;
  titulo?: string;
  texto?: string;
  imagemUrl?: string;
  cupom?: string;
  delaySegundos?: number;
  slug: string;
  corPrimaria?: string;
  onSubmitEmail?: (email: string) => void;
}

export function PopupBoasVindas({ ativo, titulo, texto, imagemUrl, cupom, delaySegundos = 5, slug, corPrimaria = '#B76E79', onSubmitEmail }: PopupBoasVindasProps) {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!ativo) return;
    const key = `popup_shown_${slug}`;
    if (sessionStorage.getItem(key)) return;

    const timer = setTimeout(() => {
      setVisible(true);
      sessionStorage.setItem(key, '1');
    }, (delaySegundos || 5) * 1000);

    return () => clearTimeout(timer);
  }, [ativo, slug, delaySegundos]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    onSubmitEmail?.(email);
    setSubmitted(true);
  };

  const handleCopy = () => {
    if (cupom) {
      navigator.clipboard.writeText(cupom);
      setCopied(true);
      toast.success('Cupom copiado!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!ativo) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setVisible(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            <button onClick={() => setVisible(false)} className="absolute top-3 right-3 z-10 bg-white/80 rounded-full p-1.5">
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col md:flex-row">
              {imagemUrl && (
                <div className="md:w-2/5">
                  <img src={imagemUrl} alt="" className="w-full h-48 md:h-full object-cover" />
                </div>
              )}
              <div className={`p-6 ${imagemUrl ? 'md:w-3/5' : 'w-full'}`}>
                {!submitted ? (
                  <>
                    <h3 className="text-xl font-bold mb-2" style={{ color: corPrimaria }}>
                      {titulo || 'Bem-vindo(a)! 🎉'}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {texto || 'Cadastre seu e-mail e ganhe um desconto especial na primeira compra!'}
                    </p>
                    <form onSubmit={handleSubmit} className="space-y-3">
                      <input
                        type="email"
                        required
                        placeholder="Seu melhor e-mail"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2"
                        style={{ borderColor: corPrimaria + '40', '--tw-ring-color': corPrimaria } as any}
                      />
                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-lg text-white font-semibold text-sm transition-opacity hover:opacity-90"
                        style={{ backgroundColor: corPrimaria }}
                      >
                        Quero o desconto!
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3" style={{ color: corPrimaria }} />
                    <h3 className="text-lg font-bold mb-2">Obrigado! 🎉</h3>
                    {cupom && (
                      <div className="mt-3">
                        <p className="text-sm text-muted-foreground mb-2">Seu cupom de desconto:</p>
                        <button
                          onClick={handleCopy}
                          className="inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg font-mono font-bold text-lg"
                          style={{ borderColor: corPrimaria, color: corPrimaria }}
                        >
                          {cupom}
                          {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
