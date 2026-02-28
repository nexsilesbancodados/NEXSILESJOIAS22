import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ShoppingBag, X } from 'lucide-react';

interface TaggedProduct {
  peca_id: string;
  x_pct: number;
  y_pct: number;
}

interface LookbookImage {
  id: string;
  imagem_url: string;
  produtos_tagueados?: TaggedProduct[];
}

interface Peca {
  id: string;
  nome: string;
  preco_venda: number;
  imagem_url: string | null;
}

interface LookbookSectionProps {
  ativo: boolean;
  titulo?: string;
  imagens: LookbookImage[];
  pecas: Peca[];
  fontTitulos?: string;
  corPrimaria?: string;
  onAddToCart?: (peca: Peca) => void;
}

export function LookbookSection({ ativo, titulo, imagens, pecas, fontTitulos, corPrimaria, onAddToCart }: LookbookSectionProps) {
  const [selectedImage, setSelectedImage] = useState<LookbookImage | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  if (!ativo || !imagens || imagens.length === 0) return null;

  const getPeca = (id: string) => pecas.find(p => p.id === id);

  return (
    <>
      <section className="py-12 px-4 md:px-8">
        <h2
          className="text-2xl md:text-3xl font-bold text-center mb-2"
          style={{ fontFamily: fontTitulos, color: corPrimaria }}
        >
          {titulo || 'Lookbook'}
        </h2>
        <div className="w-16 h-0.5 mx-auto mb-8" style={{ backgroundColor: corPrimaria }} />

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-w-6xl mx-auto">
          {imagens.map((img, i) => (
            <motion.button
              key={img.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              onClick={() => setSelectedImage(img)}
              className="group relative aspect-[3/4] rounded-lg overflow-hidden"
            >
              <img src={img.imagem_url} alt="" className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <ShoppingBag className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              {img.produtos_tagueados?.map((tag, ti) => (
                <span
                  key={ti}
                  className="absolute w-3 h-3 bg-white rounded-full animate-ping"
                  style={{ left: `${tag.x_pct}%`, top: `${tag.y_pct}%` }}
                />
              ))}
            </motion.button>
          ))}
        </div>
      </section>

      <Dialog open={!!selectedImage} onOpenChange={() => { setSelectedImage(null); setActiveTag(null); }}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          {selectedImage && (
            <div className="relative">
              <img src={selectedImage.imagem_url} alt="" className="w-full" />
              {selectedImage.produtos_tagueados?.map((tag, i) => {
                const peca = getPeca(tag.peca_id);
                return (
                  <button
                    key={i}
                    onClick={() => setActiveTag(activeTag === tag.peca_id ? null : tag.peca_id)}
                    className="absolute w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${tag.x_pct}%`, top: `${tag.y_pct}%` }}
                  >
                    <ShoppingBag className="w-3 h-3" style={{ color: corPrimaria }} />
                    <AnimatePresence>
                      {activeTag === tag.peca_id && peca && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute top-8 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-xl p-3 w-48 z-10"
                        >
                          <p className="font-semibold text-sm truncate">{peca.nome}</p>
                          <p className="text-sm font-bold mt-1" style={{ color: corPrimaria }}>
                            R$ {peca.preco_venda.toFixed(2)}
                          </p>
                          {onAddToCart && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onAddToCart(peca as any); }}
                              className="mt-2 w-full py-1.5 rounded text-white text-xs font-semibold"
                              style={{ backgroundColor: corPrimaria }}
                            >
                              Adicionar
                            </button>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
