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

  // Generate dynamic insights
  const generateInsights = (): Insight[] => {
    const insights: Insight[] = [];
    const now = new Date();
    const thisMonth = now.getMonth();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const thisYear = now.getFullYear();
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    // Sales comparison
    const vendasMesAtual = vendas.filter(v => {
      const d = new Date(v.created_at);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    });
    const vendasMesAnterior = vendas.filter(v => {
      const d = new Date(v.created_at);
      return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
    });

    const totalMesAtual = vendasMesAtual.reduce((acc, v) => acc + Number(v.total), 0);
    const totalMesAnterior = vendasMesAnterior.reduce((acc, v) => acc + Number(v.total), 0);

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
    const pecasEstoqueBaixo = pecas.filter(p => p.estoque <= 5 && p.estoque > 0);
    if (pecasEstoqueBaixo.length > 0) {
      insights.push({
        type: 'warning',
        icon: Package,
        title: `${pecasEstoqueBaixo.length} peças com estoque baixo`,
        description: 'Considere fazer reposição para evitar falta de produtos',
      });
    }

    // Out of stock
    const pecasSemEstoque = pecas.filter(p => p.estoque === 0);
    if (pecasSemEstoque.length > 0) {
      insights.push({
        type: 'warning',
        icon: AlertCircle,
        title: `${pecasSemEstoque.length} peças sem estoque`,
        description: 'Produtos esgotados podem estar causando perda de vendas',
      });
    }

    // Best selling category insight
    const categorias = pecas.reduce((acc, p) => {
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
    const romaneiosConfirmados = romaneios.filter(r => r.status === 'confirmado');
    const totalRevendedoras = romaneiosConfirmados.reduce((acc, r) => acc + Number(r.total), 0);
    
    if (totalRevendedoras > 0 && vendas.length > 0) {
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
    if (vendas.length > 0) {
      const ticketMedio = vendas.reduce((acc, v) => acc + Number(v.total), 0) / vendas.length;
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
          bg: 'bg-emerald-50 dark:bg-emerald-900/20',
          icon: 'text-emerald-500',
          border: 'border-emerald-100 dark:border-emerald-800/30'
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 dark:bg-amber-900/20',
          icon: 'text-amber-500',
          border: 'border-amber-100 dark:border-amber-800/30'
        };
      case 'info':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          icon: 'text-blue-500',
          border: 'border-blue-100 dark:border-blue-800/30'
        };
      case 'tip':
        return {
          bg: 'bg-purple-50 dark:bg-purple-900/20',
          icon: 'text-purple-500',
          border: 'border-purple-100 dark:border-purple-800/30'
        };
    }
  };

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Insights</h3>
            <p className="text-xs text-muted-foreground">Análises automáticas</p>
          </div>
        </div>
        <button className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted hover:bg-muted/80 text-muted-foreground transition-colors">
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>
      
      <div className="space-y-2">
        {insights.length > 0 ? (
          insights.map((insight, index) => {
            const styles = getTypeStyles(insight.type);
            return (
              <div 
                key={index}
                className={cn("flex items-start gap-3 p-3 rounded-xl border", styles.bg, styles.border)}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <insight.icon className={cn("w-4 h-4", styles.icon)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{insight.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{insight.description}</p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-6">
            <Lightbulb className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Continue vendendo para gerar insights</p>
          </div>
        )}
      </div>
    </div>
  );
});
