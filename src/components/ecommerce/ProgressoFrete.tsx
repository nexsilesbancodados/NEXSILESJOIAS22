import { motion } from 'framer-motion';
import { Truck, PartyPopper } from 'lucide-react';

interface ProgressoFreteProps {
  subtotal: number;
  freteGratisAcima: number;
  corPrimaria?: string;
}

export function ProgressoFrete({ subtotal, freteGratisAcima, corPrimaria = '#B76E79' }: ProgressoFreteProps) {
  if (!freteGratisAcima || freteGratisAcima <= 0) return null;

  const progress = Math.min((subtotal / freteGratisAcima) * 100, 100);
  const falta = Math.max(freteGratisAcima - subtotal, 0);
  const atingiu = progress >= 100;

  return (
    <div className="p-3 rounded-lg border bg-muted/30">
      {atingiu ? (
        <div className="flex items-center gap-2 text-green-600">
          <PartyPopper className="w-4 h-4" />
          <span className="text-sm font-semibold">🎉 Você ganhou frete grátis!</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Truck className="w-4 h-4 shrink-0" />
          <span>Faltam <strong style={{ color: corPrimaria }}>R$ {falta.toFixed(2)}</strong> para frete grátis!</span>
        </div>
      )}
      <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: atingiu ? '#22c55e' : corPrimaria }}
        />
      </div>
    </div>
  );
}
