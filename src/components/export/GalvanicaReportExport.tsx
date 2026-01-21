import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface GalvanicaStats {
  custoTotal: number;
  pesoTotal: number;
  totalEnvios: number;
  enviosPendentes: number;
  enviosRetornados: number;
  custoMedioKg: number;
}

interface GalvanicaEvolutionItem {
  date: string;
  custo: number;
  peso: number;
  envios: number;
}

interface GalvanicaPorBanhoItem {
  nome: string;
  custo: number;
  peso: number;
  envios: number;
}

interface GalvanicaStatusItem {
  name: string;
  value: number;
}

interface GalvanicaMensalItem {
  mes: string;
  custo: number;
  peso: number;
}

interface Props {
  stats: GalvanicaStats;
  evolutionData: GalvanicaEvolutionItem[];
  porBanhoData: GalvanicaPorBanhoItem[];
  statusData: GalvanicaStatusItem[];
  mensalData: GalvanicaMensalItem[];
  dateRange?: { from: Date; to: Date };
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export function GalvanicaReportExport({ 
  stats, 
  evolutionData, 
  porBanhoData, 
  statusData, 
  mensalData,
  dateRange 
}: Props) {
  const [isExporting, setIsExporting] = useState(false);

  const getFileName = () => {
    const date = new Date().toISOString().split('T')[0];
    const suffix = dateRange 
      ? `_${format(dateRange.from, 'yyyy-MM-dd')}_${format(dateRange.to, 'yyyy-MM-dd')}`
      : '';
    return `relatorio_galvanica${suffix}_${date}`;
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const fileName = getFileName();
      
      // Create CSV with multiple sections
      const BOM = '\uFEFF';
      let csvContent = BOM;
      
      // Header
      csvContent += 'RELATÓRIO DE CUSTOS GALVÂNICA\n';
      if (dateRange) {
        csvContent += `Período: ${format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} a ${format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}\n`;
      }
      csvContent += `Gerado em: ${new Date().toLocaleString('pt-BR')}\n\n`;
      
      // Stats Summary
      csvContent += '=== RESUMO GERAL ===\n';
      csvContent += `Custo Total,${formatCurrency(stats.custoTotal)}\n`;
      csvContent += `Peso Total,${stats.pesoTotal.toFixed(1)}g\n`;
      csvContent += `Total de Envios,${stats.totalEnvios}\n`;
      csvContent += `Envios Pendentes,${stats.enviosPendentes}\n`;
      csvContent += `Envios Retornados,${stats.enviosRetornados}\n`;
      csvContent += `Custo Médio/Kg,${formatCurrency(stats.custoMedioKg)}\n\n`;
      
      // Evolution Data
      if (evolutionData.length > 0) {
        csvContent += '=== EVOLUÇÃO DIÁRIA ===\n';
        csvContent += 'Data,Custo,Peso (g),Envios\n';
        evolutionData.forEach(item => {
          csvContent += `${item.date},${formatCurrency(item.custo)},${item.peso.toFixed(1)},${item.envios}\n`;
        });
        csvContent += '\n';
      }
      
      // Por Banho Data
      if (porBanhoData.length > 0) {
        csvContent += '=== CUSTO POR TIPO DE BANHO ===\n';
        csvContent += 'Tipo de Banho,Custo,Peso (g),Envios\n';
        porBanhoData.forEach(item => {
          csvContent += `"${item.nome}",${formatCurrency(item.custo)},${item.peso.toFixed(1)},${item.envios}\n`;
        });
        csvContent += '\n';
      }
      
      // Status Data
      if (statusData.length > 0) {
        csvContent += '=== STATUS DOS ENVIOS ===\n';
        csvContent += 'Status,Quantidade\n';
        statusData.forEach(item => {
          csvContent += `${item.name},${item.value}\n`;
        });
        csvContent += '\n';
      }
      
      // Mensal Data
      if (mensalData.length > 0) {
        csvContent += '=== EVOLUÇÃO MENSAL ===\n';
        csvContent += 'Mês,Custo,Peso (g)\n';
        mensalData.forEach(item => {
          csvContent += `${item.mes},${formatCurrency(item.custo)},${item.peso.toFixed(1)}\n`;
        });
      }
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${fileName}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
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
      const doc = new jsPDF();
      let yPosition = 20;
      
      // Title
      doc.setFontSize(20);
      doc.setTextColor(212, 175, 55); // Gold
      doc.text('Relatório de Custos Galvânica', 14, yPosition);
      yPosition += 10;
      
      // Subtitle with date range
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      if (dateRange) {
        doc.text(
          `Período: ${format(dateRange.from, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} a ${format(dateRange.to, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`,
          14, yPosition
        );
        yPosition += 6;
      }
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, yPosition);
      yPosition += 15;
      
      // Stats Summary Cards
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Resumo Geral', 14, yPosition);
      yPosition += 8;
      
      const statsTableData = [
        ['Custo Total', formatCurrency(stats.custoTotal)],
        ['Peso Total', `${stats.pesoTotal.toFixed(1)}g`],
        ['Total de Envios', String(stats.totalEnvios)],
        ['Envios Pendentes', String(stats.enviosPendentes)],
        ['Envios Retornados', String(stats.enviosRetornados)],
        ['Custo Médio/Kg', formatCurrency(stats.custoMedioKg)],
        ['Média por Envio', formatCurrency(stats.totalEnvios > 0 ? stats.custoTotal / stats.totalEnvios : 0)],
        ['Peso Médio/Envio', `${(stats.totalEnvios > 0 ? stats.pesoTotal / stats.totalEnvios : 0).toFixed(1)}g`],
        ['Taxa de Retorno', `${stats.totalEnvios > 0 ? ((stats.enviosRetornados / stats.totalEnvios) * 100).toFixed(0) : 0}%`],
      ];
      
      autoTable(doc, {
        body: statsTableData,
        startY: yPosition,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 60 },
          1: { cellWidth: 50 },
        },
        alternateRowStyles: { fillColor: [250, 250, 250] },
      });
      
      yPosition = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
      
      // Status Distribution
      if (statusData.length > 0 && statusData.some(s => s.value > 0)) {
        doc.setFontSize(14);
        doc.text('Distribuição por Status', 14, yPosition);
        yPosition += 8;
        
        autoTable(doc, {
          head: [['Status', 'Quantidade', 'Percentual']],
          body: statusData.map(item => [
            item.name,
            String(item.value),
            `${stats.totalEnvios > 0 ? ((item.value / stats.totalEnvios) * 100).toFixed(1) : 0}%`
          ]),
          startY: yPosition,
          styles: { fontSize: 9, cellPadding: 3 },
          headStyles: { fillColor: [212, 175, 55], textColor: [0, 0, 0], fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [250, 250, 250] },
        });
        
        yPosition = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
      }
      
      // Check if need new page
      if (yPosition > 240) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Custo por Tipo de Banho
      if (porBanhoData.length > 0) {
        doc.setFontSize(14);
        doc.text('Custo por Tipo de Banho', 14, yPosition);
        yPosition += 8;
        
        autoTable(doc, {
          head: [['Tipo de Banho', 'Custo', 'Peso (g)', 'Envios']],
          body: porBanhoData.map(item => [
            item.nome,
            formatCurrency(item.custo),
            item.peso.toFixed(1),
            String(item.envios)
          ]),
          startY: yPosition,
          styles: { fontSize: 9, cellPadding: 3 },
          headStyles: { fillColor: [212, 175, 55], textColor: [0, 0, 0], fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [250, 250, 250] },
        });
        
        yPosition = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
      }
      
      // Check if need new page
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Evolução Diária
      if (evolutionData.length > 0) {
        doc.setFontSize(14);
        doc.text('Evolução Diária no Período', 14, yPosition);
        yPosition += 8;
        
        autoTable(doc, {
          head: [['Data', 'Custo', 'Peso (g)', 'Envios']],
          body: evolutionData.map(item => [
            item.date,
            formatCurrency(item.custo),
            item.peso.toFixed(1),
            String(item.envios)
          ]),
          startY: yPosition,
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [212, 175, 55], textColor: [0, 0, 0], fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [250, 250, 250] },
        });
        
        yPosition = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
      }
      
      // Check if need new page
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Evolução Mensal
      if (mensalData.length > 0) {
        doc.setFontSize(14);
        doc.text('Evolução Mensal (Últimos 12 meses)', 14, yPosition);
        yPosition += 8;
        
        autoTable(doc, {
          head: [['Mês', 'Custo', 'Peso (g)']],
          body: mensalData.map(item => [
            item.mes,
            formatCurrency(item.custo),
            item.peso.toFixed(1)
          ]),
          startY: yPosition,
          styles: { fontSize: 9, cellPadding: 3 },
          headStyles: { fillColor: [212, 175, 55], textColor: [0, 0, 0], fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [250, 250, 250] },
        });
      }
      
      // Footer on all pages
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Página ${i} de ${pageCount} | Nexsiles - Gestão de Semijoias`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }
      
      doc.save(`${fileName}.pdf`);
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
          Exportar Relatório
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover">
        <DropdownMenuItem onClick={handleExportCSV}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Exportar CSV (Excel)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPDF}>
          <FileText className="w-4 h-4 mr-2" />
          Exportar PDF Completo
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
