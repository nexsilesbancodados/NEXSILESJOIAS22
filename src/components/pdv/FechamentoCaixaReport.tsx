import { useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Banknote,
  CreditCard,
  Smartphone,
  DollarSign,
  ArrowDownCircle,
  ArrowUpCircle,
  Printer,
  FileText,
  Clock,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { WhatsAppShare } from '@/components/whatsapp/WhatsAppShare';
import { exportToPDF } from '@/lib/export';

interface VendaItem {
  id: string;
  total: number;
  forma_pagamento: string;
  created_at: string;
}

interface Movimento {
  id: string;
  tipo: 'sangria' | 'suprimento';
  valor: number;
  descricao: string | null;
  created_at: string;
}

interface CaixaSessao {
  id: string;
  valor_inicial: number | null;
  data_abertura: string | null;
  created_at: string;
}

interface FechamentoCaixaReportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caixa: CaixaSessao;
  vendas: VendaItem[];
  movimentos: Movimento[];
  onConfirmarFechamento: () => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export function FechamentoCaixaReport({
  open,
  onOpenChange,
  caixa,
  vendas,
  movimentos,
  onConfirmarFechamento,
}: FechamentoCaixaReportProps) {
  const reportRef = useRef<HTMLDivElement>(null);

  const resumo = useMemo(() => {
    // Group sales by payment method
    const porMetodo = {
      dinheiro: 0,
      pix: 0,
      credito: 0,
      debito: 0,
    };

    vendas.forEach((venda) => {
      const metodo = (venda.forma_pagamento || 'dinheiro') as keyof typeof porMetodo;
      if (porMetodo[metodo] !== undefined) {
        porMetodo[metodo] += Number(venda.total);
      } else {
        porMetodo.dinheiro += Number(venda.total);
      }
    });

    // Calculate movements
    const sangrias = movimentos.filter((m) => m.tipo === 'sangria');
    const suprimentos = movimentos.filter((m) => m.tipo === 'suprimento');
    const totalSangrias = sangrias.reduce((acc, s) => acc + Number(s.valor), 0);
    const totalSuprimentos = suprimentos.reduce((acc, s) => acc + Number(s.valor), 0);

    // Totals
    const totalVendas = Object.values(porMetodo).reduce((a, b) => a + b, 0);
    const fundoTroco = Number(caixa.valor_inicial) || 0;
    const saldoFinal = fundoTroco + totalVendas + totalSuprimentos - totalSangrias;
    const ticketMedio = vendas.length > 0 ? totalVendas / vendas.length : 0;

    return {
      porMetodo,
      totalVendas,
      fundoTroco,
      totalSangrias,
      totalSuprimentos,
      saldoFinal,
      ticketMedio,
      qtdVendas: vendas.length,
      sangrias,
      suprimentos,
    };
  }, [vendas, movimentos, caixa]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    const dataAbertura = caixa.data_abertura || caixa.created_at;
    const reportData = [
      { descricao: 'Fundo de Troco', valor: resumo.fundoTroco },
      { descricao: 'Vendas em Dinheiro', valor: resumo.porMetodo.dinheiro },
      { descricao: 'Vendas em PIX', valor: resumo.porMetodo.pix },
      { descricao: 'Vendas em Crédito', valor: resumo.porMetodo.credito },
      { descricao: 'Vendas em Débito', valor: resumo.porMetodo.debito },
      { descricao: 'Total de Suprimentos', valor: resumo.totalSuprimentos },
      { descricao: 'Total de Sangrias', valor: -resumo.totalSangrias },
      { descricao: 'SALDO FINAL', valor: resumo.saldoFinal },
    ];

    exportToPDF(
      reportData,
      [
        { header: 'Descrição', accessor: 'descricao' },
        { header: 'Valor', accessor: 'valor', format: (v) => formatCurrency(v as number) },
      ],
      `fechamento-caixa-${format(new Date(), 'yyyy-MM-dd-HHmm')}`,
      `Fechamento de Caixa - ${format(new Date(dataAbertura), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`
    );
  };

  const formatWhatsAppMessage = () => {
    const dataAbertura = caixa.data_abertura || caixa.created_at;
    return `📊 *FECHAMENTO DE CAIXA*
📅 ${format(new Date(dataAbertura), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}

💰 *Resumo por Forma de Pagamento:*
──────────────────
💵 Dinheiro: ${formatCurrency(resumo.porMetodo.dinheiro)}
📱 PIX: ${formatCurrency(resumo.porMetodo.pix)}
💳 Crédito: ${formatCurrency(resumo.porMetodo.credito)}
💳 Débito: ${formatCurrency(resumo.porMetodo.debito)}
──────────────────
🛒 Total Vendas: ${formatCurrency(resumo.totalVendas)}
📦 Quantidade: ${resumo.qtdVendas} venda(s)
📊 Ticket Médio: ${formatCurrency(resumo.ticketMedio)}

💼 *Movimentações:*
➕ Suprimentos: ${formatCurrency(resumo.totalSuprimentos)}
➖ Sangrias: ${formatCurrency(resumo.totalSangrias)}

💎 *SALDO FINAL: ${formatCurrency(resumo.saldoFinal)}*`;
  };

  const dataAbertura = caixa.data_abertura || caixa.created_at;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="w-5 h-5" />
            Fechamento de Caixa
          </DialogTitle>
          <DialogDescription>
            Relatório detalhado da sessão de caixa
          </DialogDescription>
        </DialogHeader>

        <div ref={reportRef} className="space-y-6 print:p-8">
          {/* Header Info */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Abertura: {format(new Date(dataAbertura), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </div>
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              {resumo.qtdVendas} vendas realizadas
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Banknote className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700">Dinheiro</span>
                </div>
                <p className="text-xl font-bold text-green-800">
                  {formatCurrency(resumo.porMetodo.dinheiro)}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-700">PIX</span>
                </div>
                <p className="text-xl font-bold text-blue-800">
                  {formatCurrency(resumo.porMetodo.pix)}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-purple-700">Crédito</span>
                </div>
                <p className="text-xl font-bold text-purple-800">
                  {formatCurrency(resumo.porMetodo.credito)}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-4 h-4 text-orange-600" />
                  <span className="text-sm text-orange-700">Débito</span>
                </div>
                <p className="text-xl font-bold text-orange-800">
                  {formatCurrency(resumo.porMetodo.debito)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Totals */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Resumo Financeiro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Fundo de Troco</span>
                <span className="font-medium">{formatCurrency(resumo.fundoTroco)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total de Vendas</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(resumo.totalVendas)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <ArrowUpCircle className="w-4 h-4 text-green-500" />
                  Suprimentos
                </span>
                <span className="font-medium text-green-600">
                  +{formatCurrency(resumo.totalSuprimentos)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <ArrowDownCircle className="w-4 h-4 text-red-500" />
                  Sangrias
                </span>
                <span className="font-medium text-red-600">
                  -{formatCurrency(resumo.totalSangrias)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center text-lg">
                <span className="font-semibold flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Saldo Final
                </span>
                <span className="font-bold text-primary text-xl">
                  {formatCurrency(resumo.saldoFinal)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Ticket Médio */}
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ticket Médio</p>
                    <p className="text-2xl font-bold">{formatCurrency(resumo.ticketMedio)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Vendas</p>
                  <p className="text-2xl font-bold">{resumo.qtdVendas}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Movimentos */}
          {(resumo.sangrias.length > 0 || resumo.suprimentos.length > 0) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Movimentações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {resumo.suprimentos.map((s) => (
                  <div key={s.id} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <ArrowUpCircle className="w-4 h-4 text-green-500" />
                      <span>{s.descricao || 'Suprimento'}</span>
                    </div>
                    <span className="text-green-600">+{formatCurrency(Number(s.valor))}</span>
                  </div>
                ))}
                {resumo.sangrias.map((s) => (
                  <div key={s.id} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <ArrowDownCircle className="w-4 h-4 text-red-500" />
                      <span>{s.descricao || 'Sangria'}</span>
                    </div>
                    <span className="text-red-600">-{formatCurrency(Number(s.valor))}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-4 border-t print:hidden">
          <Button variant="outline" onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" />
            Imprimir
          </Button>
          <Button variant="outline" onClick={handleExportPDF} className="gap-2">
            <FileText className="w-4 h-4" />
            PDF
          </Button>
          <WhatsAppShare
            message={formatWhatsAppMessage()}
            buttonText="WhatsApp"
            showIcon
          />
          <div className="flex-1" />
          <Button onClick={onConfirmarFechamento} className="btn-gold gap-2">
            <DollarSign className="w-4 h-4" />
            Confirmar Fechamento
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
