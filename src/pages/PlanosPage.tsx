import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Crown, 
  Check, 
  X, 
  Sparkles, 
  Zap,
  Package,
  Users,
  FileText,
  BarChart3,
  MessageSquare,
  Bot,
  Headphones,
  Star,
  ArrowRight
} from 'lucide-react';
import { useAssinatura, PLANOS } from '@/hooks/useAssinatura';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const FEATURES = [
  { 
    name: 'Gestão de Peças e Estoque', 
    icon: Package,
    nexsiles: true, 
    nexsiles_max: true,
    description: 'Controle completo do seu inventário'
  },
  { 
    name: 'Controle de Vendas (PDV)', 
    icon: FileText,
    nexsiles: true, 
    nexsiles_max: true,
    description: 'Ponto de venda integrado'
  },
  { 
    name: 'Gestão de Revendedoras', 
    icon: Users,
    nexsiles: true, 
    nexsiles_max: true,
    description: 'Maletas, comissões e acompanhamento'
  },
  { 
    name: 'Catálogos Digitais', 
    icon: FileText,
    nexsiles: true, 
    nexsiles_max: true,
    description: 'Compartilhe seus produtos online'
  },
  { 
    name: 'Relatórios Básicos', 
    icon: BarChart3,
    nexsiles: true, 
    nexsiles_max: true,
    description: 'Vendas, estoque e desempenho'
  },
  { 
    name: 'Relatórios Avançados', 
    icon: BarChart3,
    nexsiles: false, 
    nexsiles_max: true,
    description: 'Análises detalhadas e previsões'
  },
  { 
    name: 'Atendente de IA Integrado', 
    icon: Bot,
    nexsiles: false, 
    nexsiles_max: true,
    description: 'Assistente inteligente para sua loja',
    highlight: true
  },
  { 
    name: 'Chatbot WhatsApp Automatizado', 
    icon: MessageSquare,
    nexsiles: false, 
    nexsiles_max: true,
    description: 'Atendimento 24h via WhatsApp',
    highlight: true
  },
  { 
    name: 'Suporte Prioritário', 
    icon: Headphones,
    nexsiles: false, 
    nexsiles_max: true,
    description: 'Atendimento preferencial'
  },
];

export default function PlanosPage() {
  const { assinatura, planoInfo } = useAssinatura();
  const [isAnual, setIsAnual] = useState(false);

  const getPrecoComDesconto = (preco: number) => {
    if (isAnual) {
      return (preco * 12 * 0.8) / 12; // 20% de desconto anual
    }
    return preco;
  };

  const planoAtual = assinatura?.plano;

  return (
    <MainLayout>
      <div className="min-h-screen">
        <PageHeader
          icon={Crown}
          title="Escolha seu Plano"
          subtitle="Selecione o plano ideal para o seu negócio"
        />

        {/* Toggle Mensal/Anual */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <Label htmlFor="billing-toggle" className={cn(!isAnual && 'text-foreground font-semibold')}>
            Mensal
          </Label>
          <Switch
            id="billing-toggle"
            checked={isAnual}
            onCheckedChange={setIsAnual}
          />
          <div className="flex items-center gap-2">
            <Label htmlFor="billing-toggle" className={cn(isAnual && 'text-foreground font-semibold')}>
              Anual
            </Label>
            {isAnual && (
              <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                20% OFF
              </Badge>
            )}
          </div>
        </div>

        {/* Cards de Planos */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
          {/* Plano Nexsiles */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className={cn(
              "relative overflow-hidden transition-all duration-300 hover:shadow-lg",
              planoAtual === 'nexsiles' && "ring-2 ring-primary"
            )}>
              {planoAtual === 'nexsiles' && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-primary text-primary-foreground">
                    Seu Plano Atual
                  </Badge>
                </div>
              )}
              
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">{PLANOS.nexsiles.nome}</CardTitle>
                </div>
                <CardDescription className="text-base">
                  {PLANOS.nexsiles.descricao}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground">
                      R$ {getPrecoComDesconto(PLANOS.nexsiles.valor).toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  {isAnual && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Cobrado R$ {(PLANOS.nexsiles.valor * 12 * 0.8).toFixed(2).replace('.', ',')} anualmente
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-6">
                  {PLANOS.nexsiles.recursos.map((recurso, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-success/10 flex items-center justify-center">
                        <Check className="w-3 h-3 text-success" />
                      </div>
                      <span className="text-sm text-muted-foreground">{recurso}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className="w-full" 
                  variant={planoAtual === 'nexsiles' ? 'outline' : 'default'}
                  disabled={planoAtual === 'nexsiles'}
                >
                  {planoAtual === 'nexsiles' ? 'Plano Atual' : 'Escolher Nexsiles'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Plano Nexsiles Max */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className={cn(
              "relative overflow-hidden transition-all duration-300 hover:shadow-lg border-2",
              planoAtual === 'nexsiles_max' 
                ? "ring-2 ring-warning border-warning/50" 
                : "border-warning/30"
            )}>
              {/* Ribbon de destaque */}
              <div className="absolute -right-12 top-6 rotate-45 bg-gradient-to-r from-warning to-warning/80 text-warning-foreground text-xs font-semibold px-12 py-1">
                MAIS POPULAR
              </div>

              {planoAtual === 'nexsiles_max' && (
                <div className="absolute top-4 left-4">
                  <Badge className="bg-warning text-warning-foreground">
                    Seu Plano Atual
                  </Badge>
                </div>
              )}
              
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-xl bg-warning/20">
                    <Sparkles className="w-6 h-6 text-warning" />
                  </div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    {PLANOS.nexsiles_max.nome}
                    <Star className="w-5 h-5 text-warning fill-warning" />
                  </CardTitle>
                </div>
                <CardDescription className="text-base">
                  {PLANOS.nexsiles_max.descricao}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground">
                      R$ {getPrecoComDesconto(PLANOS.nexsiles_max.valor).toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  {isAnual && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Cobrado R$ {(PLANOS.nexsiles_max.valor * 12 * 0.8).toFixed(2).replace('.', ',')} anualmente
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-6">
                  {PLANOS.nexsiles_max.recursos.map((recurso, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-warning/10 flex items-center justify-center">
                        <Check className="w-3 h-3 text-warning" />
                      </div>
                      <span className={cn(
                        "text-sm",
                        recurso.includes('IA') || recurso.includes('WhatsApp') 
                          ? 'text-foreground font-medium' 
                          : 'text-muted-foreground'
                      )}>
                        {recurso}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className={cn(
                    "w-full",
                    planoAtual !== 'nexsiles_max' && "btn-gold"
                  )}
                  variant={planoAtual === 'nexsiles_max' ? 'outline' : 'default'}
                  disabled={planoAtual === 'nexsiles_max'}
                >
                  {planoAtual === 'nexsiles_max' ? 'Plano Atual' : (
                    <>
                      Escolher Nexsiles Max
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Tabela Comparativa */}
        <Card className="max-w-5xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Comparativo de Recursos</CardTitle>
            <CardDescription className="text-center">
              Veja todas as funcionalidades disponíveis em cada plano
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-4 px-4 font-medium text-muted-foreground">Recurso</th>
                    <th className="text-center py-4 px-4 w-32">
                      <div className="flex flex-col items-center gap-1">
                        <Zap className="w-5 h-5 text-primary" />
                        <span className="font-semibold text-foreground">Nexsiles</span>
                      </div>
                    </th>
                    <th className="text-center py-4 px-4 w-32">
                      <div className="flex flex-col items-center gap-1">
                        <Sparkles className="w-5 h-5 text-warning" />
                        <span className="font-semibold text-foreground">Max</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {FEATURES.map((feature, index) => (
                    <tr 
                      key={index} 
                      className={cn(
                        "border-b last:border-b-0 transition-colors",
                        feature.highlight && "bg-warning/5"
                      )}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <feature.icon className={cn(
                            "w-5 h-5",
                            feature.highlight ? "text-warning" : "text-muted-foreground"
                          )} />
                          <div>
                            <p className={cn(
                              "font-medium",
                              feature.highlight && "text-warning"
                            )}>
                              {feature.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="text-center py-4 px-4">
                        {feature.nexsiles ? (
                          <div className="flex justify-center">
                            <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center">
                              <Check className="w-4 h-4 text-success" />
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-center">
                            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                              <X className="w-4 h-4 text-muted-foreground" />
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="text-center py-4 px-4">
                        {feature.nexsiles_max ? (
                          <div className="flex justify-center">
                            <div className="w-6 h-6 rounded-full bg-warning/10 flex items-center justify-center">
                              <Check className="w-4 h-4 text-warning" />
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-center">
                            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                              <X className="w-4 h-4 text-muted-foreground" />
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* FAQ ou CTA */}
        <div className="max-w-2xl mx-auto mt-12 text-center">
          <p className="text-muted-foreground mb-4">
            Dúvidas sobre qual plano escolher? Entre em contato conosco!
          </p>
          <Button variant="outline" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            Falar com Suporte
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
