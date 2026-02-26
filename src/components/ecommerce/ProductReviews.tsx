import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-db';
import { Star, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface Review {
  id: string;
  cliente_nome: string;
  nota: number;
  comentario: string | null;
  created_at: string;
}

interface ProductReviewsProps {
  pecaId: string;
  organizationId: string;
  roseGold: string;
  textDark: string;
  textMuted: string;
}

export function ProductReviews({ pecaId, organizationId, roseGold, textDark, textMuted }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ nome: '', email: '', nota: 5, comentario: '' });

  useEffect(() => {
    loadReviews();
  }, [pecaId]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('fetch_avaliacoes_produto', { p_peca_id: pecaId });
      if (!error) setReviews((data || []) as Review[]);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    if (!form.nome.trim()) { toast.error('Informe seu nome'); return; }
    if (form.nota < 1 || form.nota > 5) { toast.error('Selecione uma nota'); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc('submeter_avaliacao', {
        p_organization_id: organizationId,
        p_peca_id: pecaId,
        p_cliente_nome: form.nome,
        p_cliente_email: form.email || null,
        p_nota: form.nota,
        p_comentario: form.comentario || null,
      });
      if (error) throw error;
      toast.success('Avaliação enviada! ⭐');
      setForm({ nome: '', email: '', nota: 5, comentario: '' });
      setShowForm(false);
      loadReviews();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar avaliação');
    } finally { setSubmitting(false); }
  };

  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.nota, 0) / reviews.length : 0;

  const StarRating = ({ rating, interactive, onRate }: { rating: number; interactive?: boolean; onRate?: (n: number) => void }) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => interactive && onRate?.(n)}
          className={interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}
          disabled={!interactive}
        >
          <Star
            className="w-4 h-4"
            fill={n <= rating ? '#F5A623' : 'none'}
            stroke={n <= rating ? '#F5A623' : '#D0D0D0'}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );

  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="mt-6 border-t pt-4" style={{ borderColor: '#F0E6E0' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h4 className="text-xs uppercase tracking-[0.15em] font-semibold" style={{ color: textDark, fontFamily: "'Inter', sans-serif" }}>
            Avaliações
          </h4>
          {reviews.length > 0 && (
            <span className="text-[10px] px-2 py-0.5" style={{ backgroundColor: '#FFF8E1', color: '#F5A623', fontFamily: "'Inter', sans-serif" }}>
              ⭐ {avgRating.toFixed(1)} ({reviews.length})
            </span>
          )}
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-[10px] uppercase tracking-wider underline hover:opacity-70"
            style={{ color: roseGold, fontFamily: "'Inter', sans-serif" }}
          >
            Avaliar
          </button>
        )}
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="p-3 border space-y-2.5" style={{ borderColor: '#F0E6E0', backgroundColor: '#FDFBF9' }}>
              <div className="flex items-center gap-3">
                <span className="text-[10px] uppercase tracking-wider" style={{ color: textMuted, fontFamily: "'Inter', sans-serif" }}>Nota:</span>
                <StarRating rating={form.nota} interactive onRate={n => setForm(p => ({ ...p, nota: n }))} />
              </div>
              <input
                type="text" placeholder="Seu nome *" value={form.nome}
                onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
                className="w-full px-2 py-1.5 text-xs border outline-none"
                style={{ borderColor: '#E0D5CF', fontFamily: "'Inter', sans-serif" }}
              />
              <input
                type="email" placeholder="E-mail (opcional)" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="w-full px-2 py-1.5 text-xs border outline-none"
                style={{ borderColor: '#E0D5CF', fontFamily: "'Inter', sans-serif" }}
              />
              <textarea
                placeholder="Conte sua experiência (opcional)" value={form.comentario}
                onChange={e => setForm(p => ({ ...p, comentario: e.target.value }))}
                rows={2}
                className="w-full px-2 py-1.5 text-xs border outline-none resize-none"
                style={{ borderColor: '#E0D5CF', fontFamily: "'Inter', sans-serif" }}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSubmit} disabled={submitting}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-[10px] uppercase tracking-wider text-white disabled:opacity-50"
                  style={{ backgroundColor: roseGold, fontFamily: "'Inter', sans-serif" }}
                >
                  {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  Enviar
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="px-3 py-1.5 text-[10px] uppercase tracking-wider border"
                  style={{ borderColor: '#E0D5CF', color: textMuted, fontFamily: "'Inter', sans-serif" }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reviews list */}
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin" style={{ color: roseGold }} />
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-xs text-center py-3" style={{ color: textMuted, fontFamily: "'Inter', sans-serif" }}>
          Seja a primeira a avaliar este produto! ✨
        </p>
      ) : (
        <div className="space-y-3 max-h-48 overflow-y-auto">
          {reviews.map((review, i) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="pb-2.5 border-b last:border-0"
              style={{ borderColor: '#F0E6E0' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                    style={{ backgroundColor: roseGold }}
                  >
                    {review.cliente_nome.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-medium" style={{ color: textDark, fontFamily: "'Inter', sans-serif" }}>
                    {review.cliente_nome}
                  </span>
                </div>
                <span className="text-[9px]" style={{ color: textMuted, fontFamily: "'Inter', sans-serif" }}>
                  {formatDate(review.created_at)}
                </span>
              </div>
              <div className="mt-1 ml-8">
                <StarRating rating={review.nota} />
                {review.comentario && (
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: textMuted, fontFamily: "'Inter', sans-serif" }}>
                    {review.comentario}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
