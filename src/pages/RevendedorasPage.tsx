import { useState, useEffect, useCallback } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { useRevendedoraPresence } from '@/hooks/useMaletaPresence';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { MiniGradientCard } from '@/components/dashboard/MiniGradientCard';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Phone, 
  Mail, 
  Briefcase, 
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Trash2,
  UserPlus,
  Package,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  History,
  TrendingUp,
  Settings,
  Bell,
  FileDown,
  Printer,
  ShoppingCart,
  Eye,
  MessageCircle,
  Upload,
  X,
  Palette
} from 'lucide-react';
import { WhatsAppTemplates } from '@/components/whatsapp/WhatsAppTemplates';
import { MaletaAddPecaSection } from '@/components/revendedoras/MaletaAddPecaSection';
import { QuantidadeVendaModal } from '@/components/revendedoras/QuantidadeVendaModal';
import { MaletaManager } from '@/components/revendedoras/MaletaManager';
import { ReadOnlyGuard } from '@/components/subscription/ReadOnlyGuard';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format, differenceInDays, isPast, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  useRevendedoras,
  useAddRevendedora,
  useUpdateRevendedora,
  useDeleteRevendedora,
  useMaletas,
  useMaletaItems,
  useAddMaleta,
  useAddMaletaItem,
  useUpdateMaletaItem,
  useDeleteMaletaItem,
  useCloseMaleta,
  useDeleteMaleta,
  usePecas,
  useCatalogos,
  useCatalogoItems,
  Revendedora,
  Maleta,
  MaletaItem,
  Peca,
} from '@/hooks/useSupabaseData';
import { useAuth } from '@/contexts/AuthContext';
import { useVerificarMaletasVencendo } from '@/hooks/useMaletaAlerts';
import { ComissaoEscala, FaixaComissao, calcularComissaoPorEscala, serializeFaixas, deserializeFaixas } from '@/components/maleta/ComissaoEscala';

// Hook para atualizar maleta
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-db';

function useUpdateMaleta() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updateData }: { 
      id: string; 
      nome?: string | null;
      data_devolucao?: string | null;
      observacoes?: string | null;
      cor_primaria?: string | null;
      cor_secundaria?: string | null;
      imagem_capa?: string | null;
    }) => {
      const dbData: Record<string, unknown> = {};
      if (updateData.nome !== undefined) dbData.nome = updateData.nome;
      if (updateData.observacoes !== undefined) dbData.observacoes = updateData.observacoes;
      if (updateData.data_devolucao !== undefined) dbData.data_devolucao = updateData.data_devolucao;
      if (updateData.cor_primaria !== undefined) dbData.cor_primaria = updateData.cor_primaria;
      if (updateData.cor_secundaria !== undefined) dbData.cor_secundaria = updateData.cor_secundaria;
      if (updateData.imagem_capa !== undefined) dbData.imagem_capa = updateData.imagem_capa;

      const { data, error } = await supabase
        .from('maletas')
        .update(dbData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maletas'] });
      toast.success('Maleta atualizada!');
    },
    onError: () => {
      toast.error('Erro ao atualizar maleta');
    },
  });
}

function useUpdateRomaneioStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'pendente' | 'confirmado' | 'cancelado' }) => {
      const { data, error } = await supabase
        .from('romaneios')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['romaneios-maleta'] });
      queryClient.invalidateQueries({ queryKey: ['romaneios'] });
      if (variables.status === 'confirmado') {
        toast.success('Venda confirmada!');
      } else if (variables.status === 'cancelado') {
        toast.success('Venda cancelada');
      }
    },
    onError: () => {
      toast.error('Erro ao atualizar status da venda');
    },
  });
}

export default function RevendedorasPage() {
  const { user } = useAuth();
  const { data: revendedoras = [], isLoading: isLoadingRevendedoras } = useRevendedoras();
  const { data: pecas = [] } = usePecas();
  const { data: catalogos = [] } = useCatalogos();
  
  // Check for expiring maletas
  useVerificarMaletasVencendo(user?.id, 3);
  
  const addRevendedoraMutation = useAddRevendedora();
  const updateRevendedoraMutation = useUpdateRevendedora();
  const deleteRevendedoraMutation = useDeleteRevendedora();
  const addMaletaMutation = useAddMaleta();
  const addMaletaItemMutation = useAddMaletaItem();
  const updateMaletaItemMutation = useUpdateMaletaItem();
  const deleteMaletaItemMutation = useDeleteMaletaItem();
  const closeMaletaMutation = useCloseMaleta();
  const deleteMaletaMutation = useDeleteMaleta();
  const updateMaletaMutation = useUpdateMaleta();
  const updateRomaneioStatusMutation = useUpdateRomaneioStatus();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleteMaletaOpen, setIsDeleteMaletaOpen] = useState(false);
  const [selectedRevendedora, setSelectedRevendedora] = useState<Revendedora | null>(null);
  const [viewingRevendedora, setViewingRevendedora] = useState<Revendedora | null>(null);
  const [isMaletaOpen, setIsMaletaOpen] = useState(false);
  const [isMaletaFormOpen, setIsMaletaFormOpen] = useState(false);
  const [isCloseMaletaOpen, setIsCloseMaletaOpen] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [maletaFechada, setMaletaFechada] = useState<{
    maleta: Maleta;
    revendedora: Revendedora | null;
    items: MaletaItem[];
    acerto: { totalVendido: number; valorComissao: number; valorLiquido: number; percentualComissao: number };
  } | null>(null);
  const [selectedMaleta, setSelectedMaleta] = useState<Maleta | null>(null);
  const [searchPeca, setSearchPeca] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [maletaActiveTab, setMaletaActiveTab] = useState('pecas');
  const [isWhatsAppTemplatesOpen, setIsWhatsAppTemplatesOpen] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [isBulkActionPending, setIsBulkActionPending] = useState(false);
  const [selectedCatalogoId, setSelectedCatalogoId] = useState<string>('');
  const [vendaModalOpen, setVendaModalOpen] = useState(false);
  const [itemParaVenda, setItemParaVenda] = useState<MaletaItem | null>(null);

  // Track revendedora presence when viewing a maleta (broadcasts to public page)
  useRevendedoraPresence(selectedMaleta?.id);
  
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    comissao: '30',
  });

  const [maletaFormData, setMaletaFormData] = useState({
    nome: '',
    comissao_personalizada: '',
    prazo_devolucao: '',
    observacoes: '',
    cor_primaria: '#8B5CF6',
    cor_secundaria: '#EC4899',
  });
  const [maletaImageFile, setMaletaImageFile] = useState<File | null>(null);
  const [maletaImagePreview, setMaletaImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const PRESET_COLORS = [
    { name: 'Roxo', primary: '#8B5CF6', secondary: '#EC4899' },
    { name: 'Azul', primary: '#3B82F6', secondary: '#06B6D4' },
    { name: 'Verde', primary: '#10B981', secondary: '#84CC16' },
    { name: 'Laranja', primary: '#F97316', secondary: '#EAB308' },
    { name: 'Rosa', primary: '#EC4899', secondary: '#F43F5E' },
    { name: 'Dourado', primary: '#D4AF37', secondary: '#C0A062' },
  ];

  // Commission scale state
  const [usarEscalaComissao, setUsarEscalaComissao] = useState(false);
  const [faixasComissao, setFaixasComissao] = useState<FaixaComissao[]>([
    { id: '1', valorMinimo: 0, valorMaximo: 400, percentual: 20 },
    { id: '2', valorMinimo: 400.01, valorMaximo: 800, percentual: 30 },
    { id: '3', valorMinimo: 800.01, valorMaximo: null, percentual: 40 },
  ]);
  const [comissaoFixaMaleta, setComissaoFixaMaleta] = useState(30);

  // Fetch maletas for viewing revendedora
  const { data: maletas = [], isLoading: isLoadingMaletas } = useMaletas(viewingRevendedora?.id);
  
  // Fetch items for selected maleta
  const { data: maletaItems = [], isLoading: isLoadingItems } = useMaletaItems(selectedMaleta?.id || '');
  
  // Fetch catalog items for selected catalog
  const { data: catalogoItems = [] } = useCatalogoItems(selectedCatalogoId);

  // Fetch romaneios (sales) for selected maleta
  const { data: romaneiosMaleta = [], isLoading: isLoadingRomaneios } = useQuery({
    queryKey: ['romaneios-maleta', selectedMaleta?.id],
    queryFn: async () => {
      if (!selectedMaleta?.id) return [];
      const { data, error } = await supabase
        .from('romaneios')
        .select('*, romaneios_pecas(*)')
        .eq('revendedora_id', selectedMaleta.revendedora_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedMaleta?.id,
  });

  const handleOpenForm = (revendedora?: Revendedora) => {
    if (revendedora) {
      setSelectedRevendedora(revendedora);
      setFormData({
        nome: revendedora.nome,
        telefone: revendedora.telefone || '',
        email: revendedora.email || '',
        comissao: (revendedora.comissao_percentual || 30).toString(),
      });
    } else {
      setSelectedRevendedora(null);
      setFormData({
        nome: '',
        telefone: '',
        email: '',
        comissao: '30',
      });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    const revendedoraData = {
      nome: formData.nome,
      telefone: formData.telefone || null,
      email: formData.email || null,
      comissao: parseFloat(formData.comissao) || 30,
    };

    try {
      if (selectedRevendedora) {
        await updateRevendedoraMutation.mutateAsync({
          id: selectedRevendedora.id,
          ...revendedoraData,
        });
      } else {
        await addRevendedoraMutation.mutateAsync(revendedoraData);
      }
      setIsFormOpen(false);
    } catch (error) {
      console.error('Error saving revendedora:', error);
    }
  };

  const handleDelete = async (force = false) => {
    if (selectedRevendedora) {
      try {
        await deleteRevendedoraMutation.mutateAsync({ id: selectedRevendedora.id, force });
        setIsDeleteOpen(false);
        setSelectedRevendedora(null);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '';
        // If it's a dependency error and not forcing, offer to force delete
        if (errorMessage.startsWith('DEPENDENCY:') && !force) {
          // Error message already shown by the hook
          return;
        }
        console.error('Error deleting revendedora:', error);
      }
    }
  };

  const handleOpenMaletaForm = (maleta?: Maleta) => {
    if (maleta) {
      setSelectedMaleta(maleta);
      setMaletaFormData({
        nome: maleta.nome || '',
        comissao_personalizada: '',
        prazo_devolucao: maleta.data_devolucao || '',
        observacoes: maleta.observacoes || '',
        cor_primaria: maleta.cor_primaria || '#8B5CF6',
        cor_secundaria: maleta.cor_secundaria || '#EC4899',
      });
      setMaletaImagePreview(maleta.imagem_capa || null);
    } else {
      setSelectedMaleta(null);
      const defaultDate = format(addDays(new Date(), 30), 'yyyy-MM-dd');
      setMaletaFormData({
        nome: '',
        comissao_personalizada: '',
        prazo_devolucao: defaultDate,
        observacoes: '',
        cor_primaria: '#8B5CF6',
        cor_secundaria: '#EC4899',
      });
      setMaletaImagePreview(null);
    }
    setMaletaImageFile(null);
    setShowColorPicker(false);
    setIsMaletaFormOpen(true);
  };

  const handleMaletaImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Imagem muito grande. Máximo 5MB.');
        return;
      }
      setMaletaImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMaletaImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadMaletaImage = async (): Promise<string | null> => {
    if (!maletaImageFile) return maletaImagePreview;

    setIsUploadingImage(true);
    try {
      const fileExt = maletaImageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `maleta-covers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('maletas-images')
        .upload(filePath, maletaImageFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('maletas-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Erro ao fazer upload da imagem');
      return null;
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmitMaleta = async () => {
    if (!viewingRevendedora) return;

    try {
      const imageUrl = await uploadMaletaImage();

      if (selectedMaleta) {
        // Atualizar maleta existente
        await updateMaletaMutation.mutateAsync({
          id: selectedMaleta.id,
          nome: maletaFormData.nome || null,
          data_devolucao: maletaFormData.prazo_devolucao || null,
          observacoes: maletaFormData.observacoes || null,
          cor_primaria: maletaFormData.cor_primaria,
          cor_secundaria: maletaFormData.cor_secundaria,
          imagem_capa: imageUrl,
        });
      } else {
        // Criar nova maleta
        await addMaletaMutation.mutateAsync({
          revendedora_id: viewingRevendedora.id,
          nome: maletaFormData.nome || undefined,
          data_devolucao: maletaFormData.prazo_devolucao || undefined,
          observacoes: maletaFormData.observacoes || undefined,
          cor_primaria: maletaFormData.cor_primaria,
          cor_secundaria: maletaFormData.cor_secundaria,
          imagem_capa: imageUrl || undefined,
        });
      }
      setIsMaletaFormOpen(false);
    } catch (error) {
      console.error('Error saving maleta:', error);
    }
  };

  const handleAddPecaToMaleta = async (peca: Peca, quantidade: number = 1) => {
    if (!selectedMaleta) return;

    try {
      await addMaletaItemMutation.mutateAsync({
        maletaId: selectedMaleta.id,
        pecaId: peca.id,
        quantidade,
      });
      setSearchPeca('');
    } catch (error) {
      console.error('Error adding peca to maleta:', error);
    }
  };

  const handleRemovePecaFromMaleta = async (itemId: string, pecaId: string) => {
    if (!selectedMaleta) return;
    
    try {
      await deleteMaletaItemMutation.mutateAsync({
        id: itemId,
        pecaId: pecaId,
        returnToStock: true,
      });
    } catch (error) {
      console.error('Error removing peca from maleta:', error);
    }
  };

  const handleAddPecaFromCatalogo = async (peca: Peca, quantidade: number = 1) => {
    if (!selectedMaleta) return;
    
    try {
      await addMaletaItemMutation.mutateAsync({
        maletaId: selectedMaleta.id,
        pecaId: peca.id,
        quantidade,
      });
    } catch (error) {
      console.error('Error adding peca from catalog:', error);
    }
  };

  const handleMarcarItem = async (
    itemId: string, 
    pecaId: string, 
    status: 'pendente' | 'vendido' | 'devolvido',
    statusAnterior?: 'pendente' | 'vendido' | 'devolvido',
    quantidade?: number,
    quantidadeVendida?: number,
    quantidadeTotal?: number
  ) => {
    try {
      await updateMaletaItemMutation.mutateAsync({ 
        id: itemId, 
        status, 
        pecaId, 
        statusAnterior, 
        quantidade: quantidade || 1,
        quantidadeVendida,
        quantidadeTotal
      });
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  // Open modal to select quantity for sale
  const handleAbrirModalVenda = (item: MaletaItem) => {
    setItemParaVenda(item);
    setVendaModalOpen(true);
  };

  // Handler for confirming partial or full sale
  const handleConfirmarVenda = async (itemId: string, pecaId: string, quantidadeVendida: number, quantidadeTotal: number) => {
    await handleMarcarItem(itemId, pecaId, 'vendido', 'pendente', quantidadeVendida, quantidadeVendida, quantidadeTotal);
    setVendaModalOpen(false);
    setItemParaVenda(null);
  };

  // Bulk selection helpers
  const pendingItems = maletaItems.filter(item => item.status === 'pendente');
  const selectedPendingItems = pendingItems.filter(item => selectedItemIds.has(item.id));
  const isAllPendingSelected = pendingItems.length > 0 && selectedPendingItems.length === pendingItems.length;
  const isSomeSelected = selectedItemIds.size > 0;

  const toggleItemSelection = useCallback((itemId: string) => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  const toggleSelectAllPending = useCallback(() => {
    if (isAllPendingSelected) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(pendingItems.map(item => item.id)));
    }
  }, [isAllPendingSelected, pendingItems]);

  const handleBulkAction = async (status: 'vendido' | 'devolvido') => {
    if (selectedItemIds.size === 0) return;
    
    setIsBulkActionPending(true);
    try {
      const itemsToUpdate = maletaItems.filter(item => 
        selectedItemIds.has(item.id) && item.status === 'pendente'
      );
      
      await Promise.all(
        itemsToUpdate.map(item => 
          updateMaletaItemMutation.mutateAsync({ 
            id: item.id, 
            status, 
            pecaId: item.peca_id, 
            statusAnterior: 'pendente',
            quantidade: item.quantidade || 1
          })
        )
      );
      
      setSelectedItemIds(new Set());
      toast.success(`${itemsToUpdate.length} ${itemsToUpdate.length === 1 ? 'peça marcada' : 'peças marcadas'} como ${status === 'vendido' ? 'vendidas' : 'devolvidas'}`);
    } catch (error) {
      console.error('Error in bulk action:', error);
      toast.error('Erro ao atualizar itens');
    } finally {
      setIsBulkActionPending(false);
    }
  };

  // Clear selection when maleta changes
  useEffect(() => {
    setSelectedItemIds(new Set());
  }, [selectedMaleta?.id]);

  const handleFecharMaleta = async () => {
    if (!selectedMaleta) return;

    // Save data before closing for PDF export
    const comissaoRevendedora = revendedoras.find(r => r.id === selectedMaleta.revendedora_id)?.comissao_percentual || 30; 
    const acerto = calcularAcertoMaleta(maletaItems as (MaletaItem & { peca: Peca })[], comissaoRevendedora);
    const revendedora = revendedoras.find(r => r.id === selectedMaleta.revendedora_id) || null;

    try {
      await closeMaletaMutation.mutateAsync({ maletaId: selectedMaleta.id, returnPendingToStock: true });
      
      // Store data for export dialog
      setMaletaFechada({
        maleta: selectedMaleta,
        revendedora,
        items: [...maletaItems],
        acerto
      });
      
      setIsCloseMaletaOpen(false);
      setIsMaletaOpen(false);
      setSelectedMaleta(null);
      setShowExportDialog(true);
    } catch (error) {
      console.error('Error closing maleta:', error);
    }
  };

  const exportarResumoPDF = () => {
    if (!maletaFechada) return;

    const { maleta, revendedora, items, acerto } = maletaFechada;
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Resumo da Maleta', 14, 22);
    
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 30);
    
    // Maleta info
    doc.setFontSize(12);
    doc.text(`Maleta: ${maleta.nome || 'Sem nome'}`, 14, 42);
    doc.text(`Revendedora: ${revendedora?.nome || 'N/A'}`, 14, 50);
    doc.text(`Data de Criação: ${format(new Date(maleta.created_at), 'dd/MM/yyyy', { locale: ptBR })}`, 14, 58);
    doc.text(`Data de Fechamento: ${format(new Date(), 'dd/MM/yyyy', { locale: ptBR })}`, 14, 66);
    
    // Sold items table
    const itemsVendidos = items.filter(item => item.status === 'vendido');
    const itemsDevolvidos = items.filter(item => item.status === 'devolvido' || item.status === 'pendente');
    
    if (itemsVendidos.length > 0) {
      doc.setFontSize(14);
      doc.text('Peças Vendidas', 14, 82);
      
      autoTable(doc, {
        startY: 86,
        head: [['Código', 'Nome', 'Preço']],
        body: itemsVendidos.map(item => [
          item.peca?.codigo || '-',
          item.peca?.nome || '-',
          formatCurrency(item.peca?.preco_venda || 0)
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [212, 175, 55], textColor: [0, 0, 0] },
      });
    }
    
    // Summary
    const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 100;
    
    doc.setFontSize(14);
    doc.text('Resumo Financeiro', 14, finalY + 15);
    
    doc.setFontSize(11);
    doc.text(`Total Vendido: ${formatCurrency(acerto.totalVendido)}`, 14, finalY + 25);
    doc.text(`Comissão (${acerto.percentualComissao}%): ${formatCurrency(acerto.valorComissao)}`, 14, finalY + 33);
    doc.setFontSize(13);
    doc.text(`Valor a Receber: ${formatCurrency(acerto.valorLiquido)}`, 14, finalY + 43);
    
    // Items returned
    if (itemsDevolvidos.length > 0) {
      doc.setFontSize(11);
      doc.text(`Peças devolvidas ao estoque: ${itemsDevolvidos.length}`, 14, finalY + 55);
    }
    
    // Save
    const filename = `maleta_${maleta.nome || 'resumo'}_${format(new Date(), 'dd-MM-yyyy')}.pdf`;
    doc.save(filename.replace(/\s+/g, '_'));
    
    toast.success('PDF exportado com sucesso!');
    setShowExportDialog(false);
    setMaletaFechada(null);
  };

  const handleCopyLink = (revendedoraId: string) => {
    const link = `${window.location.origin}/portal/${revendedoraId}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    toast.success('Link copiado!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Export pieces list to PDF
  const exportarPecasMaletaPDF = () => {
    if (!selectedMaleta || !viewingRevendedora) return;
    
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Lista de Peças - Maleta', 14, 22);
    
    doc.setFontSize(10);
    doc.text(`Revendedora: ${viewingRevendedora.nome}`, 14, 32);
    doc.text(`Maleta: ${selectedMaleta.nome || 'Sem nome'}`, 14, 38);
    doc.text(`Data: ${format(new Date(), 'dd/MM/yyyy', { locale: ptBR })}`, 14, 44);
    
    if (selectedMaleta.data_devolucao) {
      doc.text(`Prazo de Devolução: ${format(new Date(selectedMaleta.data_devolucao), 'dd/MM/yyyy', { locale: ptBR })}`, 14, 50);
    }
    
    // Table
    autoTable(doc, {
      startY: 60,
      head: [['Código', 'Nome', 'Preço', 'Status']],
      body: maletaItems.map(item => [
        item.peca?.codigo || '-',
        item.peca?.nome || '-',
        formatCurrency(item.peca?.preco_venda || 0),
        item.status === 'vendido' ? 'Vendido' : 
        item.status === 'devolvido' ? 'Devolvido' : 'Pendente'
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [212, 175, 55], textColor: [0, 0, 0] },
    });
    
    // Summary
    const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 100;
    const totalPecas = maletaItems.reduce((acc, item) => acc + (item.quantidade || 1), 0);
    const totalValor = maletaItems.reduce((acc, item) => acc + ((item.peca?.preco_venda || 0) * (item.quantidade || 1)), 0);
    
    doc.setFontSize(12);
    doc.text(`Total de Peças: ${totalPecas}`, 14, finalY + 15);
    doc.text(`Valor Total: ${formatCurrency(totalValor)}`, 14, finalY + 23);
    
    // Signature field
    doc.setFontSize(10);
    doc.text('_______________________________', 14, finalY + 45);
    doc.text('Assinatura da Revendedora', 14, finalY + 52);
    
    const filename = `maleta_${selectedMaleta.nome || 'pecas'}_${format(new Date(), 'dd-MM-yyyy')}.pdf`;
    doc.save(filename.replace(/\s+/g, '_'));
    toast.success('PDF das peças exportado!');
  };

  // Print pieces list
  const imprimirPecasMaleta = () => {
    if (!selectedMaleta || !viewingRevendedora) return;
    
    const totalPecas = maletaItems.reduce((acc, item) => acc + (item.quantidade || 1), 0);
    const totalValor = maletaItems.reduce((acc, item) => acc + ((item.peca?.preco_venda || 0) * (item.quantidade || 1)), 0);
    
    const conteudo = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Lista de Peças - ${selectedMaleta.nome || 'Maleta'}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #D4AF37; margin-bottom: 10px; }
          .info { margin-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #D4AF37; color: #000; }
          tr:nth-child(even) { background-color: #f5f5f5; }
          .status-vendido { color: #16a34a; font-weight: bold; }
          .status-pendente { color: #ca8a04; }
          .status-devolvido { color: #6b7280; }
          .total { margin-top: 20px; font-weight: bold; font-size: 14px; }
          .assinatura { margin-top: 50px; }
          @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <h1>Lista de Peças - Maleta</h1>
        <p class="info"><strong>Revendedora:</strong> ${viewingRevendedora.nome}</p>
        <p class="info"><strong>Maleta:</strong> ${selectedMaleta.nome || 'Sem nome'}</p>
        <p class="info"><strong>Data:</strong> ${format(new Date(), 'dd/MM/yyyy', { locale: ptBR })}</p>
        ${selectedMaleta.data_devolucao ? 
          `<p class="info"><strong>Prazo:</strong> ${format(new Date(selectedMaleta.data_devolucao), 'dd/MM/yyyy', { locale: ptBR })}</p>` : ''}
        
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nome</th>
              <th>Preço</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${maletaItems.map(item => `
              <tr>
                <td>${item.peca?.codigo || '-'}</td>
                <td>${item.peca?.nome || '-'}</td>
                <td>${formatCurrency(item.peca?.preco_venda || 0)}</td>
                <td class="${item.status === 'vendido' ? 'status-vendido' : item.status === 'devolvido' ? 'status-devolvido' : 'status-pendente'}">
                  ${item.status === 'vendido' ? 'Vendido' : item.status === 'devolvido' ? 'Devolvido' : 'Pendente'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <p class="total">Total de Peças: ${totalPecas}</p>
        <p class="total">Valor Total: ${formatCurrency(totalValor)}</p>
        
        <div class="assinatura">
          <p>_______________________________</p>
          <p>Assinatura da Revendedora</p>
        </div>
      </body>
      </html>
    `;
    
    const janela = window.open('', '_blank');
    if (janela) {
      janela.document.write(conteudo);
      janela.document.close();
      setTimeout(() => janela.print(), 250);
    }
  };

  // Calculate total sold for current maleta (considering quantities)
  const totalVendidoMaleta = maletaItems
    .filter((item) => item.status === 'vendido')
    .reduce((acc, item) => acc + ((item.peca?.preco_venda || 0) * (item.quantidade || 1)), 0);

  const calcularAcertoMaleta = (items: (MaletaItem & { peca: Peca })[], comissao: number) => {
    const totalVendido = items
      .filter((item) => item.status === 'vendido')
      .reduce((acc, item) => acc + ((item.peca?.preco_venda || 0) * (item.quantidade || 1)), 0);
    
    // Use scale if enabled
    let comissaoInfo;
    if (usarEscalaComissao && faixasComissao.length > 0) {
      comissaoInfo = calcularComissaoPorEscala(totalVendido, faixasComissao, comissaoFixaMaleta, true);
    } else {
      comissaoInfo = { percentual: comissao, valorComissao: totalVendido * (comissao / 100) };
    }
    
    const valorLiquido = totalVendido - comissaoInfo.valorComissao;
    return { 
      totalVendido, 
      valorComissao: comissaoInfo.valorComissao, 
      valorLiquido,
      percentualComissao: comissaoInfo.percentual 
    };
  };

  const calcularDiasRestantes = (prazo: string | null) => {
    if (!prazo) return null;
    const prazoDate = new Date(prazo);
    return differenceInDays(prazoDate, new Date());
  };

  const getStatusPrazo = (diasRestantes: number | null) => {
    if (diasRestantes === null) return { label: 'Sem prazo', color: 'text-muted-foreground', icon: Clock };
    if (diasRestantes < 0) return { label: 'Vencida', color: 'text-destructive', icon: XCircle };
    if (diasRestantes <= 3) return { label: 'Vencendo', color: 'text-yellow-600', icon: AlertTriangle };
    return { label: 'No prazo', color: 'text-success', icon: CheckCircle2 };
  };

  const pecasDisponiveis = pecas.filter(
    (p) =>
      p.estoque > 0 &&
      (p.nome.toLowerCase().includes(searchPeca.toLowerCase()) ||
        p.codigo.toLowerCase().includes(searchPeca.toLowerCase()))
  );

  const itemsVendidos = maletaItems.filter(item => item.status === 'vendido');
  const itemsPendentes = maletaItems.filter(item => item.status === 'pendente');
  const itemsDevolvidos = maletaItems.filter(item => item.status === 'devolvido');

  // Loading state
  if (isLoadingRevendedoras) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Detail View
  if (viewingRevendedora) {
    return (
      <div className="p-8 animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => setViewingRevendedora(null)}
          >
            ← Voltar
          </Button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full gold-gradient flex items-center justify-center text-2xl font-bold text-primary-foreground">
                {viewingRevendedora.nome.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{viewingRevendedora.nome}</h1>
                <p className="text-sm text-muted-foreground">
                  Comissão: {viewingRevendedora.comissao_percentual || 30}%
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleCopyLink(viewingRevendedora.id)}
              >
                {copiedLink ? (
                  <Check className="w-4 h-4 mr-2" />
                ) : (
                  <Copy className="w-4 h-4 mr-2" />
                )}
                Copiar Link do Portal
              </Button>
              <Button 
                variant="outline"
                onClick={() => setIsWhatsAppTemplatesOpen(true)}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>
              <a
                href={`/portal/${viewingRevendedora.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Abrir Portal
                </Button>
              </a>
              <Button 
                onClick={() => handleOpenMaletaForm()} 
                className="btn-gold"
                disabled={addMaletaMutation.isPending}
              >
                {addMaletaMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Briefcase className="w-4 h-4 mr-2" />
                )}
                Nova Maleta
              </Button>
            </div>
          </div>
        </div>

        {/* Maletas */}
        <div className="grid gap-4">
          {isLoadingMaletas ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : maletas.length === 0 ? (
            <div className="glass-card rounded-xl p-12 text-center">
              <Briefcase className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma maleta criada</p>
              <p className="text-muted-foreground/60 text-sm">
                Clique em "Nova Maleta" para começar
              </p>
            </div>
          ) : (
            maletas.map((maleta) => (
              <MaletaCard
                key={maleta.id}
                maleta={maleta}
                comissao={viewingRevendedora.comissao_percentual || 30}
                onClick={() => {
                  setSelectedMaleta(maleta);
                  setMaletaActiveTab('pecas');
                  setIsMaletaOpen(true);
                }}
                onEdit={() => handleOpenMaletaForm(maleta)}
              />
            ))
          )}
        </div>

        {/* Maleta Detail Modal */}
        <Dialog open={isMaletaOpen} onOpenChange={setIsMaletaOpen}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-xl font-semibold">
                    {selectedMaleta?.nome || `Maleta #${selectedMaleta?.id.slice(-4)}`}
                  </DialogTitle>
                  <DialogDescription className="flex items-center gap-2 mt-1">
                    {selectedMaleta?.status === 'aberta' ? (
                      <Badge variant="default" className="bg-success">Aberta</Badge>
                    ) : (
                      <Badge variant="secondary">Fechada</Badge>
                    )}
                    {selectedMaleta?.data_devolucao && (
                      (() => {
                        const diasRestantes = calcularDiasRestantes(String(selectedMaleta.data_devolucao));
                        const status = getStatusPrazo(diasRestantes);
                        return (
                          <span className={cn("flex items-center gap-1 text-sm", status.color)}>
                            <status.icon className="w-4 h-4" />
                            {diasRestantes !== null && diasRestantes >= 0 
                              ? `${diasRestantes} dias restantes` 
                              : diasRestantes !== null 
                                ? `Vencida há ${Math.abs(diasRestantes)} dias`
                                : status.label
                            }
                          </span>
                        );
                      })()
                    )}
                  </DialogDescription>
                </div>
                {selectedMaleta?.status === 'aberta' && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleOpenMaletaForm(selectedMaleta)}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </DialogHeader>

            {/* Toolbar de ações */}
            {selectedMaleta && maletaItems.length > 0 && (
              <div className="flex items-center justify-end gap-2 pb-4 border-b">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={imprimirPecasMaleta}
                  className="gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportarPecasMaletaPDF}
                  className="gap-2"
                >
                  <FileDown className="w-4 h-4" />
                  Baixar PDF
                </Button>
              </div>
            )}

            <Tabs value={maletaActiveTab} onValueChange={setMaletaActiveTab} className="mt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="pecas" className="gap-2">
                  <Package className="w-4 h-4" />
                  <span className="hidden sm:inline">Peças</span> ({maletaItems.length})
                </TabsTrigger>
                <TabsTrigger value="vendas" className="gap-2 relative">
                  <ShoppingCart className="w-4 h-4" />
                  <span className="hidden sm:inline">Vendas</span>
                  {romaneiosMaleta.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {romaneiosMaleta.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="resumo" className="gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="hidden sm:inline">Resumo</span>
                </TabsTrigger>
                <TabsTrigger value="historico" className="gap-2">
                  <History className="w-4 h-4" />
                  <span className="hidden sm:inline">Histórico</span>
                </TabsTrigger>
              </TabsList>

              {/* Tab Peças - Nova Interface Simplificada */}
              <TabsContent value="pecas" className="space-y-4">
                {selectedMaleta && (
                  <MaletaManager
                    maleta={selectedMaleta}
                    comissaoPercentual={viewingRevendedora?.comissao_percentual || 30}
                  />
                )}
              </TabsContent>

              {/* Tab Vendas */}
              <TabsContent value="vendas" className="space-y-4">
                {isLoadingRomaneios ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : romaneiosMaleta.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Nenhuma venda registrada</p>
                    <p className="text-sm">As vendas do portal aparecerão aqui</p>
                  </div>
                ) : (
                  <ScrollArea className="h-64">
                    <div className="space-y-3 pr-4">
                      {romaneiosMaleta.map((romaneio) => {
                        const itensCount = romaneio.romaneio_itens?.length || 0;
                        const statusColors: Record<string, string> = {
                          'pendente': 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
                          'confirmado': 'bg-success/10 text-success border-success/30',
                          'cancelado': 'bg-destructive/10 text-destructive border-destructive/30',
                        };
                        return (
                          <div 
                            key={romaneio.id} 
                            className="p-4 rounded-lg border bg-card hover:bg-secondary/30 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Calendar className="w-4 h-4 text-muted-foreground" />
                                  <span className="font-medium">
                                    {format(new Date(romaneio.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                  </span>
                                </div>
                                {romaneio.cliente_nome && (
                                  <p className="text-sm text-muted-foreground mb-2">
                                    Cliente: {romaneio.cliente_nome}
                                  </p>
                                )}
                                <div className="flex items-center gap-3 text-sm">
                                  <span className="text-muted-foreground">
                                    {itensCount} {itensCount === 1 ? 'item' : 'itens'}
                                  </span>
                                  <span className="font-semibold text-primary">
                                    {formatCurrency(romaneio.total || 0)}
                                  </span>
                                </div>
                              </div>
                              <Badge 
                                variant="outline" 
                                className={cn("capitalize", statusColors[romaneio.status] || '')}
                              >
                                {romaneio.status === 'pendente' ? 'Pendente' : 
                                 romaneio.status === 'confirmado' ? 'Confirmado' : 
                                 romaneio.status === 'cancelado' ? 'Cancelado' : romaneio.status}
                              </Badge>
                            </div>
                            
                            {/* Items preview */}
                            {romaneio.romaneio_itens && romaneio.romaneio_itens.length > 0 && (
                              <div className="mt-3 pt-3 border-t space-y-1">
                                {romaneio.romaneio_itens.slice(0, 3).map((item: { id: string; peca_nome: string; quantidade: number; preco_unitario: number }) => (
                                  <div key={item.id} className="flex justify-between text-xs text-muted-foreground">
                                    <span>{item.quantidade}x {item.peca_nome}</span>
                                    <span>{formatCurrency(item.preco_unitario * item.quantidade)}</span>
                                  </div>
                                ))}
                                {romaneio.romaneio_itens.length > 3 && (
                                  <p className="text-xs text-muted-foreground italic">
                                    +{romaneio.romaneio_itens.length - 3} mais itens...
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Action buttons for pending sales */}
                            {romaneio.status === 'pendente' && (
                              <div className="mt-3 pt-3 border-t flex gap-2">
                                <Button
                                  size="sm"
                                  className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
                                  onClick={() => updateRomaneioStatusMutation.mutate({ 
                                    id: romaneio.id, 
                                    status: 'confirmado' 
                                  })}
                                  disabled={updateRomaneioStatusMutation.isPending}
                                >
                                  {updateRomaneioStatusMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <>
                                      <CheckCircle2 className="w-4 h-4 mr-1" />
                                      Confirmar
                                    </>
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                                  onClick={() => {
                                    if (window.confirm('Deseja cancelar esta venda? As peças voltarão para o status pendente na maleta.')) {
                                      updateRomaneioStatusMutation.mutate({ 
                                        id: romaneio.id, 
                                        status: 'cancelado' 
                                      });
                                    }
                                  }}
                                  disabled={updateRomaneioStatusMutation.isPending}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Cancelar
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}

                {/* Totais */}
                {romaneiosMaleta.length > 0 && (
                  <div className="p-4 rounded-lg border bg-muted/50 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total de Vendas</span>
                      <span className="font-semibold">{romaneiosMaleta.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pendentes</span>
                      <span className="text-yellow-600 font-medium">
                        {romaneiosMaleta.filter(r => r.status === 'pendente').length}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-semibold">Valor Total</span>
                      <span className="font-bold text-primary">
                        {formatCurrency(romaneiosMaleta.reduce((acc, r) => acc + (r.total || 0), 0))}
                      </span>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Tab Resumo */}
              <TabsContent value="resumo" className="space-y-4">
                {/* Informações da Maleta */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">Data de Criação</span>
                    </div>
                    <p className="font-semibold">
                      {selectedMaleta?.created_at 
                        ? format(new Date(selectedMaleta.created_at), 'dd/MM/yyyy', { locale: ptBR })
                        : '-'
                      }
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">Prazo de Devolução</span>
                    </div>
                    <p className="font-semibold">
                      {selectedMaleta?.data_devolucao 
                        ? format(new Date(selectedMaleta.data_devolucao), 'dd/MM/yyyy', { locale: ptBR })
                        : 'Não definido'
                      }
                    </p>
                  </div>
                </div>

                {/* Progress */}
                {maletaItems.length > 0 && (
                  <div className="p-4 rounded-lg border bg-card">
                    <p className="text-sm text-muted-foreground mb-2">Progresso das Vendas</p>
                    {(() => {
                      const totalQtd = maletaItems.reduce((acc, item) => acc + (item.quantidade || 1), 0);
                      const vendidosQtd = itemsVendidos.reduce((acc, item) => acc + (item.quantidade || 1), 0);
                      const percentual = totalQtd > 0 ? Math.round((vendidosQtd / totalQtd) * 100) : 0;
                      return (
                        <>
                          <Progress value={percentual} className="h-2" />
                          <p className="text-sm mt-2">
                            {vendidosQtd} de {totalQtd} peças vendidas ({percentual}%)
                          </p>
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* Acerto Financeiro */}
                {maletaItems.length > 0 && (
                  <div className="p-4 rounded-lg border bg-card space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Acerto Financeiro</h4>
                      {usarEscalaComissao && (
                        <Badge variant="outline" className="text-xs">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Escala de Comissão
                        </Badge>
                      )}
                    </div>
                    {(() => {
                      const comissao = viewingRevendedora.comissao_percentual || 30;
                      const acerto = calcularAcertoMaleta(maletaItems, comissao);
                      return (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Vendido</span>
                            <span className="font-medium">{formatCurrency(acerto.totalVendido)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Comissão Revendedora ({acerto.percentualComissao}%)
                            </span>
                            <span className="text-primary font-medium">{formatCurrency(acerto.valorComissao)}</span>
                          </div>
                          <div className="flex justify-between text-lg font-semibold border-t pt-2">
                            <span>Valor a Receber (Loja)</span>
                            <span className="text-success">{formatCurrency(acerto.valorLiquido)}</span>
                          </div>
                          
                          {/* Commission scale info */}
                          {usarEscalaComissao && faixasComissao.length > 0 && (
                            <div className="mt-3 pt-3 border-t space-y-2">
                              <p className="text-xs text-muted-foreground font-medium">Escala de Comissão Aplicada:</p>
                              {faixasComissao.map((faixa, idx) => (
                                <div 
                                  key={faixa.id}
                                  className={cn(
                                    "flex justify-between text-xs p-2 rounded",
                                    acerto.totalVendido >= faixa.valorMinimo && 
                                    (faixa.valorMaximo === null || acerto.totalVendido <= faixa.valorMaximo) &&
                                    "bg-primary/10 font-medium"
                                  )}
                                >
                                  <span>
                                    {formatCurrency(faixa.valorMinimo)} - {faixa.valorMaximo ? formatCurrency(faixa.valorMaximo) : '∞'}
                                  </span>
                                  <span>{faixa.percentual}%</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}

                {selectedMaleta?.observacoes && (
                  <div className="p-4 rounded-lg border bg-card">
                    <p className="text-sm text-muted-foreground mb-2">Observações</p>
                    <p>{selectedMaleta.observacoes}</p>
                  </div>
                )}
              </TabsContent>

              {/* Tab Histórico */}
              <TabsContent value="historico" className="space-y-4">
                <div className="space-y-3">
                  {itemsVendidos.length > 0 && (
                    <div className="p-4 rounded-lg border bg-success/5">
                      <h4 className="font-semibold text-success mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Peças Vendidas ({itemsVendidos.length})
                      </h4>
                      <div className="space-y-2">
                        {itemsVendidos.map(item => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span>{item.peca?.nome}</span>
                            <span className="font-medium">{formatCurrency(item.peca?.preco_venda || 0)}</span>
                          </div>
                        ))}
                        <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
                          <span>Total</span>
                          <span>{formatCurrency(itemsVendidos.reduce((acc, item) => acc + (item.peca?.preco_venda || 0), 0))}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {itemsDevolvidos.length > 0 && (
                    <div className="p-4 rounded-lg border bg-muted/50">
                      <h4 className="font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                        <XCircle className="w-4 h-4" />
                        Peças Devolvidas ({itemsDevolvidos.length})
                      </h4>
                      <div className="space-y-2">
                        {itemsDevolvidos.map(item => (
                          <div key={item.id} className="flex justify-between text-sm text-muted-foreground">
                            <span>{item.peca?.nome}</span>
                            <span>{formatCurrency(item.peca?.preco_venda || 0)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {itemsPendentes.length > 0 && selectedMaleta?.status === 'aberta' && (
                    <div className="p-4 rounded-lg border bg-yellow-500/5">
                      <h4 className="font-semibold text-yellow-600 mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Peças Pendentes ({itemsPendentes.length})
                      </h4>
                      <div className="space-y-2">
                        {itemsPendentes.map(item => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span>{item.peca?.nome}</span>
                            <span>{formatCurrency(item.peca?.preco_venda || 0)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {maletaItems.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum histórico disponível
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-4">
              <div className="flex w-full justify-between">
                <Button 
                  variant="destructive" 
                  onClick={() => setIsDeleteMaletaOpen(true)}
                  disabled={deleteMaletaMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir Maleta
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsMaletaOpen(false)}>
                    Fechar
                  </Button>
                  {selectedMaleta?.status === 'aberta' && (
                    <Button
                      onClick={() => setIsCloseMaletaOpen(true)}
                      className="btn-gold"
                      disabled={maletaItems.length === 0}
                    >
                      Dar Baixa na Maleta
                    </Button>
                  )}
                </div>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Maleta Form Dialog */}
        <Dialog open={isMaletaFormOpen} onOpenChange={setIsMaletaFormOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">
                {selectedMaleta ? 'Editar Maleta' : 'Nova Maleta'}
              </DialogTitle>
              <DialogDescription>
                Configure os detalhes e personalização visual da maleta
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4 py-4 pr-4">
                {/* Preview da personalização */}
                <div 
                  className="relative h-20 rounded-lg overflow-hidden flex items-center justify-center"
                  style={{
                    background: maletaImagePreview 
                      ? `url(${maletaImagePreview}) center/cover`
                      : `linear-gradient(135deg, ${maletaFormData.cor_primaria}, ${maletaFormData.cor_secundaria})`
                  }}
                >
                  <div className="absolute inset-0 bg-black/20" />
                  <span className="relative text-white font-semibold text-lg drop-shadow-lg">
                    {maletaFormData.nome || 'Preview da Maleta'}
                  </span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maleta-nome">Nome da Maleta</Label>
                  <Input
                    id="maleta-nome"
                    value={maletaFormData.nome}
                    onChange={(e) => setMaletaFormData({ ...maletaFormData, nome: e.target.value })}
                    placeholder="Ex: Maleta Verão 2024"
                  />
                </div>

                {/* Upload de imagem */}
                <div className="space-y-2">
                  <Label>Imagem de Capa (opcional)</Label>
                  {maletaImagePreview ? (
                    <div className="relative w-full h-24 rounded-lg overflow-hidden border">
                      <img 
                        src={maletaImagePreview} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6"
                        onClick={() => {
                          setMaletaImageFile(null);
                          setMaletaImagePreview(null);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center w-full h-20 border-2 border-dashed rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors">
                      <div className="text-center">
                        <Upload className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
                        <span className="text-xs text-muted-foreground">Clique para enviar</span>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleMaletaImageChange}
                      />
                    </label>
                  )}
                </div>

                {/* Seletor de cores */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      Cores da Maleta
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowColorPicker(!showColorPicker)}
                    >
                      {showColorPicker ? 'Esconder' : 'Personalizar'}
                    </Button>
                  </div>
                  
                  {/* Preset colors */}
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        className={cn(
                          "w-8 h-8 rounded-full border-2 transition-all",
                          maletaFormData.cor_primaria === preset.primary 
                            ? "border-foreground scale-110" 
                            : "border-transparent hover:scale-105"
                        )}
                        style={{
                          background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})`
                        }}
                        onClick={() => setMaletaFormData({
                          ...maletaFormData,
                          cor_primaria: preset.primary,
                          cor_secundaria: preset.secondary,
                        })}
                        title={preset.name}
                      />
                    ))}
                  </div>

                  {showColorPicker && (
                    <div className="grid grid-cols-2 gap-3 p-3 bg-secondary/30 rounded-lg">
                      <div className="space-y-1">
                        <Label className="text-xs">Cor Principal</Label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={maletaFormData.cor_primaria}
                            onChange={(e) => setMaletaFormData({ ...maletaFormData, cor_primaria: e.target.value })}
                            className="w-10 h-8 rounded cursor-pointer"
                          />
                          <Input
                            value={maletaFormData.cor_primaria}
                            onChange={(e) => setMaletaFormData({ ...maletaFormData, cor_primaria: e.target.value })}
                            className="h-8 text-xs font-mono flex-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Cor Secundária</Label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={maletaFormData.cor_secundaria}
                            onChange={(e) => setMaletaFormData({ ...maletaFormData, cor_secundaria: e.target.value })}
                            className="w-10 h-8 rounded cursor-pointer"
                          />
                          <Input
                            value={maletaFormData.cor_secundaria}
                            onChange={(e) => setMaletaFormData({ ...maletaFormData, cor_secundaria: e.target.value })}
                            className="h-8 text-xs font-mono flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maleta-prazo">Prazo de Devolução</Label>
                  <Input
                    id="maleta-prazo"
                    type="date"
                    value={maletaFormData.prazo_devolucao}
                    onChange={(e) => setMaletaFormData({ ...maletaFormData, prazo_devolucao: e.target.value })}
                  />
                </div>

                {/* Commission Scale */}
                <div className="border-t pt-4">
                  <ComissaoEscala
                    faixas={faixasComissao}
                    onChange={setFaixasComissao}
                    comissaoFixa={comissaoFixaMaleta}
                    onComissaoFixaChange={setComissaoFixaMaleta}
                    usarEscala={usarEscalaComissao}
                    onUsarEscalaChange={setUsarEscalaComissao}
                    totalVendas={totalVendidoMaleta}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maleta-obs">Observações</Label>
                  <Textarea
                    id="maleta-obs"
                    value={maletaFormData.observacoes}
                    onChange={(e) => setMaletaFormData({ ...maletaFormData, observacoes: e.target.value })}
                    placeholder="Observações sobre a maleta..."
                    rows={3}
                  />
                </div>
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsMaletaFormOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSubmitMaleta} 
                className="btn-gold"
                disabled={addMaletaMutation.isPending || updateMaletaMutation.isPending || isUploadingImage}
              >
                {(addMaletaMutation.isPending || updateMaletaMutation.isPending || isUploadingImage) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {selectedMaleta ? 'Salvar' : 'Criar Maleta'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Close Maleta Confirmation */}
        <AlertDialog open={isCloseMaletaOpen} onOpenChange={setIsCloseMaletaOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Dar baixa na maleta?</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>Ao dar baixa na maleta:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><strong>{itemsVendidos.length}</strong> peças serão registradas como vendidas</li>
                  <li><strong>{itemsPendentes.length}</strong> peças pendentes voltarão ao estoque</li>
                  <li>A maleta será fechada e não poderá mais ser editada</li>
                </ul>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleFecharMaleta}
                className="btn-gold"
                disabled={closeMaletaMutation.isPending}
              >
                {closeMaletaMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Confirmar Baixa
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Export PDF Dialog */}
        <AlertDialog open={showExportDialog} onOpenChange={(open) => {
          if (!open) {
            setShowExportDialog(false);
            setMaletaFechada(null);
          }
        }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-success" />
                Maleta fechada com sucesso!
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                {maletaFechada && (
                  <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                    <p><strong>Maleta:</strong> {maletaFechada.maleta.nome || 'Sem nome'}</p>
                    <p><strong>Revendedora:</strong> {maletaFechada.revendedora?.nome || 'N/A'}</p>
                    <div className="border-t pt-2 mt-2">
                      <p><strong>Total Vendido:</strong> {formatCurrency(maletaFechada.acerto.totalVendido)}</p>
                      <p><strong>Comissão ({maletaFechada.acerto.percentualComissao}%):</strong> {formatCurrency(maletaFechada.acerto.valorComissao)}</p>
                      <p className="text-lg font-semibold"><strong>Valor a Receber:</strong> {formatCurrency(maletaFechada.acerto.valorLiquido)}</p>
                    </div>
                  </div>
                )}
                <p className="text-sm">Deseja exportar o resumo em PDF?</p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setShowExportDialog(false);
                setMaletaFechada(null);
              }}>
                Fechar
              </AlertDialogCancel>
              <Button onClick={exportarResumoPDF} className="btn-gold">
                <FileDown className="w-4 h-4 mr-2" />
                Exportar PDF
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* WhatsApp Templates Modal */}
        <WhatsAppTemplates 
          open={isWhatsAppTemplatesOpen} 
          onOpenChange={setIsWhatsAppTemplatesOpen} 
        />
      </div>
    );
  }

  // List View
  return (
    <div className="p-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Revendedoras</h1>
            <p className="text-sm text-muted-foreground">Sua equipe de vendas consignadas</p>
          </div>
        </div>
        <ReadOnlyGuard>
          <Button onClick={() => handleOpenForm()} className="btn-gold">
            <UserPlus className="w-4 h-4 mr-2" />
            Nova Revendedora
          </Button>
        </ReadOnlyGuard>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <MiniGradientCard
          title="Total"
          value={revendedoras.length}
          icon={Users}
          gradient="purple"
        />
        <MiniGradientCard
          title="Com Maleta Ativa"
          value={revendedoras.filter(r => maletas.some(m => m.revendedora_id === r.id && m.status === 'aberta')).length}
          icon={Briefcase}
          gradient="teal"
        />
        <MiniGradientCard
          title="Comissão Média"
          value={`${revendedoras.length > 0 
            ? Math.round(revendedoras.reduce((acc, r) => acc + (r.comissao_percentual || 30), 0) / revendedoras.length) 
            : 0}%`}
          icon={Package}
          gradient="orange"
        />
      </div>

      {/* Cards Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {revendedoras.map((rev, index) => (
          <div key={rev.id} className="animate-stagger" style={{ animationDelay: `${index * 50}ms` }}>
            <RevendedoraCard
              revendedora={rev}
              onView={() => setViewingRevendedora(rev)}
              onEdit={() => handleOpenForm(rev)}
              onDelete={() => {
                setSelectedRevendedora(rev);
                setIsDeleteOpen(true);
              }}
              onCopyLink={() => handleCopyLink(rev.id)}
            />
          </div>
        ))}

        {revendedoras.length === 0 && (
          <div className="col-span-full">
            <div className="empty-state">
              <div className="empty-state-icon">
                <Users />
              </div>
              <h3 className="empty-state-title">Nenhuma revendedora cadastrada</h3>
              <p className="empty-state-description">
                Cadastre sua primeira revendedora para começar a gerenciar maletas e vendas consignadas
              </p>
              <Button onClick={() => handleOpenForm()} className="btn-gold mt-6">
                <UserPlus className="w-4 h-4 mr-2" />
                Nova Revendedora
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {selectedRevendedora ? 'Editar Revendedora' : 'Nova Revendedora'}
            </DialogTitle>
            <DialogDescription>
              {selectedRevendedora
                ? 'Atualize as informações da revendedora'
                : 'Cadastre uma nova revendedora para sua equipe'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Maria Silva"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="comissao">Comissão (%)</Label>
                <Input
                  id="comissao"
                  type="number"
                  value={formData.comissao}
                  onChange={(e) => setFormData({ ...formData, comissao: e.target.value })}
                  placeholder="30"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="maria@email.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              className="btn-gold"
              disabled={addRevendedoraMutation.isPending || updateRevendedoraMutation.isPending}
            >
              {(addRevendedoraMutation.isPending || updateRevendedoraMutation.isPending) ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              {selectedRevendedora ? 'Salvar Alterações' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A revendedora "{selectedRevendedora?.nome}" e
              todas as suas maletas serão removidas permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDelete(false)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteRevendedoraMutation.isPending}
            >
              {deleteRevendedoraMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Maleta Alert Dialog */}
      <AlertDialog open={isDeleteMaletaOpen} onOpenChange={setIsDeleteMaletaOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Maleta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a maleta "{selectedMaleta?.nome}"? 
              {maletaItems.filter(i => !i.vendida).length > 0 && (
                <span className="block mt-2 text-amber-600">
                  ⚠️ {maletaItems.filter(i => !i.vendida).length} peça(s) não vendida(s) serão devolvidas ao estoque.
                </span>
              )}
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async (e) => {
                e.preventDefault();
                if (selectedMaleta) {
                  try {
                    await deleteMaletaMutation.mutateAsync({ 
                      maletaId: selectedMaleta.id, 
                      returnToStock: true 
                    });
                    setIsDeleteMaletaOpen(false);
                    setIsMaletaOpen(false);
                    setSelectedMaleta(null);
                  } catch (error) {
                    console.error('Error deleting maleta:', error);
                  }
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMaletaMutation.isPending}
            >
              {deleteMaletaMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Excluir Maleta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de seleção de quantidade para venda */}
      <QuantidadeVendaModal
        open={vendaModalOpen}
        onOpenChange={setVendaModalOpen}
        item={itemParaVenda}
        onConfirm={handleConfirmarVenda}
        isPending={updateMaletaItemMutation.isPending}
      />
    </div>
  );
}

// Maleta Card Component
function MaletaCard({ 
  maleta, 
  comissao, 
  onClick,
  onEdit,
}: { 
  maleta: Maleta; 
  comissao: number; 
  onClick: () => void;
  onEdit: () => void;
}) {
  const { data: items = [] } = useMaletaItems(maleta.id);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const totalVendido = items
    .filter((item) => item.status === 'vendido')
    .reduce((acc, item) => acc + ((item.peca?.preco_venda || 0) * (item.quantidade || 1)), 0);

  // Count quantities, not just records
  const totalPecas = items.reduce((acc, i) => acc + (i.quantidade || 1), 0);
  const pendentes = items.filter(i => i.status === 'pendente').reduce((acc, i) => acc + (i.quantidade || 1), 0);
  const vendidas = items.filter(i => i.status === 'vendido').reduce((acc, i) => acc + (i.quantidade || 1), 0);

  const calcularDiasRestantes = (prazo: string | null) => {
    if (!prazo) return null;
    const prazoDate = new Date(prazo);
    return differenceInDays(prazoDate, new Date());
  };

  const diasRestantes = calcularDiasRestantes(maleta.data_devolucao ? String(maleta.data_devolucao) : null);
  const isVencida = diasRestantes !== null && diasRestantes < 0;
  const isVencendo = diasRestantes !== null && diasRestantes >= 0 && diasRestantes <= 3;

  return (
    <Card
      className={cn(
        "glass-card hover-lift cursor-pointer",
        isVencida && maleta.status === 'aberta' && "border-destructive/50",
        isVencendo && maleta.status === 'aberta' && "border-yellow-500/50"
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              'w-12 h-12 rounded-lg flex items-center justify-center',
              maleta.status === 'aberta' ? 'bg-success/10' : 'bg-muted'
            )}>
              <Briefcase className={cn(
                'w-6 h-6',
                maleta.status === 'aberta' ? 'text-success' : 'text-muted-foreground'
              )} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">
                  {maleta.nome || `Maleta #${maleta.id.slice(-4)}`}
                </h3>
                <Badge variant={maleta.status === 'aberta' ? 'default' : 'secondary'}>
                  {maleta.status === 'aberta' ? 'Aberta' : 'Fechada'}
                </Badge>
                {maleta.status === 'aberta' && diasRestantes !== null && (
                  <Badge 
                    variant="outline" 
                    className={cn(
                      isVencida && "border-destructive text-destructive",
                      isVencendo && "border-yellow-500 text-yellow-600",
                      !isVencida && !isVencendo && "border-success text-success"
                    )}
                  >
                    {isVencida 
                      ? `Vencida há ${Math.abs(diasRestantes)}d` 
                      : `${diasRestantes}d restantes`
                    }
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {totalPecas} peças • {vendidas} vendidas • {pendentes} pendentes
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total vendido</p>
              <p className="font-semibold text-lg">{formatCurrency(totalVendido)}</p>
            </div>
            {maleta.status === 'aberta' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Pencil className="w-4 h-4" />
              </Button>
            )}
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Revendedora Card Component
function RevendedoraCard({
  revendedora,
  onView,
  onEdit,
  onDelete,
  onCopyLink,
}: {
  revendedora: Revendedora;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCopyLink: () => void;
}) {
  const { data: maletas = [] } = useMaletas(revendedora.id);

  const maletasAbertas = maletas.filter((m) => m.status === 'aberta').length;

  return (
    <Card
      className="glass-card hover-lift cursor-pointer"
      onClick={onView}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full gold-gradient flex items-center justify-center text-lg font-semibold text-primary-foreground">
              {revendedora.nome.charAt(0)}
            </div>
            <div>
              <h3 className="font-semibold">{revendedora.nome}</h3>
              <p className="text-sm text-muted-foreground">
                {revendedora.comissao_percentual || 30}% comissão
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onCopyLink();
                }}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copiar Link do Portal
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Pencil className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="w-4 h-4" />
            {revendedora.telefone || 'Não informado'}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="w-4 h-4" />
            {revendedora.email || 'Não informado'}
          </div>
        </div>

        <div className="flex gap-4 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">
              <span className="font-medium">{maletasAbertas}</span> abertas
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">
              <span className="font-medium">{maletas.length}</span> maletas
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
