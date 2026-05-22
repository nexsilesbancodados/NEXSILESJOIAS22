import { useState, useMemo } from 'react';
import JsBarcode from 'jsbarcode';
import jsPDF from 'jspdf';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Printer, Download } from 'lucide-react';
import { toast } from 'sonner';
import type { MaletaItem } from '@/hooks/useSupabaseData';

interface EtiquetasBarcodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: MaletaItem[];
  maletaNome: string;
}

/**
 * Gera PDF com etiquetas Code128 (formato pimaco 3x10) — pronto para impressora térmica/A4.
 */
export function EtiquetasBarcodeDialog({ open, onOpenChange, items, maletaNome }: EtiquetasBarcodeDialogProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(items.map(i => i.id)));
  const [copiesPerItem, setCopiesPerItem] = useState(1);

  const itemsToPrint = useMemo(() => items.filter(i => selected.has(i.id)), [items, selected]);

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map(i => i.id)));
  };

  const generateBarcodeDataUrl = (text: string): string => {
    const canvas = document.createElement('canvas');
    try {
      JsBarcode(canvas, text, {
        format: 'CODE128',
        width: 2,
        height: 50,
        displayValue: true,
        fontSize: 12,
        margin: 4,
      });
      return canvas.toDataURL('image/png');
    } catch {
      return '';
    }
  };

  const handleGerarPDF = async (action: 'download' | 'print') => {
    if (itemsToPrint.length === 0) {
      toast.error('Selecione ao menos uma peça');
      return;
    }

    // A4: 210x297mm. Grid 3 col x 10 lin = 30 etiquetas/folha, cada 63x29mm
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    const cols = 3, rows = 10;
    const labelW = 63, labelH = 27;
    const marginX = (210 - cols * labelW) / 2;
    const marginY = 10;

    let idx = 0;
    const expandedItems: typeof itemsToPrint = [];
    itemsToPrint.forEach(it => {
      for (let k = 0; k < copiesPerItem; k++) expandedItems.push(it);
    });

    for (const item of expandedItems) {
      const pos = idx % (cols * rows);
      if (idx > 0 && pos === 0) pdf.addPage();
      const col = pos % cols;
      const row = Math.floor(pos / cols);
      const x = marginX + col * labelW;
      const y = marginY + row * labelH;

      const peca = (item as any).pecas || {};
      const code = peca.codigo_barras || peca.codigo || item.id.slice(0, 8);
      const nome = (peca.nome || '').substring(0, 28);
      const preco = peca.preco_venda ? `R$ ${Number(peca.preco_venda).toFixed(2).replace('.', ',')}` : '';

      pdf.setFontSize(8);
      pdf.text(nome, x + 2, y + 4);
      const dataUrl = generateBarcodeDataUrl(String(code));
      if (dataUrl) pdf.addImage(dataUrl, 'PNG', x + 2, y + 6, labelW - 4, 14);
      pdf.setFontSize(7);
      if (preco) pdf.text(preco, x + labelW - 2, y + labelH - 2, { align: 'right' });
      idx++;
    }

    const filename = `etiquetas-${maletaNome.replace(/\s+/g, '-')}.pdf`;
    if (action === 'download') {
      pdf.save(filename);
      toast.success('PDF gerado');
    } else {
      pdf.autoPrint();
      const url = pdf.output('bloburl');
      window.open(url, '_blank');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Imprimir etiquetas com código de barras</DialogTitle>
          <DialogDescription>
            Selecione as peças e gere um PDF (formato A4, 30 etiquetas por folha — 63×27mm).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <Button variant="outline" size="sm" onClick={toggleAll}>
              {selected.size === items.length ? 'Desmarcar todas' : 'Selecionar todas'}
            </Button>
            <div className="flex items-center gap-2">
              <Label htmlFor="copies" className="text-sm">Cópias por peça:</Label>
              <Input
                id="copies"
                type="number"
                min={1}
                max={20}
                value={copiesPerItem}
                onChange={(e) => setCopiesPerItem(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                className="w-20"
              />
            </div>
          </div>

          <ScrollArea className="h-[300px] border rounded-md p-2">
            <div className="space-y-1">
              {items.map(item => {
                const peca = (item as any).pecas || {};
                return (
                  <label key={item.id} className="flex items-center gap-3 p-2 rounded hover:bg-secondary/50 cursor-pointer">
                    <Checkbox checked={selected.has(item.id)} onCheckedChange={() => toggle(item.id)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{peca.nome || 'Peça'}</p>
                      <p className="text-xs text-muted-foreground">
                        {peca.codigo || '-'} {peca.codigo_barras ? `• EAN ${peca.codigo_barras}` : ''} • Qtd: {item.quantidade}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </ScrollArea>

          <p className="text-xs text-muted-foreground">
            Serão geradas <strong>{itemsToPrint.length * copiesPerItem}</strong> etiquetas.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button variant="outline" onClick={() => handleGerarPDF('download')}>
            <Download className="w-4 h-4 mr-2" />
            Baixar PDF
          </Button>
          <Button onClick={() => handleGerarPDF('print')}>
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
