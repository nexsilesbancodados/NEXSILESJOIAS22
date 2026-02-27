import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Bell, MessageSquare, Mail, ShoppingCart, Package, Star, AlertTriangle, Zap, Save } from 'lucide-react';
import { toast } from 'sonner';

interface AutomacaoConfig {
  id: string;
  nome: string;
  descricao: string;
  icon: any;
  ativo: boolean;
  canal: 'whatsapp' | 'email' | 'ambos';
  template?: string;
}

export function EcommerceNotificacoesTab() {
  const [automacoes, setAutomacoes] = useState<AutomacaoConfig[]>([
    { id: 'novo_pedido', nome: 'Novo Pedido', descricao: 'Notificar quando um novo pedido for realizado', icon: ShoppingCart, ativo: true, canal: 'whatsapp', template: 'Olá! Seu pedido #{numero} foi recebido com sucesso. Total: R$ {valor}. Acompanhe pelo link: {link}' },
    { id: 'pedido_enviado', nome: 'Pedido Enviado', descricao: 'Notificar quando o pedido for despachado', icon: Package, ativo: true, canal: 'whatsapp', template: 'Seu pedido #{numero} foi enviado! Código de rastreio: {rastreio}. Acompanhe em: {link_rastreio}' },
    { id: 'pedido_entregue', nome: 'Pedido Entregue', descricao: 'Confirmar entrega e solicitar avaliação', icon: Star, ativo: false, canal: 'whatsapp', template: 'Seu pedido #{numero} foi entregue! 🎉 Avalie sua experiência: {link_avaliacao}' },
    { id: 'carrinho_abandonado', nome: 'Carrinho Abandonado', descricao: 'Lembrar cliente após abandono de carrinho', icon: AlertTriangle, ativo: false, canal: 'whatsapp', template: 'Olá {nome}! Você deixou itens no carrinho. Finalize sua compra com 10% OFF usando o cupom VOLTA10: {link}' },
    { id: 'estoque_baixo', nome: 'Estoque Baixo', descricao: 'Alertar admin quando estoque estiver baixo', icon: AlertTriangle, ativo: true, canal: 'email', template: 'O produto {produto} está com estoque baixo ({quantidade} unidades). Reponha o estoque o quanto antes.' },
    { id: 'avaliacao_recebida', nome: 'Nova Avaliação', descricao: 'Notificar admin sobre novas avaliações', icon: Star, ativo: false, canal: 'email', template: 'Nova avaliação de {cliente}: {nota}⭐ para {produto}. "{comentario}"' },
  ]);

  const toggleAutomacao = (id: string) => {
    setAutomacoes(prev => prev.map(a => a.id === id ? { ...a, ativo: !a.ativo } : a));
  };

  const updateTemplate = (id: string, template: string) => {
    setAutomacoes(prev => prev.map(a => a.id === id ? { ...a, template } : a));
  };

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleSave = () => {
    toast.success('Configurações de notificações salvas!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex items-start gap-3">
          <Zap className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="text-sm font-medium">Automações & Notificações</p>
            <p className="text-xs text-muted-foreground mt-1">
              Configure notificações automáticas por WhatsApp e e-mail para manter seus clientes informados sobre pedidos, entregas e promoções.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Automações */}
      <div className="space-y-3">
        {automacoes.map((auto) => {
          const Icon = auto.icon;
          const isExpanded = expandedId === auto.id;
          return (
            <Card key={auto.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : auto.id)}
                >
                  <div className="p-2 rounded-lg bg-muted">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{auto.nome}</p>
                      <Badge variant="outline" className="text-[10px]">
                        {auto.canal === 'whatsapp' ? '📱 WhatsApp' : auto.canal === 'email' ? '📧 E-mail' : '📱📧 Ambos'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{auto.descricao}</p>
                  </div>
                  <Switch
                    checked={auto.ativo}
                    onCheckedChange={() => toggleAutomacao(auto.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 border-t bg-muted/10">
                    <div className="pt-4 space-y-3">
                      <div>
                        <Label className="text-xs">Template da mensagem</Label>
                        <Textarea
                          value={auto.template || ''}
                          onChange={(e) => updateTemplate(auto.id, e.target.value)}
                          className="mt-1 text-xs min-h-[80px]"
                          placeholder="Use variáveis como {nome}, {numero}, {valor}..."
                        />
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Variáveis disponíveis: {'{nome}'}, {'{numero}'}, {'{valor}'}, {'{produto}'}, {'{link}'}, {'{rastreio}'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Button onClick={handleSave} className="w-full">
        <Save className="h-4 w-4 mr-2" />
        Salvar Configurações
      </Button>
    </div>
  );
}
