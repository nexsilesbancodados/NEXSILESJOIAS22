import { memo, useMemo } from 'react';
import { 
  Lightbulb, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  Sparkles,
  Package,
  DollarSign,
  Users,
  ArrowUpRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Venda {
  created_at: string;
  total: number;
}

interface Peca {
  nome: string;
  estoque: number;
  preco: number;
  categoria: string | null;
}

interface Romaneio {
  created_at: string;
  total: number;
  status: string;
}

interface InsightsCardProps {
  vendas: Venda[];
  pecas: Peca[];
  romaneios: Romaneio[];
}

interface Insight {
  type: 'success' | 'warning' | 'info' | 'tip';
  icon: React.ElementType;
  title: string;
  description: string;
}

export const InsightsCard = memo(function InsightsCard({ vendas, pecas, romaneios }: InsightsCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Generate dynamic insights with null safety
  const generateInsights = (): Insight[] => {
    const safeVendas = vendas || [];
    const safePecas = pecas || [];
    const safeRomaneios = romaneios || [];
    
    const insights: Insight[] = [];
    const now = new Date();
    const thisMonth = now.getMonth();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const thisYear = now.getFullYear();
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    // Sales comparison
    const vendasMesAtual = safeVendas.filter(v => {
      if (!v?.created_at) return false;
      const d = new Date(v.created_at);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    });
    const vendasMesAnterior = safeVendas.filter(v => {
      if (!v?.created_at) return false;
      const d = new Date(v.created_at);
      return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
    });

    const totalMesAtual = vendasMesAtual.reduce((acc, v) => acc + Number(v?.total || 0), 0);
    const totalMesAnterior = vendasMesAnterior.reduce((acc, v) => acc + Number(v?.total || 0), 0);

    if (totalMesAnterior > 0) {
      const variacao = ((totalMesAtual - totalMesAnterior) / totalMesAnterior) * 100;
      if (variacao > 0) {
        insights.push({
          type: 'success',
          icon: TrendingUp,
          title: `Vendas cresceram ${variacao.toFixed(0)}%`,
          description: `Comparado ao mês anterior (${formatCurrency(totalMesAnterior)})`,
        });
      } else if (variacao < -10) {
        insights.push({
          type: 'warning',
          icon: TrendingDown,
          title: `Vendas caíram ${Math.abs(variacao).toFixed(0)}%`,
          description: 'Considere ações promocionais para impulsionar as vendas',
        });
      }
    }

    // Low stock products
    const pecasEstoqueBaixo = safePecas.filter(p => p && (p.estoque || 0) <= 5 && (p.estoque || 0) > 0);
    if (pecasEstoqueBaixo.length > 0) {
      insights.push({
        type: 'warning',
        icon: Package,
        title: `${pecasEstoqueBaixo.length} peças com estoque baixo`,
        description: 'Considere fazer reposição para evitar falta de produtos',
      });
    }

    // Out of stock
    const pecasSemEstoque = safePecas.filter(p => p && (p.estoque || 0) === 0);
    if (pecasSemEstoque.length > 0) {
      insights.push({
        type: 'warning',
        icon: AlertCircle,
        title: `${pecasSemEstoque.length} peças sem estoque`,
        description: 'Produtos esgotados podem estar causando perda de vendas',
      });
    }

    // Best selling category insight
    const categorias = safePecas.reduce((acc, p) => {
      if (!p) return acc;
      const cat = p.categoria || 'Sem Categoria';
      if (!acc[cat]) acc[cat] = 0;
      acc[cat] += p.estoque;
      return acc;
    }, {} as Record<string, number>);

    const categoriaMaisEstoque = Object.entries(categorias)
      .sort((a, b) => b[1] - a[1])[0];

    if (categoriaMaisEstoque) {
      insights.push({
        type: 'info',
        icon: Sparkles,
        title: `"${categoriaMaisEstoque[0]}" é sua maior categoria`,
        description: `${categoriaMaisEstoque[1]} peças em estoque nesta categoria`,
      });
    }

    // Reseller performance
    const romaneiosConfirmados = safeRomaneios.filter(r => r?.status === 'confirmado');
    const totalRevendedoras = romaneiosConfirmados.reduce((acc, r) => acc + Number(r?.total || 0), 0);
    
    if (totalRevendedoras > 0 && safeVendas.length > 0) {
      const percentualRevendedoras = (totalRevendedoras / (totalMesAtual + totalRevendedoras)) * 100;
      if (percentualRevendedoras > 30) {
        insights.push({
          type: 'success',
          icon: Users,
          title: `Revendedoras representam ${percentualRevendedoras.toFixed(0)}% das vendas`,
          description: 'Seu programa de revendedoras está performando bem!',
        });
      }
    }

    // Average ticket
    if (safeVendas.length > 0) {
      const ticketMedio = safeVendas.reduce((acc, v) => acc + Number(v?.total || 0), 0) / safeVendas.length;
      insights.push({
        type: 'info',
        icon: DollarSign,
        title: `Ticket médio: ${formatCurrency(ticketMedio)}`,
        description: 'Valor médio por venda realizada',
      });
    }

    return insights.slice(0, 4);
  };

  const insights = useMemo(() => generateInsights(), [vendas, pecas, romaneios]);

  const getTypeStyles = (type: Insight['type']) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-white/20',
          icon: 'text-white',
          border: 'border-white/20'
        };
      case 'warning':
        return {
          bg: 'bg-white/20',
          icon: 'text-white',
          border: 'border-white/20'
        };
      case 'info':
        return {
          bg: 'bg-white/20',
          icon: 'text-white',
          border: 'border-white/20'
        };
      case 'tip':
        return {
          bg: 'bg-white/20',
          icon: 'text-white',
          border: 'border-white/20'
        };
    }
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-purple-500 via-purple-600 to-violet-600 rounded-2xl p-5 shadow-sm transition-all duration-300 hover:shadow-lg">
      {/* Decorative wave pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg 
          className="absolute bottom-0 left-0 right-0 w-full h-24 opacity-40"
          viewBox="0 0 400 100" 
          preserveAspectRatio="none"
        >
          <path
            d="M0 60 C 80 40, 120 80, 200 50 C 280 20, 320 70, 400 40 L 400 100 L 0 100 Z"
            fill="rgba(255,255,255,0.15)"
          />
          <path
            d="M0 75 C 60 60, 140 90, 200 65 C 260 40, 340 85, 400 55 L 400 100 L 0 100 Z"
            fill="rgba(255,255,255,0.15)"
          />
        </svg>
      </div>

      {/* Header */}
      <div className="relative flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Insights</h3>
            <p className="text-xs text-white/60">Análises automáticas</p>
          </div>
        </div>
        <button className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/20 hover:bg-white/30 text-white transition-colors">
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>
      
      <div className="relative space-y-2">
        {insights.length > 0 ? (
          insights.map((insight, index) => {
            const styles = getTypeStyles(insight.type);
            return (
              <div 
                key={index}
                className={cn("flex items-start gap-3 p-3 rounded-xl border backdrop-blur-sm", styles.bg, styles.border)}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <insight.icon className={cn("w-4 h-4", styles.icon)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{insight.title}</p>
                  <p className="text-xs text-white/70 mt-0.5">{insight.description}</p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-6">
            <Lightbulb className="w-10 h-10 mx-auto mb-2 text-white/30" />
            <p className="text-sm text-white/60">Continue vendendo para gerar insights</p>
          </div>
        )}
      </div>
    </div>
  );
});