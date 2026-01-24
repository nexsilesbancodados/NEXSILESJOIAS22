import { memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-db';

const db = supabase;

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShoppingBag,
  Package,
  History,
  MessageCircle,
  CheckCircle,
  Clock,
  XCircle,
  Copy
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PedidoTimeline } from './PedidoTimeline';

interface PedidoCatalogo {
  id: string;
  catalogo_id: string;
  cliente_nome: string;
  cliente_telefone: string | null;
  cliente_email: string | null;
  endereco?: string | null;
  total: number;
  status: string;
  observacoes: string | null;
  created_at: string;
  updated_at?: string;
  endereco_logradouro?: string | null;
  endereco_numero?: string | null;
  endereco_complemento?: string | null;
  endereco_bairro?: string | null;
  endereco_cidade?: string | null;
  endereco_estado?: string | null;
  endereco_cep?: string | null;
  catalogo?: {
    nome: string;
  };
}

interface PedidoCatalogoItem {
  id: string;
  pedido_id: string;
  peca_id: string;
  peca_nome: string;
  peca_codigo: string;
  quantidade: number;
  preco_unitario: number;
  created_at: string;
}

const STATUS_CONFIG = {
  pendente: { label: 'Pendente', color: 'bg-yellow-500/20 text-yellow-600', icon: Clock },
  confirmado: { label: 'Vendido', color: 'bg-green-500/20 text-green-600', icon: CheckCircle },
  cancelado: { label: 'Cancelado', color: 'bg-red-500/20 text-red-600', icon: XCircle },
};

interface PedidoDetailsDialogProps {
  pedido: PedidoCatalogo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkAsSold?: () => void;
  onCancel?: () => void;
}

export const PedidoDetailsDialog = memo(function PedidoDetailsDialog({
  pedido,
  open,
  onOpenChange,
  onMarkAsSold,
  onCancel,
}: PedidoDetailsDialogProps) {
  const { data: pedidoItens = [], isLoading: loadingItens } = useQuery({
    queryKey: ['pedido-itens-details', pedido?.id],
    queryFn: async () => {
      if (!pedido) return [];
      const { data, error } = await db
        .from('pedidos_catalogo_itens')
        .select('*')
        .eq('pedido_id', pedido.id);
      if (error) throw error;
      return data as PedidoCatalogoItem[];
    },
    enabled: !!pedido && open,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const generateReceipt = () => {
    if (!pedido) return '';
    
    const lines: string[] = [];
    lines.push('🧾 *COMPROVANTE DE VENDA*');
    lines.push('');
    lines.push(`📅 Data: ${format(new Date(pedido.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`);
    lines.push('');
    lines.push(`👤 Cliente: ${pedido.cliente_nome}`);
    if (pedido.cliente_telefone) {
      lines.push(`📱 Tel: ${pedido.cliente_telefone}`);
    }
    lines.push('');
    lines.push('*Itens:*');
    lines.push('─────────────────');
    
    pedidoItens.forEach((item) => {
      lines.push(`• ${item.peca_nome}`);
      lines.push(`  Cód: ${item.peca_codigo}`);
      lines.push(`  ${item.quantidade}x ${formatCurrency(item.preco_unitario)} = ${formatCurrency(item.preco_unitario * item.quantidade)}`);
    });
    
    lines.push('─────────────────');
    lines.push(`*TOTAL: ${formatCurrency(pedido.total)}*`);
    lines.push('');
    lines.push('Obrigado pela preferência! ✨');
    
    return lines.join('\n');
  };

  const sendWhatsAppReceipt = () => {
    if (!pedido?.cliente_telefone) {
      toast.error('Cliente não possui telefone cadastrado');
      return;
    }

    const receipt = generateReceipt();
    const phone = pedido.cliente_telefone.replace(/\D/g, '');
    const phoneWithCountry = phone.startsWith('55') ? phone : `55${phone}`;
    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(receipt)}`;
    window.open(url, '_blank');
  };

  const copyReceipt = async () => {
    try {
      await navigator.clipboard.writeText(generateReceipt());
      toast.success('Comprovante copiado!');
    } catch {
      toast.error('Erro ao copiar');
    }
  };

  const statusConfig = pedido ? STATUS_CONFIG[pedido.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pendente : STATUS_CONFIG.pendente;
  const StatusIcon = statusConfig.icon;

  const hasAddress = pedido && (
    pedido.endereco_logradouro || 
    pedido.endereco_cidade || 
    pedido.endereco_cep
  );

  if (!pedido) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">Pedido #{pedido.id.slice(0, 8)}</DialogTitle>
              <DialogDescription>
                {format(new Date(pedido.created_at), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </DialogDescription>
            </div>
            <Badge className={cn('text-sm', statusConfig.color)}>
              <StatusIcon className="w-4 h-4 mr-1" />
              {statusConfig.label}
            </Badge>
          </div>
        </DialogHeader>

        <Tabs defaultValue="detalhes" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="detalhes" className="flex-1 gap-2">
              <Package className="w-4 h-4" />
              Detalhes
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex-1 gap-2">
              <History className="w-4 h-4" />
              Timeline
            </TabsTrigger>
          </TabsList>

          <TabsContent value="detalhes" className="mt-4">
            <ScrollArea className="h-[50vh] pr-4">
              <div className="space-y-6">
                {/* Customer Info */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Dados do Cliente
                  </h4>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{pedido.cliente_nome}</p>
                        {pedido.catalogo && (
                          <p className="text-sm text-muted-foreground">
                            via {pedido.catalogo.nome}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      {pedido.cliente_telefone && (
                        <a 
                          href={`tel:${pedido.cliente_telefone}`}
                          className="flex items-center gap-2 text-primary hover:underline"
                        >
                          <Phone className="w-4 h-4" />
                          {pedido.cliente_telefone}
                        </a>
                      )}
                      {pedido.cliente_email && (
                        <a 
                          href={`mailto:${pedido.cliente_email}`}
                          className="flex items-center gap-2 text-primary hover:underline"
                        >
                          <Mail className="w-4 h-4" />
                          {pedido.cliente_email}
                        </a>
                      )}
                    </div>

                    {hasAddress && (
                      <div className="pt-2 border-t border-border/50">
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p>
                              {pedido.endereco_logradouro}
                              {pedido.endereco_numero && `, ${pedido.endereco_numero}`}
                              {pedido.endereco_complemento && ` - ${pedido.endereco_complemento}`}
                            </p>
                            <p className="text-muted-foreground">
                              {pedido.endereco_bairro && `${pedido.endereco_bairro}, `}
                              {pedido.endereco_cidade}
                              {pedido.endereco_estado && ` - ${pedido.endereco_estado}`}
                              {pedido.endereco_cep && ` • ${pedido.endereco_cep}`}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    Itens do Pedido ({pedidoItens.length})
                  </h4>
                  {loadingItens ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {pedidoItens.map((item) => (
                        <div 
                          key={item.id} 
                          className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Package className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{item.peca_nome}</p>
                              <p className="text-xs text-muted-foreground">
                                Código: {item.peca_codigo}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              {item.quantidade}x {formatCurrency(item.preco_unitario)}
                            </p>
                            <p className="font-semibold text-primary">
                              {formatCurrency(item.preco_unitario * item.quantidade)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Totals */}
                <div className="bg-primary/5 rounded-lg p-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(pedido.total)}</span>
                  </div>
                </div>

                {/* Observations */}
                {pedido.observacoes && (
                  <div>
                    <h4 className="font-semibold mb-2">Observações</h4>
                    <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
                      {pedido.observacoes}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="timeline" className="mt-4">
            <ScrollArea className="h-[50vh] pr-4">
              <PedidoTimeline
                status={pedido.status}
                createdAt={pedido.created_at}
              />
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-4 border-t">
          {pedido.status === 'pendente' && (
            <>
              <Button 
                className="gap-2 bg-green-600 hover:bg-green-700"
                onClick={onMarkAsSold}
              >
                <CheckCircle className="w-4 h-4" />
                Marcar como Vendido
              </Button>
              <Button 
                variant="outline"
                className="gap-2"
                onClick={onCancel}
              >
                <XCircle className="w-4 h-4" />
                Cancelar Pedido
              </Button>
            </>
          )}

          {pedido.status === 'confirmado' && (
            <>
              {pedido.cliente_telefone && (
                <Button 
                  className="gap-2 bg-green-600 hover:bg-green-700"
                  onClick={sendWhatsAppReceipt}
                >
                  <MessageCircle className="w-4 h-4" />
                  Enviar Comprovante
                </Button>
              )}
              <Button 
                variant="outline"
                className="gap-2"
                onClick={copyReceipt}
              >
                <Copy className="w-4 h-4" />
                Copiar Comprovante
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
});
