import { useState, useCallback } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  parseCSV,
  validateRow,
  transformRow,
  generateSampleCSV,
  PECA_COLUMNS,
  type CSVParseResult,
} from '@/lib/csv-parser';
import { useAddPeca, usePecas } from '@/hooks/useSupabaseData';

interface ImportacaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ImportStep = 'upload' | 'preview' | 'importing' | 'complete';

interface PreviewRow {
  data: Record<string, string>;
  valid: boolean;
  errors: string[];
}

export function ImportacaoModal({ open, onOpenChange }: ImportacaoModalProps) {
  const { data: pecasExistentes = [] } = usePecas();
  const addPeca = useAddPeca();

  const [step, setStep] = useState<ImportStep>('upload');
  const [parseResult, setParseResult] = useState<CSVParseResult | null>(null);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{
    success: number;
    errors: number;
    errorMessages: string[];
  }>({ success: 0, errors: 0, errorMessages: [] });

  const existingCodes = new Set(pecasExistentes.map((p) => p.codigo.toLowerCase()));

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const result = parseCSV(content);
        setParseResult(result);

        // Validate and create preview
        const preview: PreviewRow[] = result.rows.map((row) => {
          const validation = validateRow(row, PECA_COLUMNS, existingCodes);
          return {
            data: row,
            valid: validation.valid,
            errors: validation.errors,
          };
        });

        setPreviewRows(preview);
        setStep('preview');
      };

      reader.readAsText(file, 'UTF-8');
    },
    [existingCodes]
  );

  const handleDownloadTemplate = () => {
    const csv = generateSampleCSV();
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'template-importacao-pecas.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Template baixado com sucesso!');
  };

  const handleImport = async () => {
    const validRows = previewRows.filter((r) => r.valid);
    if (validRows.length === 0) {
      toast.error('Nenhuma linha válida para importar');
      return;
    }

    setIsImporting(true);
    setStep('importing');
    setImportProgress(0);

    const results = { success: 0, errors: 0, errorMessages: [] as string[] };

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      const transformed = transformRow(row.data, PECA_COLUMNS);

      try {
        await addPeca.mutateAsync({
          nome: transformed.nome || 'Sem nome',
          codigo: transformed.codigo || `IMP-${Date.now()}-${i}`,
          estoque: transformed.estoque || 0,
          estoque_minimo: transformed.estoque_minimo || 5,
          preco_custo: transformed.preco_custo || 0,
          preco_venda: transformed.preco_venda || 0,
          preco_revenda: transformed.preco_venda || 0,
          categoria: transformed.categoria || null,
          subcategoria: null,
          material: transformed.material || null,
          descricao: transformed.descricao || null,
          fornecedor_id: null,
          imagem_url: null,
          peso: null,
          ativo: true,
        });
        results.success++;
      } catch (error: any) {
        results.errors++;
        results.errorMessages.push(`Linha ${i + 1}: ${error.message}`);
      }

      setImportProgress(Math.round(((i + 1) / validRows.length) * 100));
    }

    setImportResults(results);
    setStep('complete');
    setIsImporting(false);
  };

  const handleClose = () => {
    setStep('upload');
    setParseResult(null);
    setPreviewRows([]);
    setImportProgress(0);
    setImportResults({ success: 0, errors: 0, errorMessages: [] });
    onOpenChange(false);
  };

  const validCount = previewRows.filter((r) => r.valid).length;
  const invalidCount = previewRows.filter((r) => !r.valid).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Importar Peças
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Faça upload de um arquivo CSV ou Excel para importar peças em massa'}
            {step === 'preview' && 'Revise os dados antes de confirmar a importação'}
            {step === 'importing' && 'Importando peças...'}
            {step === 'complete' && 'Importação concluída'}
          </DialogDescription>
        </DialogHeader>

        {/* Step: Upload */}
        {step === 'upload' && (
          <div className="flex-1 flex flex-col items-center justify-center py-8 space-y-6">
            <div className="w-full max-w-md">
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-muted-foreground/25 rounded-xl cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors"
              >
                <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-1">
                  Clique para selecionar ou arraste o arquivo
                </p>
                <p className="text-xs text-muted-foreground">
                  Formatos aceitos: CSV, Excel (.xlsx)
                </p>
                <input
                  id="file-upload"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Não tem um arquivo?</span>
              <Button variant="link" size="sm" onClick={handleDownloadTemplate} className="p-0 h-auto">
                <Download className="w-4 h-4 mr-1" />
                Baixar template de exemplo
              </Button>
            </div>
          </div>
        )}

        {/* Step: Preview */}
        {step === 'preview' && parseResult && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Summary */}
            <div className="flex items-center gap-4 mb-4 p-3 bg-muted/50 rounded-lg">
              <Badge variant="outline" className="gap-1">
                <FileSpreadsheet className="w-3 h-3" />
                {previewRows.length} linhas
              </Badge>
              <Badge variant="default" className="gap-1 bg-green-500">
                <CheckCircle2 className="w-3 h-3" />
                {validCount} válidas
              </Badge>
              {invalidCount > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="w-3 h-3" />
                  {invalidCount} com erros
                </Badge>
              )}
            </div>

            {/* Parse Errors */}
            {parseResult.errors.length > 0 && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  {parseResult.errors.length} erro(s) de formatação no arquivo
                </AlertDescription>
              </Alert>
            )}

            {/* Data Preview */}
            <ScrollArea className="flex-1 border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">Status</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead className="text-right">Estoque</TableHead>
                    <TableHead className="text-right">Preço Custo</TableHead>
                    <TableHead className="text-right">Preço Venda</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Erros</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewRows.slice(0, 50).map((row, index) => (
                    <TableRow key={index} className={!row.valid ? 'bg-red-50/50' : ''}>
                      <TableCell>
                        {row.valid ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{row.data.nome || '-'}</TableCell>
                      <TableCell>{row.data.codigo || '-'}</TableCell>
                      <TableCell className="text-right">{row.data.estoque || '0'}</TableCell>
                      <TableCell className="text-right">{row.data.preco_custo || '-'}</TableCell>
                      <TableCell className="text-right">{row.data.preco_venda || '-'}</TableCell>
                      <TableCell>{row.data.categoria || '-'}</TableCell>
                      <TableCell>
                        {row.errors.length > 0 && (
                          <span className="text-xs text-red-600">{row.errors[0]}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {previewRows.length > 50 && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Mostrando 50 de {previewRows.length} linhas
                </div>
              )}
            </ScrollArea>
          </div>
        )}

        {/* Step: Importing */}
        {step === 'importing' && (
          <div className="flex-1 flex flex-col items-center justify-center py-8 space-y-6">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <div className="w-full max-w-md space-y-2">
              <Progress value={importProgress} />
              <p className="text-center text-sm text-muted-foreground">
                Importando... {importProgress}%
              </p>
            </div>
          </div>
        )}

        {/* Step: Complete */}
        {step === 'complete' && (
          <div className="flex-1 flex flex-col items-center justify-center py-8 space-y-6">
            {importResults.errors === 0 ? (
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-orange-600" />
              </div>
            )}

            <div className="text-center">
              <h3 className="text-lg font-semibold">Importação Concluída</h3>
              <p className="text-muted-foreground">
                {importResults.success} peça(s) importada(s) com sucesso
                {importResults.errors > 0 && `, ${importResults.errors} erro(s)`}
              </p>
            </div>

            {importResults.errorMessages.length > 0 && (
              <ScrollArea className="w-full max-w-md max-h-32 border rounded-lg p-3">
                <div className="space-y-1">
                  {importResults.errorMessages.map((msg, i) => (
                    <p key={i} className="text-xs text-red-600">
                      {msg}
                    </p>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )}

        <DialogFooter className="border-t pt-4">
          {step === 'upload' && (
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
          )}

          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>
                Voltar
              </Button>
              <Button
                onClick={handleImport}
                disabled={validCount === 0}
                className="btn-gold gap-2"
              >
                Importar {validCount} peça(s)
                <ArrowRight className="w-4 h-4" />
              </Button>
            </>
          )}

          {step === 'complete' && (
            <Button onClick={handleClose} className="btn-gold">
              Concluir
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
