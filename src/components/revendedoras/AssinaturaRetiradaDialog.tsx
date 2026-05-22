import { useRef, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Eraser, Download, FileSignature, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AssinaturaItem {
  peca_nome: string;
  peca_codigo?: string | null;
  quantidade: number;
  preco_unitario?: number | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maletaId: string;
  maletaNome: string;
  numeroSequencial?: number | null;
  revendedoraId?: string | null;
  revendedoraNome?: string | null;
  items: AssinaturaItem[];
}

export function AssinaturaRetiradaDialog({
  open, onOpenChange, maletaId, maletaNome, numeroSequencial,
  revendedoraId, revendedoraNome, items,
}: Props) {
  const { organizationId } = useOrganization();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [assinante, setAssinante] = useState(revendedoraNome ?? '');
  const [observacoes, setObservacoes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setAssinante(revendedoraNome ?? '');
      setObservacoes('');
      setHasSignature(false);
      setTimeout(clearCanvas, 50);
    }
  }, [open, revendedoraNome]);

  const getCtx = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext('2d');
  };

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const ctx = getCtx();
    if (!ctx) return;
    setDrawing(true);
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return;
    e.preventDefault();
    const ctx = getCtx();
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const endDraw = () => setDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const gerarPDF = (assinaturaDataUrl: string, dataAssinatura: Date) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const tituloMaleta = `Maleta ${numeroSequencial ? `#${String(numeroSequencial).padStart(3, '0')} - ` : ''}${maletaNome}`;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('COMPROVANTE DE RETIRADA', 105, 18, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(tituloMaleta, 105, 26, { align: 'center' });

    doc.setFontSize(10);
    let y = 38;
    doc.text(`Revendedora: ${revendedoraNome ?? '—'}`, 14, y); y += 6;
    doc.text(`Assinante: ${assinante}`, 14, y); y += 6;
    doc.text(`Data: ${format(dataAssinatura, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 14, y); y += 6;
    if (observacoes) { doc.text(`Observações: ${observacoes}`, 14, y); y += 6; }

    autoTable(doc, {
      startY: y + 4,
      head: [['#', 'Código', 'Peça', 'Qtd', 'Preço Unit.', 'Subtotal']],
      body: items.map((it, i) => [
        i + 1,
        it.peca_codigo ?? '—',
        it.peca_nome,
        it.quantidade,
        (it.preco_unitario ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        ((it.preco_unitario ?? 0) * it.quantidade).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [180, 132, 109] },
    });

    const totalPecas = items.reduce((s, it) => s + it.quantidade, 0);
    const totalValor = items.reduce((s, it) => s + (it.preco_unitario ?? 0) * it.quantidade, 0);

    // @ts-ignore
    const finalY = doc.lastAutoTable.finalY + 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`Total de peças: ${totalPecas}`, 14, finalY);
    doc.text(
      `Valor total: ${totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
      14, finalY + 6,
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const termoY = finalY + 18;
    const termo = `Declaro ter recebido as peças listadas acima em regime de consignação, comprometendo-me a devolvê-las ou prestar contas integralmente conforme contrato firmado.`;
    doc.text(doc.splitTextToSize(termo, 180), 14, termoY);

    // Signature
    try {
      doc.addImage(assinaturaDataUrl, 'PNG', 60, termoY + 16, 90, 30);
    } catch {}
    doc.setLineWidth(0.3);
    doc.line(60, termoY + 48, 150, termoY + 48);
    doc.setFontSize(9);
    doc.text(`Assinatura: ${assinante}`, 105, termoY + 53, { align: 'center' });

    doc.save(`comprovante-retirada-${maletaId.slice(0, 8)}.pdf`);
  };

  const handleSubmit = async () => {
    if (!assinante.trim()) {
      toast.error('Informe o nome de quem está assinando');
      return;
    }
    if (!hasSignature) {
      toast.error('Capture a assinatura no quadro acima');
      return;
    }
    if (!organizationId) return;

    setSaving(true);
    try {
      const canvas = canvasRef.current!;
      const assinaturaDataUrl = canvas.toDataURL('image/png');
      const now = new Date();

      const snapshot = items.map((it) => ({
        peca_codigo: it.peca_codigo,
        peca_nome: it.peca_nome,
        quantidade: it.quantidade,
        preco_unitario: it.preco_unitario ?? 0,
      }));

      const { error } = await supabase.from('maleta_assinaturas' as any).insert({
        organization_id: organizationId,
        maleta_id: maletaId,
        revendedora_id: revendedoraId,
        assinante_nome: assinante.trim(),
        assinatura_base64: assinaturaDataUrl,
        snapshot_itens: snapshot,
        observacoes: observacoes || null,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      });

      if (error) throw error;

      gerarPDF(assinaturaDataUrl, now);
      toast.success('Comprovante assinado e PDF gerado');
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao salvar assinatura');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="w-5 h-5" /> Comprovante de Retirada
          </DialogTitle>
          <DialogDescription>
            Capture a assinatura digital da revendedora. O comprovante será arquivado e baixado como PDF.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Nome de quem assina</Label>
              <Input value={assinante} onChange={(e) => setAssinante(e.target.value)} placeholder="Nome completo" />
            </div>
            <div className="space-y-1.5">
              <Label>Total de peças</Label>
              <Input value={items.reduce((s, it) => s + it.quantidade, 0)} disabled />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Observações (opcional)</Label>
            <Textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={2}
              placeholder="Ex: prazo combinado, condições especiais"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Assinatura</Label>
              <Button type="button" size="sm" variant="ghost" onClick={clearCanvas}>
                <Eraser className="w-4 h-4 mr-1" /> Limpar
              </Button>
            </div>
            <div className="border-2 border-dashed border-border rounded-lg bg-white touch-none">
              <canvas
                ref={canvasRef}
                width={760}
                height={220}
                className="w-full h-[220px] rounded-lg cursor-crosshair"
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={endDraw}
                onMouseLeave={endDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={endDraw}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Assinar e baixar PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
