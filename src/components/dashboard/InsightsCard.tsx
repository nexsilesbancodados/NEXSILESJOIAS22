import { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Lightbulb, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  Sparkles,
  Package,
  DollarSign,
  Users
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
        return 'bg-gradient-to-br from-emerald-400 to-green-500 text-white';
      case 'warning':
        return 'bg-gradient-to-br from-amber-400 to-orange-500 text-white';
      case 'info':
        return 'bg-gradient-to-br from-blue-400 to-indigo-500 text-white';
      case 'tip':
        return 'bg-gradient-to-br from-violet-400 to-purple-500 text-white';
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-purple-600 p-5 shadow-lg">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/20" />
        <div className="absolute -left-4 -bottom-4 w-24 h-24 rounded-full bg-white/10" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Lightbulb className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Insights</h3>
            <p className="text-sm text-white/70">Análises automáticas</p>
          </div>
        </div>
        
        <div className="space-y-2">
          {insights.length > 0 ? (
            insights.map((insight, index) => (
              <div 
                key={index}
                className="flex items-start gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm"
              >
                <div className="flex-shrink-0 mt-0.5">
                  <insight.icon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{insight.title}</p>
                  <p className="text-xs text-white/70 mt-0.5">{insight.description}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6">
              <Lightbulb className="w-10 h-10 mx-auto mb-2 text-white/30" />
              <p className="text-sm text-white/70">Continue vendendo para gerar insights</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});