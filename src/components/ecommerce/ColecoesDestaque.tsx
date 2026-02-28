import { motion } from 'framer-motion';

interface Colecao {
  id: string;
  titulo: string;
  imagem_url: string;
  categoria_filtro: string;
  ordem?: number;
  ativo?: boolean;
}

interface ColecoesDestaqueProps {
  colecoes: Colecao[];
  categorias?: string[];
  produtos?: { categoria: string | null; imagem_url: string | null }[];
  fontTitulos?: string;
  corPrimaria?: string;
  onCategoriaClick: (categoria: string) => void;
}

export function ColecoesDestaque({ colecoes, categorias, produtos, fontTitulos, corPrimaria, onCategoriaClick }: ColecoesDestaqueProps) {
  const activeColecoes = colecoes?.filter(c => c.ativo !== false).sort((a, b) => (a.ordem || 0) - (b.ordem || 0)) || [];

  // Fallback: gerar coleções automáticas a partir das categorias
  const displayColecoes = activeColecoes.length > 0 ? activeColecoes : (categorias || []).map((cat, i) => {
    const prod = produtos?.find(p => p.categoria === cat && p.imagem_url);
    return {
      id: `auto-${i}`,
      titulo: cat,
      imagem_url: prod?.imagem_url || '',
      categoria_filtro: cat,
      ordem: i,
    };
  }).filter(c => c.imagem_url);

  if (displayColecoes.length === 0) return null;

  return (
    <section className="py-12 px-4 md:px-8">
      <h2
        className="text-2xl md:text-3xl font-bold text-center mb-8"
        style={{ fontFamily: fontTitulos, color: corPrimaria }}
      >
        Compre por Categoria
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
        {displayColecoes.map((col, i) => (
          <motion.button
            key={col.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            onClick={() => onCategoriaClick(col.categoria_filtro)}
            className="group relative aspect-square rounded-xl overflow-hidden"
          >
            <img
              src={col.imagem_url}
              alt={col.titulo}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <span className="absolute bottom-3 left-3 right-3 text-white font-semibold text-sm md:text-base drop-shadow-lg">
              {col.titulo}
            </span>
          </motion.button>
        ))}
      </div>
    </section>
  );
}
