import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { exportToCSV, exportToPDF, formatCurrency, formatDate, ExportColumn } from '@/lib/export';
import { toast } from 'sonner';

interface ReportData {
  vendas?: Array<{
    id: string;
    data: string;
    cliente_nome?: string | null;
    total: number;
    tipo: string;
  }>;
  pecas?: Array<{
    id: string;
    codigo: string;
    nome: string;
    estoque: number;
    preco_venda: number;
    categoria?: string | null;
  }>;
  revendedoras?: Array<{
    id: string;
    nome: string;
    email?: string | null;
    telefone?: string | null;
    comissao?: number | null;
  }>;
  romaneios?: Array<{
    id: string;
    data: string;
    reseller_nome: string;
    total: number;
    status: string;
  }>;
}

interface Props {
  data: ReportData;
  reportType: 'vendas' | 'estoque' | 'revendedoras' | 'completo';
  dateRange?: { from: Date; to: Date };
}

export function ReportExportButton({ data, reportType, dateRange }: Props) {
  const [isExporting, setIsExporting] = useState(false);

  const getFileName = () => {
    const date = new Date().toISOString().split('T')[0];
    const suffix = dateRange 
      ? `_${dateRange.from.toISOString().split('T')[0]}_${dateRange.to.toISOString().split('T')[0]}`
      : '';
    return `relatorio_${reportType}${suffix}_${date}`;
  };

  const getTitle = () => {
    const titles: Record<string, string> = {
      vendas: 'Relatório de Vendas',
      estoque: 'Relatório de Estoque',
      revendedoras: 'Relatório de Revendedoras',
      completo: 'Relatório Completo',
    };
    return titles[reportType] || 'Relatório';
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const fileName = getFileName();
      
      if (reportType === 'vendas' && data.vendas) {
        const columns: ExportColumn[] = [
          { header: 'Data', accessor: 'data', format: formatDate },
          { header: 'Cliente', accessor: 'cliente_nome', format: (v) => String(v || 'N/A') },
          { header: 'Tipo', accessor: 'tipo', format: (v) => v === 'pdv' ? 'PDV' : 'Revendedora' },
          { header: 'Total', accessor: 'total', format: formatCurrency },
        ];
        exportToCSV(data.vendas, columns, fileName);
      } else if (reportType === 'estoque' && data.pecas) {
        const columns: ExportColumn[] = [
          { header: 'Código', accessor: 'codigo' },
          { header: 'Nome', accessor: 'nome' },
          { header: 'Categoria', accessor: 'categoria', format: (v) => String(v || 'Sem categoria') },
          { header: 'Estoque', accessor: 'estoque', format: (v) => String(v) },
          { header: 'Preço Venda', accessor: 'preco_venda', format: formatCurrency },
        ];
        exportToCSV(data.pecas, columns, fileName);
      } else if (reportType === 'revendedoras' && data.revendedoras) {
        const columns: ExportColumn[] = [
          { header: 'Nome', accessor: 'nome' },
          { header: 'Email', accessor: 'email', format: (v) => String(v || '-') },
          { header: 'Telefone', accessor: 'telefone', format: (v) => String(v || '-') },
          { header: 'Comissão (%)', accessor: 'comissao', format: (v) => v ? `${v}%` : '10%' },
        ];
        exportToCSV(data.revendedoras, columns, fileName);
      } else if (reportType === 'completo' && data.romaneios) {
        const columns: ExportColumn[] = [
          { header: 'Data', accessor: 'data', format: formatDate },
          { header: 'Revendedora', accessor: 'reseller_nome' },
          { header: 'Status', accessor: 'status' },
          { header: 'Total', accessor: 'total', format: formatCurrency },
        ];
        exportToCSV(data.romaneios, columns, fileName);
      }
      
      toast.success('Exportação CSV concluída!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erro ao exportar CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const fileName = getFileName();
      const title = getTitle();
      
      if (reportType === 'vendas' && data.vendas) {
        const columns: ExportColumn[] = [
          { header: 'Data', accessor: 'data', format: formatDate },
          { header: 'Cliente', accessor: 'cliente_nome', format: (v) => String(v || 'N/A') },
          { header: 'Tipo', accessor: 'tipo', format: (v) => v === 'pdv' ? 'PDV' : 'Revendedora' },
          { header: 'Total', accessor: 'total', format: formatCurrency },
        ];
        exportToPDF(data.vendas, columns, fileName, title);
      } else if (reportType === 'estoque' && data.pecas) {
        const columns: ExportColumn[] = [
          { header: 'Código', accessor: 'codigo' },
          { header: 'Nome', accessor: 'nome' },
          { header: 'Categoria', accessor: 'categoria', format: (v) => String(v || 'Sem categoria') },
          { header: 'Estoque', accessor: 'estoque', format: (v) => String(v) },
          { header: 'Preço', accessor: 'preco_venda', format: formatCurrency },
        ];
        exportToPDF(data.pecas, columns, fileName, title);
      } else if (reportType === 'revendedoras' && data.revendedoras) {
        const columns: ExportColumn[] = [
          { header: 'Nome', accessor: 'nome' },
          { header: 'Email', accessor: 'email', format: (v) => String(v || '-') },
          { header: 'Telefone', accessor: 'telefone', format: (v) => String(v || '-') },
          { header: 'Comissão', accessor: 'comissao', format: (v) => v ? `${v}%` : '10%' },
        ];
        exportToPDF(data.revendedoras, columns, fileName, title);
      } else if (reportType === 'completo' && data.romaneios) {
        const columns: ExportColumn[] = [
          { header: 'Data', accessor: 'data', format: formatDate },
          { header: 'Revendedora', accessor: 'reseller_nome' },
          { header: 'Status', accessor: 'status' },
          { header: 'Total', accessor: 'total', format: formatCurrency },
        ];
        exportToPDF(data.romaneios, columns, fileName, title);
      }
      
      toast.success('Exportação PDF concluída!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erro ao exportar PDF');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover">
        <DropdownMenuItem onClick={handleExportCSV}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Exportar CSV (Excel)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPDF}>
          <FileText className="w-4 h-4 mr-2" />
          Exportar PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
