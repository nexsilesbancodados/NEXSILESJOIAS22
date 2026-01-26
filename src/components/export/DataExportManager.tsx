import { useState } from 'react';
import { Download, FileSpreadsheet, FileJson, Users, ShoppingCart, Briefcase, History, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { db } from '@/lib/supabase-db';
import { exportToCSV, exportToPDF, formatCurrency, formatDate } from '@/lib/export';

interface ExportOption {
  id: string;
  label: string;
  description: string;
  icon: typeof Users;
  table: string;
  columns: { header: string; accessor: string; format?: (value: unknown) => string }[];
}

const exportOptions: ExportOption[] = [
  {
    id: 'clientes',
    label: 'Clientes',
    description: 'Base de clientes com contatos',
    icon: Users,
    table: 'clientes',
    columns: [
      { header: 'Nome', accessor: 'nome' },
      { header: 'Email', accessor: 'email' },
      { header: 'Telefone', accessor: 'telefone' },
      { header: 'WhatsApp', accessor: 'whatsapp' },
      { header: 'CPF', accessor: 'cpf' },
      { header: 'Data Nascimento', accessor: 'data_nascimento', format: formatDate },
      { header: 'Cidade', accessor: 'cidade' },
      { header: 'Estado', accessor: 'estado' },
      { header: 'Endereço', accessor: 'endereco' },
      { header: 'CEP', accessor: 'cep' },
      { header: 'Pontos Fidelidade', accessor: 'pontos_fidelidade' },
      { header: 'Ativo', accessor: 'ativo', format: (v) => v ? 'Sim' : 'Não' },
    ],
  },
  {
    id: 'revendedoras',
    label: 'Revendedoras',
    description: 'Cadastro de revendedoras',
    icon: Briefcase,
    table: 'revendedoras',
    columns: [
      { header: 'Nome', accessor: 'nome' },
      { header: 'Email', accessor: 'email' },
      { header: 'Telefone', accessor: 'telefone' },
      { header: 'WhatsApp', accessor: 'whatsapp' },
      { header: 'CPF', accessor: 'cpf' },
      { header: 'Data Nascimento', accessor: 'data_nascimento', format: formatDate },
      { header: 'Cidade', accessor: 'cidade' },
      { header: 'Estado', accessor: 'estado' },
      { header: 'Comissão %', accessor: 'comissao_percentual' },
      { header: 'Saldo Comissão', accessor: 'saldo_comissao', format: formatCurrency },
      { header: 'Ativo', accessor: 'ativo', format: (v) => v ? 'Sim' : 'Não' },
    ],
  },
  {
    id: 'vendas',
    label: 'Vendas',
    description: 'Histórico de vendas',
    icon: ShoppingCart,
    table: 'vendas',
    columns: [
      { header: 'Número', accessor: 'numero' },
      { header: 'Data', accessor: 'data_venda', format: formatDate },
      { header: 'Subtotal', accessor: 'subtotal', format: formatCurrency },
      { header: 'Desconto', accessor: 'desconto', format: formatCurrency },
      { header: 'Valor Total', accessor: 'valor_total', format: formatCurrency },
      { header: 'Forma Pagamento', accessor: 'forma_pagamento' },
      { header: 'Parcelas', accessor: 'parcelas' },
      { header: 'Status', accessor: 'status' },
    ],
  },
  {
    id: 'historico',
    label: 'Histórico de Atividades',
    description: 'Log de alterações do sistema',
    icon: History,
    table: 'historico_atividades',
    columns: [
      { header: 'Data', accessor: 'created_at', format: formatDate },
      { header: 'Tabela', accessor: 'tabela' },
      { header: 'Ação', accessor: 'acao' },
      { header: 'Registro ID', accessor: 'registro_id' },
    ],
  },
];

type ExportFormat = 'csv' | 'json' | 'pdf';

export function DataExportManager() {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [isExporting, setIsExporting] = useState(false);
  const [exportedItems, setExportedItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedItems.length === exportOptions.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(exportOptions.map(o => o.id));
    }
  };

  const exportData = async () => {
    if (selectedItems.length === 0) {
      toast.error('Selecione pelo menos um tipo de dado para exportar');
      return;
    }

    setIsExporting(true);
    setExportedItems([]);

    try {
      for (const itemId of selectedItems) {
        const option = exportOptions.find(o => o.id === itemId);
        if (!option) continue;

        const { data, error } = await db
          .from(option.table)
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error(`Erro ao exportar ${option.label}:`, error);
          toast.error(`Erro ao exportar ${option.label}`);
          continue;
        }

        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `${option.id}_${timestamp}`;

        if (format === 'csv') {
          exportToCSV(data || [], option.columns, filename);
        } else if (format === 'json') {
          exportToJSON(data || [], filename);
        } else if (format === 'pdf') {
          exportToPDF(data || [], option.columns, filename, option.label);
        }

        setExportedItems(prev => [...prev, itemId]);
        
        // Small delay between exports
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      toast.success(`${selectedItems.length} arquivo(s) exportado(s) com sucesso!`);
    } catch (error) {
      console.error('Erro na exportação:', error);
      toast.error('Erro durante a exportação');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Download className="w-5 h-5 text-primary" />
          <CardTitle className="font-display">Exportar Dados</CardTitle>
        </div>
        <CardDescription>
          Exporte seus dados para backup ou portabilidade
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Data selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Selecione os dados</Label>
            <Button variant="ghost" size="sm" onClick={selectAll}>
              {selectedItems.length === exportOptions.length ? 'Desmarcar todos' : 'Selecionar todos'}
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {exportOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedItems.includes(option.id);
              const isExported = exportedItems.includes(option.id);
              
              return (
                <div
                  key={option.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => !isExporting && toggleItem(option.id)}
                >
                  <Checkbox
                    checked={isSelected}
                    disabled={isExporting}
                    className="pointer-events-none"
                  />
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary/10' : 'bg-muted'}`}>
                    {isExported ? (
                      <CheckCircle className="w-4 h-4 text-success" />
                    ) : (
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{option.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{option.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Format selection */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Formato do arquivo</Label>
          <RadioGroup
            value={format}
            onValueChange={(v) => setFormat(v as ExportFormat)}
            className="flex gap-4"
            disabled={isExporting}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="csv" id="csv" />
              <Label htmlFor="csv" className="flex items-center gap-2 cursor-pointer">
                <FileSpreadsheet className="w-4 h-4 text-success" />
                CSV (Excel)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="json" id="json" />
              <Label htmlFor="json" className="flex items-center gap-2 cursor-pointer">
                <FileJson className="w-4 h-4 text-primary" />
                JSON
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pdf" id="pdf" />
              <Label htmlFor="pdf" className="flex items-center gap-2 cursor-pointer">
                <Download className="w-4 h-4 text-destructive" />
                PDF
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Export button */}
        <Button
          onClick={exportData}
          disabled={selectedItems.length === 0 || isExporting}
          className="w-full gap-2"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Exportando... ({exportedItems.length}/{selectedItems.length})
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Exportar {selectedItems.length > 0 && `(${selectedItems.length})`}
            </>
          )}
        </Button>

        {selectedItems.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedItems.map(id => {
              const option = exportOptions.find(o => o.id === id);
              return option ? (
                <Badge key={id} variant="secondary" className="text-xs">
                  {option.label}
                </Badge>
              ) : null;
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper function for JSON export
function exportToJSON<T>(data: T[], filename: string) {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
