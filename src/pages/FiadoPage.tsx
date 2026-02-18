import { useState } from 'react';
import { format, isPast, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  HandCoins,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Loader2,
  Trash2,
  MessageCircle,
  ChevronDown,
} from 'lucide-react';
import { useFiado, useDarBaixaFiado, useDeleteFiado, type Fiado } from '@/hooks/useFiado';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase-db';

export default function FiadoPage() {
  const { data: fiados = [], isLoading } = useFiado();
  const darBaixa = useDarBaixaFiado();
  const deleteFiado = useDeleteFiado();

  const [search, setSearch] = useState('');
  const [selectedFiado, setSelectedFiado] = useState<Fiado | null>(null);
  const [valorBaixa, setValorBaixa] = useState('');
  const [isBaixaOpen, setIsBaixaOpen] = useState(false);
  const [sendingMsg, setSendingMsg] = useState<string | null>(null);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const filtered = fiados.filter((f) => {
    const nome = f.clientes?.nome?.toLowerCase() || '';
    return nome.includes(search.toLowerCase());
  });

  const abertos = filtered.filter((f) => f.status === 'aberto');
  const vencidos = filtered.filter(
    (f) => f.status === 'aberto' && isPast(parseISO(f.data_vencimento))
  );
  const pagos = filtered.filter((f) => f.status === 'pago');

  const totalAberto = abertos.reduce((acc, f) => acc + (f.valor_total - f.valor_pago), 0);

  const handleOpenBaixa = (fiado: Fiado) => {
    setSelectedFiado(fiado);
    setValorBaixa(String(fiado.valor_total - fiado.valor_pago));
    setIsBaixaOpen(true);
  };

  const handleConfirmarBaixa = async () => {
    if (!selectedFiado) return;
    const valor = parseFloat(valorBaixa) || 0;
    const novoPago = Math.min(selectedFiado.valor_pago + valor, selectedFiado.valor_total);
    await darBaixa.mutateAsync({
      id: selectedFiado.id,
      valor_pago: novoPago,
      valor_total: selectedFiado.valor_total,
    });
    setIsBaixaOpen(false);
    setSelectedFiado(null);
  };

  const handleEnviarCobranca = async (fiado: Fiado) => {
    const tel = fiado.clientes?.whatsapp || fiado.clientes?.telefone;
    if (!tel) {
      toast.error('Cliente sem WhatsApp cadastrado');
      return;
    }
    setSendingMsg(fiado.id);
    try {
      const restante = fiado.valor_total - fiado.valor_pago;
      const vencimento = format(parseISO(fiado.data_vencimento), "dd/MM/yyyy", { locale: ptBR });
      const msg = `Olá ${fiado.clientes?.nome}! 👋\n\nPassamos para lembrar que você tem um valor de *${formatCurrency(restante)}* em aberto conosco com vencimento em *${vencimento}*.\n\nPor favor, entre em contato para regularizar. Obrigado! 🙏`;

      // Marcar notificação enviada
      await supabase
        .from('fiado')
        .update({ notificacao_enviada: true, notificacao_enviada_at: new Date().toISOString() })
        .eq('id', fiado.id);

      // Abrir WhatsApp
      const numeroLimpo = tel.replace(/\D/g, '');
      window.open(`https://wa.me/55${numeroLimpo}?text=${encodeURIComponent(msg)}`, '_blank');
      toast.success('Mensagem de cobrança preparada!');
    } catch {
      toast.error('Erro ao enviar cobrança');
    } finally {
      setSendingMsg(null);
    }
  };

  const statusBadge = (fiado: Fiado) => {
    const vencido = fiado.status === 'aberto' && isPast(parseISO(fiado.data_vencimento));
    if (fiado.status === 'pago') return <Badge className="bg-success/10 text-success border-success/30">Pago</Badge>;
    if (vencido) return <Badge variant="destructive">Vencido</Badge>;
    return <Badge variant="outline" className="border-warning/50 text-warning">Em aberto</Badge>;
  };

  const FiadoTable = ({ items }: { items: Fiado[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cliente</TableHead>
          <TableHead>Vencimento</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Pago</TableHead>
          <TableHead>Restante</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length === 0 && (
          <TableRow>
            <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
              Nenhum registro encontrado
            </TableCell>
          </TableRow>
        )}
        {items.map((fiado) => {
          const restante = fiado.valor_total - fiado.valor_pago;
          const vencido = fiado.status === 'aberto' && isPast(parseISO(fiado.data_vencimento));
          return (
            <TableRow key={fiado.id} className={cn(vencido && 'bg-destructive/5')}>
              <TableCell className="font-medium">{fiado.clientes?.nome || '—'}</TableCell>
              <TableCell>
                {format(parseISO(fiado.data_vencimento), 'dd/MM/yyyy', { locale: ptBR })}
              </TableCell>
              <TableCell>{formatCurrency(fiado.valor_total)}</TableCell>
              <TableCell>{formatCurrency(fiado.valor_pago)}</TableCell>
              <TableCell className={cn('font-semibold', restante > 0 ? 'text-destructive' : 'text-success')}>
                {formatCurrency(restante)}
              </TableCell>
              <TableCell>{statusBadge(fiado)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1 justify-end">
                  {fiado.status !== 'pago' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenBaixa(fiado)}
                        className="h-7 text-xs"
                      >
                        <ChevronDown className="w-3 h-3 mr-1" />
                        Baixa
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEnviarCobranca(fiado)}
                        disabled={sendingMsg === fiado.id}
                        className="h-7 text-xs"
                      >
                        {sendingMsg === fiado.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <MessageCircle className="w-3 h-3 mr-1" />
                        )}
                        Cobrar
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteFiado.mutate(fiado.id)}
                    className="h-7 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold flex items-center gap-2">
            <HandCoins className="w-6 h-6 text-primary" />
            Fiado / Crediário
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gerencie vendas a prazo e cobranças
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-warning" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Em Aberto</p>
            <p className="text-xl font-bold">{abertos.length}</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Vencidos</p>
            <p className="text-xl font-bold text-destructive">{vencidos.length}</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <HandCoins className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total a Receber</p>
            <p className="text-xl font-bold text-primary">{formatCurrency(totalAberto)}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tabs */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs defaultValue="aberto">
          <TabsList>
            <TabsTrigger value="aberto" className="gap-2">
              <Clock className="w-4 h-4" />
              Em Aberto
              {abertos.length > 0 && (
                <Badge className="ml-1 text-xs bg-warning/20 text-warning border-warning/30">
                  {abertos.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="vencido" className="gap-2">
              <AlertTriangle className="w-4 h-4" />
              Vencidos
              {vencidos.length > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs">
                  {vencidos.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="pago" className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Pagos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="aberto" className="mt-4">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <ScrollArea className="w-full">
                <FiadoTable items={abertos} />
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="vencido" className="mt-4">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <ScrollArea className="w-full">
                <FiadoTable items={vencidos} />
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="pago" className="mt-4">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <ScrollArea className="w-full">
                <FiadoTable items={pagos} />
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Dialog Dar Baixa */}
      <Dialog open={isBaixaOpen} onOpenChange={setIsBaixaOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Dar Baixa no Fiado</DialogTitle>
            <DialogDescription>
              Cliente: <strong>{selectedFiado?.clientes?.nome}</strong> — Restante:{' '}
              <strong>
                {selectedFiado && formatCurrency(selectedFiado.valor_total - selectedFiado.valor_pago)}
              </strong>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <Label>Valor Recebido (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={valorBaixa}
              onChange={(e) => setValorBaixa(e.target.value)}
              placeholder="0,00"
            />
            {selectedFiado && parseFloat(valorBaixa) >= (selectedFiado.valor_total - selectedFiado.valor_pago) && (
              <p className="text-sm text-success flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Fiado será quitado!
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBaixaOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmarBaixa}
              className="btn-gold"
              disabled={darBaixa.isPending || !valorBaixa || parseFloat(valorBaixa) <= 0}
            >
              {darBaixa.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirmar Baixa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
