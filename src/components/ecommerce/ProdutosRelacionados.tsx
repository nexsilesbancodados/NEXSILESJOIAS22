import { motion } from 'framer-motion';

interface Peca {
  id: string;
  nome: string;
  preco_venda: number;
  imagem_url: string | null;
  categoria: string | null;
}

interface ProdutosRelacionadosProps {
  pecaAtual: Peca;
  todasPecas: Peca[];
  fontTitulos?: string;
  corPrimaria?: string;
  onSelect: (peca: Peca) => void;
}

export function ProdutosRelacionados({ pecaAtual, todasPecas, fontTitulos, corPrimaria, onSelect }: ProdutosRelacionadosProps) {
  const relacionados = todasPecas
    .filter(p => p.id !== pecaAtual.id && p.categoria === pecaAtual.categoria)
    .slice(0, 4);

  if (relacionados.length === 0) return null;

  return (
    <div className="mt-6 pt-6 border-t">
      <h4 className="text-lg font-semibold mb-4" style={{ fontFamily: fontTitulos, color: corPrimaria }}>
        Você também pode gostar
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {relacionados.map((peca, i) => (
          <motion.button
            key={peca.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => onSelect(peca)}
            className="group text-left rounded-lg overflow-hidden border hover:shadow-md transition-shadow"
          >
            {peca.imagem_url ? (
              <img src={peca.imagem_url} alt={peca.nome} className="w-full aspect-square object-cover" loading="lazy" />
            ) : (
              <div className="w-full aspect-square bg-muted flex items-center justify-center text-muted-foreground text-xs">
                Sem foto
              </div>
            )}
            <div className="p-2">
              <p className="text-xs font-medium truncate">{peca.nome}</p>
              <p className="text-sm font-bold" style={{ color: corPrimaria }}>
                R$ {peca.preco_venda.toFixed(2)}
              </p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
