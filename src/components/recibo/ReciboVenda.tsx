import { forwardRef } from 'react';
import { Gem } from 'lucide-react';
import type { Peca } from '@/hooks/useSupabaseData';

interface CarrinhoItem {
  peca: Peca;
  quantidade: number;
}

interface PagamentoLocal {
  metodo: 'dinheiro' | 'pix' | 'credito' | 'debito';
  valor: number;
}

interface VendaLocal {
  id: string;
  itens: CarrinhoItem[];
  pagamentos: PagamentoLocal[];
  total: number;
  data: Date;
  tipo: 'pdv' | 'revendedora';
}

interface ReciboVendaProps {
  venda: VendaLocal;
  numeroCaixa?: string;
}

export const ReciboVenda = forwardRef<HTMLDivElement, ReciboVendaProps>(
  ({ venda, numeroCaixa }, ref) => {
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value);
    };

    const formatDate = (date: Date) => {
      return new Date(date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const totalPago = venda.pagamentos.reduce((acc, p) => acc + p.valor, 0);
    const troco = Math.max(0, totalPago - venda.total);

    const metodoLabels: Record<string, string> = {
      dinheiro: 'Dinheiro',
      pix: 'PIX',
      credito: 'Cartão de Crédito',
      debito: 'Cartão de Débito',
    };

    return (
      <div ref={ref} className="recibo-container bg-white text-black p-6 max-w-[300px] mx-auto font-mono text-sm">
        {/* Header */}
        <div className="text-center border-b border-dashed border-gray-400 pb-4 mb-4">
          <div className="flex justify-center mb-2">
            <Gem className="w-8 h-8" />
          </div>
          <h1 className="text-lg font-bold">NEXSILES</h1>
          <p className="text-xs text-gray-600">Semijoias</p>
          <p className="text-xs text-gray-500 mt-2">
            CUPOM NÃO FISCAL
          </p>
        </div>

        {/* Info */}
        <div className="border-b border-dashed border-gray-400 pb-4 mb-4 text-xs">
          <div className="flex justify-between">
            <span>Data:</span>
            <span>{formatDate(venda.data)}</span>
          </div>
          <div className="flex justify-between">
            <span>Venda Nº:</span>
            <span>{venda.id.slice(-6).toUpperCase()}</span>
          </div>
          {numeroCaixa && (
            <div className="flex justify-between">
              <span>Caixa:</span>
              <span>{numeroCaixa}</span>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="border-b border-dashed border-gray-400 pb-4 mb-4">
          <p className="text-xs font-bold mb-2">ITENS</p>
          <div className="space-y-2">
            {venda.itens.map((item, index) => (
              <div key={index} className="text-xs">
                <div className="flex justify-between">
                  <span className="truncate max-w-[180px]">
                    {item.quantidade}x {item.peca.nome}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span className="pl-4">{item.peca.codigo}</span>
                  <span>{formatCurrency(item.peca.preco_venda * item.quantidade)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="border-b border-dashed border-gray-400 pb-4 mb-4">
          <div className="flex justify-between text-xs">
            <span>Subtotal ({venda.itens.reduce((acc, i) => acc + i.quantidade, 0)} itens):</span>
            <span>{formatCurrency(venda.total)}</span>
          </div>
          <div className="flex justify-between font-bold text-base mt-2">
            <span>TOTAL:</span>
            <span>{formatCurrency(venda.total)}</span>
          </div>
        </div>

        {/* Payments */}
        <div className="border-b border-dashed border-gray-400 pb-4 mb-4">
          <p className="text-xs font-bold mb-2">PAGAMENTO</p>
          {venda.pagamentos.map((pag, index) => (
            <div key={index} className="flex justify-between text-xs">
              <span>{metodoLabels[pag.metodo] || pag.metodo}</span>
              <span>{formatCurrency(pag.valor)}</span>
            </div>
          ))}
          {troco > 0 && (
            <div className="flex justify-between text-xs mt-2 font-bold">
              <span>TROCO:</span>
              <span>{formatCurrency(troco)}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          <p className="mb-2">Obrigado pela preferência!</p>
          <p>Volte sempre</p>
          <div className="mt-4 pt-4 border-t border-dashed border-gray-400">
            <p className="text-[10px]">
              Este documento não possui valor fiscal
            </p>
          </div>
        </div>
      </div>
    );
  }
);

ReciboVenda.displayName = 'ReciboVenda';
