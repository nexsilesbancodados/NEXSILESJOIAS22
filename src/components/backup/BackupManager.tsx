import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, 
  Upload, 
  Database, 
  FileJson, 
  FileSpreadsheet, 
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Package,
  FileDown,
  HelpCircle,
  ArrowRight,
  Users,
  ShoppingBag
} from 'lucide-react';
import { toast } from 'sonner';
import { db, supabase } from '@/lib/supabase-db';
import { useAuth } from '@/contexts/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type ExportFormat = 'json' | 'csv' | 'pdf';
type ImportType = 'pecas' | 'clientes' | 'fornecedores';

interface TableOption {
  id: string;
  name: string;
  description: string;
}

const AVAILABLE_TABLES: TableOption[] = [
  { id: 'pecas', name: 'Peças', description: 'Catálogo de produtos' },
  { id: 'clientes', name: 'Clientes', description: 'Cadastro de clientes' },
  { id: 'fornecedores', name: 'Fornecedores', description: 'Cadastro de fornecedores' },
  { id: 'vendas', name: 'Vendas', description: 'Histórico de vendas' },
  { id: 'venda_itens', name: 'Itens de Vendas', description: 'Detalhes das vendas' },
  { id: 'romaneios', name: 'Romaneios', description: 'Romaneios de entrega' },
  { id: 'romaneio_itens', name: 'Itens de Romaneios', description: 'Detalhes dos romaneios' },
  { id: 'banhos', name: 'Banhos', description: 'Registro de banhos galvânicos' },
  { id: 'maletas', name: 'Maletas', description: 'Maletas de revendedoras' },
  { id: 'maleta_itens', name: 'Itens de Maletas', description: 'Peças nas maletas' },
  { id: 'catalogos', name: 'Catálogos', description: 'Catálogos online' },
  { id: 'catalogo_itens', name: 'Itens de Catálogos', description: 'Peças nos catálogos' },
  { id: 'configuracoes', name: 'Configurações', description: 'Configurações do sistema' },
  { id: 'metas', name: 'Metas', description: 'Metas de vendas' },
];

// CSV Templates for importing from other systems
const IMPORT_TEMPLATES = {
  pecas: {
    name: 'Peças/Produtos',
    icon: ShoppingBag,
    requiredColumns: ['nome', 'codigo', 'preco_venda'],
    optionalColumns: ['preco_custo', 'estoque', 'categoria', 'banho', 'numeracao', 'estoque_minimo'],
    example: [
      { nome: 'Anel Solitário', codigo: 'AN001', preco_venda: '89.90', preco_custo: '35.00', estoque: '10', categoria: 'Anéis', banho: 'Ouro 18k', numeracao: '18' },
      { nome: 'Colar Pingente', codigo: 'CL001', preco_venda: '129.90', preco_custo: '50.00', estoque: '5', categoria: 'Colares', banho: 'Prata', numeracao: '' },
    ]
  },
  clientes: {
    name: 'Clientes',
    icon: Users,
    requiredColumns: ['nome'],
    optionalColumns: ['email', 'telefone', 'cpf', 'endereco', 'data_nascimento'],
    example: [
      { nome: 'Maria Silva', email: 'maria@email.com', telefone: '11999999999', cpf: '123.456.789-00', endereco: 'Rua A, 123', data_nascimento: '1990-01-15' },
      { nome: 'João Santos', email: 'joao@email.com', telefone: '11888888888', cpf: '', endereco: '', data_nascimento: '' },
    ]
  },
  fornecedores: {
    name: 'Fornecedores',
    icon: Package,
    requiredColumns: ['nome'],
    optionalColumns: ['email', 'telefone', 'cnpj', 'endereco'],
    example: [
      { nome: 'Fornecedor ABC', email: 'contato@abc.com', telefone: '1133334444', cnpj: '12.345.678/0001-00', endereco: 'Rua Industrial, 500' },
    ]
  }
};

export function BackupManager() {
  const { user } = useAuth();
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');
  const [selectedTables, setSelectedTables] = useState<string[]>(AVAILABLE_TABLES.map(t => t.id));
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isImportingExternal, setIsImportingExternal] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [selectedImportType, setSelectedImportType] = useState<ImportType>('pecas');
  const [importResults, setImportResults] = useState<{ success: number; errors: number } | null>(null);

  const toggleTable = (tableId: string) => {
    setSelectedTables(prev => 
      prev.includes(tableId) 
        ? prev.filter(t => t !== tableId)
        : [...prev, tableId]
    );
  };

  const selectAll = () => {
    setSelectedTables(AVAILABLE_TABLES.map(t => t.id));
  };

  const deselectAll = () => {
    setSelectedTables([]);
  };

  const fetchTableData = async (tableName: string) => {
    const { data, error } = await db
      .from(tableName)
      .select('*');
    
    if (error) {
      console.error(`Error fetching ${tableName}:`, error);
      return [];
    }
    return data || [];
  };

  const exportToJSON = (data: Record<string, any[]>, filename: string) => {
    const backup = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      tables: data
    };
    
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToCSV = (data: Record<string, any[]>, filename: string) => {
    // Create a ZIP-like structure with multiple CSV files in a single download
    // For simplicity, we'll create a combined CSV with sections
    const BOM = '\uFEFF';
    let csvContent = BOM;
    
    Object.entries(data).forEach(([tableName, rows]) => {
      if (rows.length === 0) return;
      
      csvContent += `\n=== ${tableName.toUpperCase()} ===\n`;
      
      const headers = Object.keys(rows[0]);
      csvContent += headers.map(h => escapeCSVField(h)).join(',') + '\n';
      
      rows.forEach(row => {
        csvContent += headers.map(h => escapeCSVField(String(row[h] ?? ''))).join(',') + '\n';
      });
      
      csvContent += '\n';
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const escapeCSVField = (field: string): string => {
    if (field.includes(',') || field.includes('\n') || field.includes('"')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  };

  const exportToPDF = (data: Record<string, any[]>, filename: string) => {
    const doc = new jsPDF();
    let yPosition = 20;
    
    doc.setFontSize(18);
    doc.text('Backup do Sistema', 14, yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, yPosition);
    yPosition += 15;
    
    Object.entries(data).forEach(([tableName, rows]) => {
      if (rows.length === 0) return;
      
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.text(tableName.charAt(0).toUpperCase() + tableName.slice(1), 14, yPosition);
      yPosition += 8;
      
      const headers = Object.keys(rows[0]).slice(0, 6); // Limit columns for PDF
      const tableData = rows.map(row => 
        headers.map(h => {
          const val = String(row[h] ?? '');
          return val.length > 30 ? val.substring(0, 27) + '...' : val;
        })
      );
      
      autoTable(doc, {
        head: [headers],
        body: tableData.slice(0, 50), // Limit rows per table
        startY: yPosition,
        styles: { fontSize: 7, cellPadding: 1 },
        headStyles: { fillColor: [212, 175, 55], textColor: [0, 0, 0] },
        margin: { left: 14 },
      });
      
      yPosition = (doc as any).lastAutoTable.finalY + 15;
    });
    
    doc.save(`${filename}.pdf`);
  };

  const handleExport = async () => {
    if (selectedTables.length === 0) {
      toast.error('Selecione pelo menos uma tabela');
      return;
    }

    setIsExporting(true);
    setProgress(0);
    setStatus('idle');

    try {
      const data: Record<string, any[]> = {};
      
      for (let i = 0; i < selectedTables.length; i++) {
        const tableName = selectedTables[i];
        data[tableName] = await fetchTableData(tableName);
        setProgress(((i + 1) / selectedTables.length) * 100);
      }

      const filename = `backup_${new Date().toISOString().split('T')[0]}`;

      switch (exportFormat) {
        case 'json':
          exportToJSON(data, filename);
          break;
        case 'csv':
          exportToCSV(data, filename);
          break;
        case 'pdf':
          exportToPDF(data, filename);
          break;
      }

      setStatus('success');
      toast.success('Backup exportado com sucesso!');
    } catch (error) {
      console.error('Export error:', error);
      setStatus('error');
      toast.error('Erro ao exportar backup');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast.error('Apenas arquivos JSON são suportados para importação');
      return;
    }

    setIsImporting(true);
    setProgress(0);
    setStatus('idle');

    try {
      const content = await file.text();
      const backup = JSON.parse(content);

      if (!backup.tables) {
        throw new Error('Formato de backup inválido');
      }

      const tables = Object.keys(backup.tables);
      let imported = 0;
      let errors = 0;

      for (let i = 0; i < tables.length; i++) {
        const tableName = tables[i];
        const rows = backup.tables[tableName];

        if (!Array.isArray(rows) || rows.length === 0) continue;

        // Upsert data - this will update existing records or insert new ones
        for (const row of rows) {
          // Remove user_id from data as it should be set by RLS
          const cleanRow = { ...row };
          if (cleanRow.user_id) {
            cleanRow.user_id = user?.id;
          }
          
          const { error } = await db
            .from(tableName)
            .upsert(cleanRow, { onConflict: 'id' });

          if (error) {
            console.error(`Error importing ${tableName}:`, error);
            errors++;
          } else {
            imported++;
          }
        }

        setProgress(((i + 1) / tables.length) * 100);
      }

      if (errors > 0) {
        setStatus('error');
        toast.warning(`Importação concluída com ${errors} erros. ${imported} registros importados.`);
      } else {
        setStatus('success');
        toast.success(`Backup importado com sucesso! ${imported} registros restaurados.`);
      }
    } catch (error) {
      console.error('Import error:', error);
      setStatus('error');
      toast.error('Erro ao importar backup. Verifique o formato do arquivo.');
    } finally {
      setIsImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Export Section */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            <CardTitle className="font-display">Exportar Backup</CardTitle>
          </div>
          <CardDescription>Baixe uma cópia de segurança dos seus dados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Formato de Exportação</Label>
            <RadioGroup
              value={exportFormat}
              onValueChange={(value) => setExportFormat(value as ExportFormat)}
              className="grid grid-cols-3 gap-4"
            >
              <div>
                <RadioGroupItem value="json" id="json" className="peer sr-only" />
                <Label
                  htmlFor="json"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <FileJson className="mb-2 h-6 w-6 text-blue-500" />
                  <span className="text-sm font-medium">JSON</span>
                  <span className="text-xs text-muted-foreground">Completo</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="csv" id="csv" className="peer sr-only" />
                <Label
                  htmlFor="csv"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <FileSpreadsheet className="mb-2 h-6 w-6 text-green-500" />
                  <span className="text-sm font-medium">CSV</span>
                  <span className="text-xs text-muted-foreground">Excel</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="pdf" id="pdf" className="peer sr-only" />
                <Label
                  htmlFor="pdf"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <FileText className="mb-2 h-6 w-6 text-red-500" />
                  <span className="text-sm font-medium">PDF</span>
                  <span className="text-xs text-muted-foreground">Relatório</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Table Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Tabelas para Exportar</Label>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={selectAll}>
                  Selecionar Tudo
                </Button>
                <Button variant="ghost" size="sm" onClick={deselectAll}>
                  Limpar
                </Button>
              </div>
            </div>
            <ScrollArea className="h-48 rounded-md border p-4">
              <div className="grid grid-cols-2 gap-3">
                {AVAILABLE_TABLES.map((table) => (
                  <div key={table.id} className="flex items-start space-x-3">
                    <Checkbox
                      id={table.id}
                      checked={selectedTables.includes(table.id)}
                      onCheckedChange={() => toggleTable(table.id)}
                    />
                    <div className="grid gap-0.5 leading-none">
                      <label
                        htmlFor={table.id}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {table.name}
                      </label>
                      <p className="text-xs text-muted-foreground">
                        {table.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Progress */}
          {isExporting && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Exportando dados...
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Status */}
          {status === 'success' && !isExporting && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="w-4 h-4" />
              Exportação concluída com sucesso!
            </div>
          )}

          {/* Export Button */}
          <Button
            onClick={handleExport}
            disabled={isExporting || selectedTables.length === 0}
            className="w-full"
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Exportar Backup ({selectedTables.length} tabelas)
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Import Section */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            <CardTitle className="font-display">Importar Backup</CardTitle>
          </div>
          <CardDescription>Restaure dados de um backup anterior (apenas JSON)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
            <Package className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-4">
              Selecione um arquivo JSON de backup para restaurar
            </p>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              disabled={isImporting}
              className="hidden"
              id="backup-import"
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById('backup-import')?.click()}
              disabled={isImporting}
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Selecionar Arquivo
                </>
              )}
            </Button>
          </div>

          {/* Import Progress */}
          {isImporting && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Importando dados...
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
            <AlertCircle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
            <div className="text-xs text-muted-foreground">
              <strong className="text-foreground">Atenção:</strong> A importação irá sobrescrever 
              dados existentes com o mesmo ID. Faça um backup antes de importar.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Import from External Systems */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            <CardTitle className="font-display">Importar de Outros Sistemas</CardTitle>
          </div>
          <CardDescription>Importe dados de planilhas ou outros sistemas usando templates CSV</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Instructions */}
          <div className="p-4 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2 mb-3">
              <HelpCircle className="w-5 h-5 text-primary" />
              <span className="font-medium">Como funciona:</span>
            </div>
            <ol className="space-y-2 text-sm text-muted-foreground ml-7">
              <li className="flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold">1</span>
                Baixe o template CSV do tipo de dados que deseja importar
              </li>
              <li className="flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold">2</span>
                Preencha com os dados (pode usar Excel ou Google Sheets)
              </li>
              <li className="flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold">3</span>
                Salve como .csv (separado por vírgula, UTF-8)
              </li>
              <li className="flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold">4</span>
                Faça upload do arquivo aqui
              </li>
            </ol>
          </div>

          {/* Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Tipo de Dados</Label>
            <div className="grid grid-cols-3 gap-3">
              {(Object.keys(IMPORT_TEMPLATES) as ImportType[]).map((type) => {
                const template = IMPORT_TEMPLATES[type];
                const Icon = template.icon;
                return (
                  <button
                    key={type}
                    onClick={() => setSelectedImportType(type)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      selectedImportType === type
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Icon className="w-6 h-6 text-primary" />
                    <span className="text-sm font-medium">{template.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Template Info */}
          {selectedImportType && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg border bg-card">
                <h4 className="font-medium mb-3">Colunas do Template</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-muted-foreground">Obrigatórias:</span>
                    {IMPORT_TEMPLATES[selectedImportType].requiredColumns.map(col => (
                      <Badge key={col} variant="default" className="text-xs">{col}</Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-muted-foreground">Opcionais:</span>
                    {IMPORT_TEMPLATES[selectedImportType].optionalColumns.map(col => (
                      <Badge key={col} variant="outline" className="text-xs">{col}</Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Download Template Button */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => downloadTemplate(selectedImportType)}
              >
                <FileDown className="mr-2 h-4 w-4" />
                Baixar Template de {IMPORT_TEMPLATES[selectedImportType].name}
              </Button>
            </div>
          )}

          {/* Upload Area */}
          <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
            <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-4">
              Arraste um arquivo CSV ou clique para selecionar
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleExternalImport}
              disabled={isImportingExternal}
              className="hidden"
              id="external-import"
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById('external-import')?.click()}
              disabled={isImportingExternal}
            >
              {isImportingExternal ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Selecionar Arquivo CSV
                </>
              )}
            </Button>
          </div>

          {/* Import Progress */}
          {isImportingExternal && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Importando dados...
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Import Results */}
          {importResults && !isImportingExternal && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              importResults.errors > 0 
                ? 'bg-warning/10 border border-warning/20' 
                : 'bg-green-500/10 border border-green-500/20'
            }`}>
              {importResults.errors > 0 ? (
                <AlertCircle className="w-4 h-4 text-warning" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              )}
              <span className="text-sm">
                <strong>{importResults.success}</strong> registros importados
                {importResults.errors > 0 && (
                  <>, <strong className="text-warning">{importResults.errors}</strong> erros</>
                )}
              </span>
            </div>
          )}

          {/* Tips */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <HelpCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-xs text-muted-foreground">
              <strong className="text-foreground">Dica:</strong> Se estiver vindo de outro sistema, 
              exporte seus dados em CSV e reorganize as colunas conforme o template. 
              Colunas extras serão ignoradas.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Helper function to download template
  function downloadTemplate(type: ImportType) {
    const template = IMPORT_TEMPLATES[type];
    const allColumns = [...template.requiredColumns, ...template.optionalColumns];
    
    const BOM = '\uFEFF';
    const headers = allColumns.join(',');
    const exampleRows = template.example.map(row => 
      allColumns.map(col => escapeCSVField(String(row[col as keyof typeof row] ?? ''))).join(',')
    ).join('\n');
    
    const csvContent = BOM + headers + '\n' + exampleRows;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `template_${type}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Template baixado! Preencha e faça upload.');
  }

  // Parse CSV content
  function parseCSV(content: string): Record<string, string>[] {
    const lines = content.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
    const rows: Record<string, string>[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === 0) continue;
      
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index]?.trim().replace(/^"|"$/g, '') || '';
      });
      rows.push(row);
    }
    
    return rows;
  }

  // Parse a single CSV line handling quoted fields
  function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    
    return result;
  }

  // Handle external system import
  async function handleExternalImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImportingExternal(true);
    setProgress(0);
    setImportResults(null);

    try {
      const content = await file.text();
      const rows = parseCSV(content);
      
      if (rows.length === 0) {
        throw new Error('Arquivo vazio ou formato inválido');
      }

      const template = IMPORT_TEMPLATES[selectedImportType];
      
      // Validate required columns
      const firstRow = rows[0];
      const missingColumns = template.requiredColumns.filter(col => !(col in firstRow));
      
      if (missingColumns.length > 0) {
        throw new Error(`Colunas obrigatórias faltando: ${missingColumns.join(', ')}`);
      }

      let success = 0;
      let errors = 0;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        
        try {
          const data = mapRowToTable(row, selectedImportType);
          
          const { error } = await db
            .from(selectedImportType)
            .insert(data);

          if (error) {
            console.error(`Error inserting row ${i + 1}:`, error);
            errors++;
          } else {
            success++;
          }
        } catch (err) {
          console.error(`Error processing row ${i + 1}:`, err);
          errors++;
        }

        setProgress(((i + 1) / rows.length) * 100);
      }

      setImportResults({ success, errors });
      
      if (errors > 0) {
        toast.warning(`Importação concluída: ${success} ok, ${errors} erros`);
      } else {
        toast.success(`${success} registros importados com sucesso!`);
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao importar arquivo');
    } finally {
      setIsImportingExternal(false);
      event.target.value = '';
    }
  }

  // Map CSV row to table structure
  function mapRowToTable(row: Record<string, string>, type: ImportType): Record<string, any> {
    switch (type) {
      case 'pecas':
        return {
          nome: row.nome,
          codigo: row.codigo || row.sku || `PEC${Date.now()}`,
          preco_venda: parseFloat(row.preco_venda?.replace(',', '.')) || 0,
          preco_custo: parseFloat(row.preco_custo?.replace(',', '.')) || 0,
          estoque: parseInt(row.estoque) || 0,
          categoria: row.categoria || null,
          banho: row.banho || null,
          numeracao: row.numeracao || null,
          estoque_minimo: parseInt(row.estoque_minimo) || 5,
          user_id: user?.id,
        };
      case 'clientes':
        return {
          nome: row.nome,
          email: row.email || null,
          telefone: row.telefone || null,
          cpf: row.cpf || null,
          endereco: row.endereco || null,
          data_nascimento: row.data_nascimento || null,
          user_id: user?.id,
        };
      case 'fornecedores':
        return {
          nome: row.nome,
          email: row.email || null,
          telefone: row.telefone || null,
          cnpj: row.cnpj || null,
          endereco: row.endereco || null,
          user_id: user?.id,
        };
      default:
        return row;
    }
  }
}
