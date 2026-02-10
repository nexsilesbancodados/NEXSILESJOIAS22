import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { FileDown, FileSpreadsheet, Loader2 } from 'lucide-react';
import { useConversas, useConversaStats } from '@/hooks/useConversas';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function AgentReportExport() {
  const [periodo, setPeriodo] = useState('30');
  const [exportando, setExportando] = useState(false);

  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - parseInt(periodo));

  const { data: conversas = [] } = useConversas({ dateFrom: dateFrom.toISOString() });
  const { data: stats } = useConversaStats();

  const exportCSV = () => {
    if (conversas.length === 0) {
      toast.error('Nenhuma conversa para exportar');
      return;
    }

    const headers = ['Cliente', 'Telefone', 'Status', 'Origem', 'Mensagens', 'NPS', 'Sentimento', 'Data'];
    const rows = conversas.map((c: any) => [
      c.cliente_nome || 'Anônimo',
      c.cliente_telefone || '-',
      c.status || '-',
      c.origem || 'chat',
      c.total_mensagens || 0,
      c.nps_rating ?? '-',
      c.sentimento || '-',
      new Date(c.created_at).toLocaleDateString('pt-BR'),
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-agente-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exportado!');
  };

  const exportPDF = async () => {
    setExportando(true);
    try {
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(18);
      doc.text('Relatório do Agente de IA', 14, 20);
      doc.setFontSize(10);
      doc.text(`Período: últimos ${periodo} dias • Gerado em ${new Date().toLocaleDateString('pt-BR')}`, 14, 28);

      // Stats
      doc.setFontSize(14);
      doc.text('Resumo', 14, 40);
      
      const statsData = [
        ['Total de Conversas', String(stats?.total || 0)],
        ['Conversas Hoje', String(stats?.conversasHoje || 0)],
        ['Aguardando Humano', String(stats?.aguardandoHumano || 0)],
        ['NPS Score', stats?.npsScore != null ? `${stats.npsScore.toFixed(0)}` : 'N/A'],
        ['NPS Médio', stats?.npsMedia != null ? `${stats.npsMedia.toFixed(1)}` : 'N/A'],
        ['Total Mensagens', String(stats?.totalMensagens || 0)],
      ];

      autoTable(doc, {
        startY: 44,
        head: [['Métrica', 'Valor']],
        body: statsData,
        theme: 'grid',
        headStyles: { fillColor: [99, 102, 241] },
      });

      // Sentiment breakdown
      const positivo = conversas.filter((c: any) => c.sentimento === 'positivo').length;
      const neutro = conversas.filter((c: any) => c.sentimento === 'neutro').length;
      const negativo = conversas.filter((c: any) => c.sentimento === 'negativo').length;

      const sentimentY = (doc as any).lastAutoTable?.finalY + 10 || 100;
      doc.setFontSize(14);
      doc.text('Análise de Sentimento', 14, sentimentY);

      autoTable(doc, {
        startY: sentimentY + 4,
        head: [['Sentimento', 'Quantidade', '%']],
        body: [
          ['Positivo', String(positivo), conversas.length > 0 ? `${((positivo / conversas.length) * 100).toFixed(1)}%` : '0%'],
          ['Neutro', String(neutro), conversas.length > 0 ? `${((neutro / conversas.length) * 100).toFixed(1)}%` : '0%'],
          ['Negativo', String(negativo), conversas.length > 0 ? `${((negativo / conversas.length) * 100).toFixed(1)}%` : '0%'],
        ],
        theme: 'grid',
        headStyles: { fillColor: [99, 102, 241] },
      });

      // Conversations table
      const conversasY = (doc as any).lastAutoTable?.finalY + 10 || 160;
      doc.setFontSize(14);
      doc.text('Conversas', 14, conversasY);

      autoTable(doc, {
        startY: conversasY + 4,
        head: [['Cliente', 'Status', 'Msgs', 'NPS', 'Sentimento', 'Data']],
        body: conversas.slice(0, 50).map((c: any) => [
          c.cliente_nome || 'Anônimo',
          c.status || '-',
          String(c.total_mensagens || 0),
          c.nps_rating != null ? String(c.nps_rating) : '-',
          c.sentimento || '-',
          new Date(c.created_at).toLocaleDateString('pt-BR'),
        ]),
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241] },
        styles: { fontSize: 8 },
      });

      doc.save(`relatorio-agente-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success('PDF exportado!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao gerar PDF');
    } finally {
      setExportando(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileDown className="h-5 w-5" />
            Exportar Relatórios do Agente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Período</Label>
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="15">Últimos 15 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="365">Último ano</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{conversas.length} conversas no período selecionado</span>
          </div>

          <div className="flex gap-3">
            <Button onClick={exportPDF} disabled={exportando}>
              {exportando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileDown className="h-4 w-4 mr-2" />}
              Exportar PDF
            </Button>
            <Button variant="outline" onClick={exportCSV}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Prévia do Relatório</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{stats?.total || 0}</p>
              <p className="text-sm text-muted-foreground">Total Conversas</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{stats?.npsScore != null ? `${stats.npsScore.toFixed(0)}` : '-'}</p>
              <p className="text-sm text-muted-foreground">NPS Score</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{stats?.totalMensagens || 0}</p>
              <p className="text-sm text-muted-foreground">Total Mensagens</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
