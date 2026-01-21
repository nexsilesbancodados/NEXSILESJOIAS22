import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  FileSpreadsheet,
  FileText,
  Download,
  Save,
  Calendar as CalendarIcon,
  Settings2,
  ArrowUpDown,
  Loader2,
  Trash2,
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { exportToCSV, exportToPDF, formatCurrency, formatDate } from '@/lib/export';
import type { DateRange } from 'react-day-picker';

interface ExportBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Data sources
  vendas?: any[];
  pecas?: any[];
  revendedoras?: any[];
  romaneios?: any[];
  clientes?: any[];
}

interface ExportColumn {
  id: string;
  label: string;
  accessor: string;
  format?: 'currency' | 'date' | 'datetime' | 'number' | 'text';
  selected: boolean;
}

interface ExportTemplate {
  id: string;
  name: string;
  dataType: string;
  columns: string[];
  dateRange: DateRange | null;
}

const DATA_TYPES = [
  { id: 'vendas', label: 'Vendas' },
  { id: 'pecas', label: 'Peças / Estoque' },
  { id: 'revendedoras', label: 'Revendedoras' },
  { id: 'romaneios', label: 'Romaneios' },
  { id: 'clientes', label: 'Clientes' },
];

const COLUMN_DEFINITIONS: Record<string, ExportColumn[]> = {
  vendas: [
    { id: 'id', label: 'ID', accessor: 'id', format: 'text', selected: false },
    { id: 'created_at', label: 'Data', accessor: 'created_at', format: 'datetime', selected: true },
    { id: 'cliente_nome', label: 'Cliente', accessor: 'cliente_nome', format: 'text', selected: true },
    { id: 'total', label: 'Total', accessor: 'total', format: 'currency', selected: true },
    { id: 'desconto', label: 'Desconto', accessor: 'desconto', format: 'currency', selected: true },
    { id: 'forma_pagamento', label: 'Forma Pagamento', accessor: 'forma_pagamento', format: 'text', selected: true },
    { id: 'status', label: 'Status', accessor: 'status', format: 'text', selected: true },
  ],
  pecas: [
    { id: 'codigo', label: 'Código', accessor: 'codigo', format: 'text', selected: true },
    { id: 'nome', label: 'Nome', accessor: 'nome', format: 'text', selected: true },
    { id: 'categoria', label: 'Categoria', accessor: 'categoria', format: 'text', selected: true },
    { id: 'material', label: 'Material', accessor: 'material', format: 'text', selected: true },
    { id: 'estoque', label: 'Estoque', accessor: 'estoque', format: 'number', selected: true },
    { id: 'estoque_minimo', label: 'Estoque Mínimo', accessor: 'estoque_minimo', format: 'number', selected: false },
    { id: 'preco_custo', label: 'Preço Custo', accessor: 'preco_custo', format: 'currency', selected: true },
    { id: 'preco_venda', label: 'Preço Venda', accessor: 'preco_venda', format: 'currency', selected: true },
  ],
  revendedoras: [
    { id: 'nome', label: 'Nome', accessor: 'nome', format: 'text', selected: true },
    { id: 'email', label: 'Email', accessor: 'email', format: 'text', selected: true },
    { id: 'telefone', label: 'Telefone', accessor: 'telefone', format: 'text', selected: true },
    { id: 'cidade', label: 'Cidade', accessor: 'cidade', format: 'text', selected: true },
    { id: 'estado', label: 'Estado', accessor: 'estado', format: 'text', selected: true },
    { id: 'comissao', label: 'Comissão %', accessor: 'comissao', format: 'number', selected: true },
    { id: 'ativa', label: 'Ativa', accessor: 'ativa', format: 'text', selected: true },
  ],
  romaneios: [
    { id: 'id', label: 'ID', accessor: 'id', format: 'text', selected: false },
    { id: 'data', label: 'Data', accessor: 'data', format: 'date', selected: true },
    { id: 'revendedora_nome', label: 'Revendedora', accessor: 'revendedora_nome', format: 'text', selected: true },
    { id: 'total', label: 'Total', accessor: 'total', format: 'currency', selected: true },
    { id: 'comissao', label: 'Comissão', accessor: 'comissao', format: 'currency', selected: true },
    { id: 'status', label: 'Status', accessor: 'status', format: 'text', selected: true },
  ],
  clientes: [
    { id: 'nome', label: 'Nome', accessor: 'nome', format: 'text', selected: true },
    { id: 'email', label: 'Email', accessor: 'email', format: 'text', selected: true },
    { id: 'telefone', label: 'Telefone', accessor: 'telefone', format: 'text', selected: true },
    { id: 'cpf', label: 'CPF', accessor: 'cpf', format: 'text', selected: true },
    { id: 'cidade', label: 'Cidade', accessor: 'cidade', format: 'text', selected: true },
    { id: 'estado', label: 'Estado', accessor: 'estado', format: 'text', selected: true },
    { id: 'data_nascimento', label: 'Aniversário', accessor: 'data_nascimento', format: 'date', selected: false },
  ],
};

const STORAGE_KEY = 'nexsile_export_templates';

export function ExportBuilder({
  open,
  onOpenChange,
  vendas = [],
  pecas = [],
  revendedoras = [],
  romaneios = [],
  clientes = [],
}: ExportBuilderProps) {
  const [dataType, setDataType] = useState('vendas');
  const [columns, setColumns] = useState<ExportColumn[]>(COLUMN_DEFINITIONS.vendas);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [templateName, setTemplateName] = useState('');
  const [savedTemplates, setSavedTemplates] = useState<ExportTemplate[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [isExporting, setIsExporting] = useState(false);

  // Get data based on selected type
  const sourceData = useMemo(() => {
    const dataMap: Record<string, any[]> = {
      vendas,
      pecas,
      revendedoras,
      romaneios,
      clientes,
    };
    return dataMap[dataType] || [];
  }, [dataType, vendas, pecas, revendedoras, romaneios, clientes]);

  // Filter data by date range (for types that have dates)
  const filteredData = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return sourceData;
    if (!['vendas', 'romaneios'].includes(dataType)) return sourceData;

    return sourceData.filter((item) => {
      const itemDate = new Date(item.created_at || item.data);
      return itemDate >= dateRange.from! && itemDate <= dateRange.to!;
    });
  }, [sourceData, dateRange, dataType]);

  // Handle data type change
  const handleDataTypeChange = (type: string) => {
    setDataType(type);
    setColumns(COLUMN_DEFINITIONS[type] || []);
  };

  // Toggle column selection
  const toggleColumn = (columnId: string) => {
    setColumns(
      columns.map((col) =>
        col.id === columnId ? { ...col, selected: !col.selected } : col
      )
    );
  };

  // Select all / deselect all
  const toggleAllColumns = (selected: boolean) => {
    setColumns(columns.map((col) => ({ ...col, selected })));
  };

  // Format value based on column format
  const formatValue = (value: any, format?: string): string => {
    if (value === null || value === undefined) return '';
    switch (format) {
      case 'currency':
        return formatCurrency(value);
      case 'date':
        return formatDate(value);
      case 'datetime':
        return new Date(value).toLocaleString('pt-BR');
      case 'number':
        return String(value);
      default:
        return String(value);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    setIsExporting(true);
    try {
      const selectedColumns = columns.filter((c) => c.selected);
      const exportColumns = selectedColumns.map((col) => ({
        header: col.label,
        accessor: col.accessor,
        format: (v: any) => formatValue(v, col.format),
      }));

      const filename = `${dataType}-${format(new Date(), 'yyyy-MM-dd')}`;
      exportToCSV(filteredData, exportColumns, filename);
      toast.success('Arquivo CSV exportado com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar CSV');
    } finally {
      setIsExporting(false);
    }
  };

  // Export to PDF
  const handleExportPDF = () => {
    setIsExporting(true);
    try {
      const selectedColumns = columns.filter((c) => c.selected);
      const exportColumns = selectedColumns.map((col) => ({
        header: col.label,
        accessor: col.accessor,
        format: (v: any) => formatValue(v, col.format),
      }));

      const typeLabel = DATA_TYPES.find((t) => t.id === dataType)?.label || dataType;
      const filename = `${dataType}-${format(new Date(), 'yyyy-MM-dd')}`;
      const title = `Relatório de ${typeLabel}`;
      
      exportToPDF(filteredData, exportColumns, filename, title);
      toast.success('Arquivo PDF exportado com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar PDF');
    } finally {
      setIsExporting(false);
    }
  };

  // Save template
  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      toast.error('Digite um nome para o template');
      return;
    }

    const newTemplate: ExportTemplate = {
      id: Date.now().toString(),
      name: templateName,
      dataType,
      columns: columns.filter((c) => c.selected).map((c) => c.id),
      dateRange: dateRange || null,
    };

    const updatedTemplates = [...savedTemplates, newTemplate];
    setSavedTemplates(updatedTemplates);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTemplates));
    setTemplateName('');
    toast.success('Template salvo com sucesso!');
  };

  // Load template
  const handleLoadTemplate = (template: ExportTemplate) => {
    setDataType(template.dataType);
    const baseColumns = COLUMN_DEFINITIONS[template.dataType] || [];
    setColumns(
      baseColumns.map((col) => ({
        ...col,
        selected: template.columns.includes(col.id),
      }))
    );
    if (template.dateRange) {
      setDateRange({
        from: template.dateRange.from ? new Date(template.dateRange.from) : undefined,
        to: template.dateRange.to ? new Date(template.dateRange.to) : undefined,
      });
    }
    toast.success(`Template "${template.name}" carregado`);
  };

  // Delete template
  const handleDeleteTemplate = (templateId: string) => {
    const updatedTemplates = savedTemplates.filter((t) => t.id !== templateId);
    setSavedTemplates(updatedTemplates);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTemplates));
    toast.success('Template excluído');
  };

  const selectedCount = columns.filter((c) => c.selected).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5" />
            Exportação Avançada
          </DialogTitle>
          <DialogDescription>
            Configure e exporte relatórios personalizados
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="config" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="config">Configurar Relatório</TabsTrigger>
            <TabsTrigger value="templates">Templates Salvos</TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="flex-1 overflow-hidden flex flex-col">
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Data Type Selection */}
              <div className="space-y-2">
                <Label>Tipo de Dados</Label>
                <Select value={dataType} onValueChange={handleDataTypeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DATA_TYPES.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range (for applicable types) */}
              {['vendas', 'romaneios'].includes(dataType) && (
                <div className="space-y-2">
                  <Label>Período</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, 'dd/MM/yy')} - {format(dateRange.to, 'dd/MM/yy')}
                            </>
                          ) : (
                            format(dateRange.from, 'dd/MM/yyyy')
                          )
                        ) : (
                          'Selecionar período'
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>

            {/* Column Selection */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <Label>Colunas ({selectedCount} selecionadas)</Label>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleAllColumns(true)}
                  >
                    Selecionar Todas
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleAllColumns(false)}
                  >
                    Limpar
                  </Button>
                </div>
              </div>
              <ScrollArea className="flex-1 border rounded-lg p-3">
                <div className="grid grid-cols-2 gap-2">
                  {columns.map((column) => (
                    <div
                      key={column.id}
                      className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50"
                    >
                      <Checkbox
                        id={column.id}
                        checked={column.selected}
                        onCheckedChange={() => toggleColumn(column.id)}
                      />
                      <label
                        htmlFor={column.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                      >
                        {column.label}
                      </label>
                      {column.format && (
                        <Badge variant="secondary" className="text-xs">
                          {column.format}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Preview Count */}
            <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm">
              <span className="font-medium">{filteredData.length}</span> registros serão exportados
            </div>

            {/* Save Template */}
            <div className="flex items-center gap-2 mt-4">
              <Input
                placeholder="Nome do template..."
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline" onClick={handleSaveTemplate} className="gap-2">
                <Save className="w-4 h-4" />
                Salvar Template
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="templates" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              {savedTemplates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum template salvo
                </div>
              ) : (
                <div className="space-y-2 p-1">
                  {savedTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <div>
                        <p className="font-medium">{template.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {DATA_TYPES.find((t) => t.id === template.dataType)?.label} •{' '}
                          {template.columns.length} colunas
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleLoadTemplate(template)}
                        >
                          Carregar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={selectedCount === 0 || isExporting}
            className="gap-2"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
            CSV
          </Button>
          <Button
            onClick={handleExportPDF}
            disabled={selectedCount === 0 || isExporting}
            className="btn-gold gap-2"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
