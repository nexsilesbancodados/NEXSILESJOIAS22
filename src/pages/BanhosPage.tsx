import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  Droplets,
  Package,
  Send,
  Calendar,
  Clock,
  Loader2,
  Scale,
  Calculator,
  X,
  Hash,
  Printer,
  HelpCircle
} from 'lucide-react';
import { EtiquetaGalvanicaModal } from '@/components/galvanica/EtiquetaGalvanicaModal';
import { InteractiveTour, useInteractiveTour, TourStep } from '@/components/onboarding/InteractiveTour';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ReadOnlyGuard } from '@/components/subscription/ReadOnlyGuard';
import { 
  useBanhos, 
  useAddBanho, 
  useUpdateBanho, 
  useDeleteBanho,
  useEnviosGalvanica,
  useAddEnvioGalvanica,
  useUpdateEnvioGalvanica,
  useDeleteEnvioGalvanica,
  useAllEnvioGalvanicaItens,
  Banho,
  EnvioGalvanica
} from '@/hooks/useSupabaseData';
import { supabase } from '@/lib/supabase-db';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Eye, Lightbulb, Info } from 'lucide-react';

// ============ PASSOS DO TOUR ============
const BANHOS_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Bem-vindo ao módulo de Banhos! 🎉',
    description: 'Aqui você gerencia os tipos de banho (Ouro, Prata, Ródio, etc.) e controla os envios para a galvânica. Vamos fazer um tour rápido!',
    placement: 'center',
  },
  {
    id: 'tabs',
    title: 'Abas principais',
    description: 'Use as abas para alternar entre cadastrar tipos de banho e gerenciar envios para galvânica.',
    target: '[data-tour="tabs-banhos"]',
    placement: 'bottom',
  },
  {
    id: 'novo-banho',
    title: 'Cadastrar novo banho',
    description: 'Clique aqui para criar um novo tipo de banho. Defina nome, categoria, cor e preço por grama.',
    target: '[data-tour="btn-novo-banho"]',
    placement: 'left',
  },
  {
    id: 'lista-banhos',
    title: 'Lista de banhos',
    description: 'Seus tipos de banho aparecem aqui. Você pode editar ou excluir cada um.',
    target: '[data-tour="lista-banhos"]',
    placement: 'top',
  },
  {
    id: 'tab-galvanica',
    title: 'Aba Galvânica',
    description: 'Após cadastrar os banhos, vá para a aba Galvânica para criar envios e registrar as peças.',
    target: '[data-tour="tab-galvanica"]',
    placement: 'bottom',
  },
  {
    id: 'final',
    title: 'Pronto para começar!',
    description: 'Agora você sabe o básico. Cadastre seus banhos e depois crie envios para a galvânica. Boa sorte! 🚀',
    placement: 'center',
  },
];

// ============ CATEGORIAS DE BANHO ============
const CATEGORIAS_BANHO = [
  { value: 'metais-preciosos', label: 'Metais Preciosos' },
  { value: 'metais-nobres', label: 'Metais Nobres' },
  { value: 'metais-base', label: 'Metais Base' },
  { value: 'acabamentos-especiais', label: 'Acabamentos Especiais' },
  { value: 'coloridos', label: 'Coloridos' },
  { value: 'vintage', label: 'Vintage/Antigo' },
  { value: 'personalizados', label: 'Personalizados' },
];

// ============ TIPOS DE BANHO COMPLETOS ============
const TIPOS_BANHO = [
  // Metais Preciosos - Ouro
  { value: 'ouro-24k', label: 'Ouro 24K', cor: '#FFD700', categoria: 'metais-preciosos' },
  { value: 'ouro-18k', label: 'Ouro 18K', cor: '#F4C430', categoria: 'metais-preciosos' },
  { value: 'ouro-14k', label: 'Ouro 14K', cor: '#E6BE8A', categoria: 'metais-preciosos' },
  { value: 'ouro-10k', label: 'Ouro 10K', cor: '#D4AF37', categoria: 'metais-preciosos' },
  { value: 'ouro', label: 'Ouro', cor: '#FFD700', categoria: 'metais-preciosos' },
  { value: 'ouro-branco', label: 'Ouro Branco', cor: '#FFFFF0', categoria: 'metais-preciosos' },
  { value: 'ouro-rose', label: 'Ouro Rosé', cor: '#E8B4B8', categoria: 'metais-preciosos' },
  { value: 'ouro-champagne', label: 'Ouro Champagne', cor: '#F7E7CE', categoria: 'metais-preciosos' },
  { value: 'ouro-vermelho', label: 'Ouro Vermelho', cor: '#B46060', categoria: 'metais-preciosos' },
  { value: 'ouro-verde', label: 'Ouro Verde', cor: '#B5C99A', categoria: 'metais-preciosos' },
  
  // Metais Preciosos - Prata
  { value: 'prata', label: 'Prata', cor: '#C0C0C0', categoria: 'metais-preciosos' },
  { value: 'prata-925', label: 'Prata 925', cor: '#C0C0C0', categoria: 'metais-preciosos' },
  { value: 'prata-950', label: 'Prata 950', cor: '#D4D4D4', categoria: 'metais-preciosos' },
  { value: 'prata-700', label: 'Prata 700', cor: '#A8A8A8', categoria: 'metais-preciosos' },
  { value: 'prata-velha', label: 'Prata Velha', cor: '#8B8989', categoria: 'metais-preciosos' },
  { value: 'prata-escurecida', label: 'Prata Escurecida', cor: '#696969', categoria: 'metais-preciosos' },
  { value: 'prata-envelhecida', label: 'Prata Envelhecida', cor: '#7B7B7B', categoria: 'metais-preciosos' },
  
  // Metais Nobres
  { value: 'platina', label: 'Platina', cor: '#E5E4E2', categoria: 'metais-nobres' },
  { value: 'paladio', label: 'Paládio', cor: '#CED0CE', categoria: 'metais-nobres' },
  { value: 'rodio', label: 'Ródio', cor: '#E8E8E8', categoria: 'metais-nobres' },
  { value: 'rodio-branco', label: 'Ródio Branco', cor: '#FFFFFF', categoria: 'metais-nobres' },
  { value: 'rodio-negro', label: 'Ródio Negro', cor: '#2F2F2F', categoria: 'metais-nobres' },
  { value: 'rodio-champagne', label: 'Ródio Champagne', cor: '#F5DEB3', categoria: 'metais-nobres' },
  { value: 'ruthenio', label: 'Rutênio', cor: '#4A4A4A', categoria: 'metais-nobres' },
  { value: 'iridio', label: 'Irídio', cor: '#B0B0B0', categoria: 'metais-nobres' },
  
  // Metais Base
  { value: 'niquel', label: 'Níquel', cor: '#727472', categoria: 'metais-base' },
  { value: 'cobre', label: 'Cobre', cor: '#B87333', categoria: 'metais-base' },
  { value: 'bronze', label: 'Bronze', cor: '#CD7F32', categoria: 'metais-base' },
  { value: 'latao', label: 'Latão', cor: '#B5A642', categoria: 'metais-base' },
  { value: 'estanho', label: 'Estanho', cor: '#D3D4D5', categoria: 'metais-base' },
  { value: 'zinco', label: 'Zinco', cor: '#BCC6CC', categoria: 'metais-base' },
  { value: 'cromo', label: 'Cromo', cor: '#DBE4E8', categoria: 'metais-base' },
  { value: 'cromado', label: 'Cromado', cor: '#E0E0E0', categoria: 'metais-base' },
  
  // Aço
  { value: 'aco', label: 'Aço', cor: '#71797E', categoria: 'metais-base' },
  { value: 'aco-inox', label: 'Aço Inox', cor: '#8B8D8E', categoria: 'metais-base' },
  { value: 'aco-cirurgico', label: 'Aço Cirúrgico', cor: '#C0C5CE', categoria: 'metais-base' },
  { value: 'aco-dourado', label: 'Aço Dourado', cor: '#CFB53B', categoria: 'metais-base' },
  { value: 'aco-rose', label: 'Aço Rosé', cor: '#E8B4B8', categoria: 'metais-base' },
  { value: 'aco-negro', label: 'Aço Negro', cor: '#1C1C1C', categoria: 'metais-base' },
  
  // Acabamentos Especiais
  { value: 'grafite', label: 'Grafite', cor: '#4A4A4A', categoria: 'acabamentos-especiais' },
  { value: 'titanio', label: 'Titânio', cor: '#878787', categoria: 'acabamentos-especiais' },
  { value: 'tungsteno', label: 'Tungstênio', cor: '#5D5D5D', categoria: 'acabamentos-especiais' },
  { value: 'gun-metal', label: 'Gun Metal', cor: '#2A3439', categoria: 'acabamentos-especiais' },
  { value: 'diamante', label: 'Diamante', cor: '#B9F2FF', categoria: 'acabamentos-especiais' },
  { value: 'diamantado', label: 'Diamantado', cor: '#E6E8FA', categoria: 'acabamentos-especiais' },
  { value: 'acetinado', label: 'Acetinado', cor: '#F5F5F5', categoria: 'acabamentos-especiais' },
  { value: 'fosco', label: 'Fosco', cor: '#A9A9A9', categoria: 'acabamentos-especiais' },
  { value: 'brilhante', label: 'Brilhante', cor: '#FFFACD', categoria: 'acabamentos-especiais' },
  { value: 'escovado', label: 'Escovado', cor: '#C8C8C8', categoria: 'acabamentos-especiais' },
  { value: 'polido', label: 'Polido', cor: '#FAFAFA', categoria: 'acabamentos-especiais' },
  { value: 'texturizado', label: 'Texturizado', cor: '#B8B8B8', categoria: 'acabamentos-especiais' },
  { value: 'martelado', label: 'Martelado', cor: '#A0A0A0', categoria: 'acabamentos-especiais' },
  { value: 'gravado', label: 'Gravado', cor: '#D0D0D0', categoria: 'acabamentos-especiais' },
  { value: 'esmaltado', label: 'Esmaltado', cor: '#E8E8E8', categoria: 'acabamentos-especiais' },
  { value: 'verniz', label: 'Verniz', cor: '#F0E68C', categoria: 'acabamentos-especiais' },
  { value: 'lacado', label: 'Lacado', cor: '#FAF0E6', categoria: 'acabamentos-especiais' },
  
  // Coloridos
  { value: 'rose', label: 'Rosé', cor: '#B76E79', categoria: 'coloridos' },
  { value: 'champagne', label: 'Champagne', cor: '#F7E7CE', categoria: 'coloridos' },
  { value: 'cognac', label: 'Cognac', cor: '#834C24', categoria: 'coloridos' },
  { value: 'couro', label: 'Couro', cor: '#8B4513', categoria: 'coloridos' },
  { value: 'black', label: 'Black/Preto', cor: '#000000', categoria: 'coloridos' },
  { value: 'white', label: 'White/Branco', cor: '#FFFFFF', categoria: 'coloridos' },
  { value: 'pearl', label: 'Pérola', cor: '#F0EAD6', categoria: 'coloridos' },
  { value: 'rainbow', label: 'Rainbow/Iridescente', cor: 'linear-gradient(135deg, #FFD700, #C0C0C0, #B76E79, #B9F2FF)', categoria: 'coloridos' },
  { value: 'mix-banho', label: 'Mix de Banho', cor: 'linear-gradient(135deg, #FFD700, #C0C0C0, #B76E79)', categoria: 'coloridos' },
  { value: 'azul', label: 'Azul', cor: '#1E90FF', categoria: 'coloridos' },
  { value: 'verde', label: 'Verde', cor: '#228B22', categoria: 'coloridos' },
  { value: 'vermelho', label: 'Vermelho', cor: '#DC143C', categoria: 'coloridos' },
  { value: 'roxo', label: 'Roxo', cor: '#800080', categoria: 'coloridos' },
  { value: 'rosa', label: 'Rosa', cor: '#FF69B4', categoria: 'coloridos' },
  { value: 'laranja', label: 'Laranja', cor: '#FF8C00', categoria: 'coloridos' },
  { value: 'amarelo', label: 'Amarelo', cor: '#FFD700', categoria: 'coloridos' },
  { value: 'turquesa', label: 'Turquesa', cor: '#40E0D0', categoria: 'coloridos' },
  
  // Vintage/Antigo
  { value: 'moeda-antiga', label: 'Moeda Antiga', cor: '#B08D57', categoria: 'vintage' },
  { value: 'bronze-antigo', label: 'Bronze Antigo', cor: '#8B4513', categoria: 'vintage' },
  { value: 'ouro-velho', label: 'Ouro Velho', cor: '#CDA434', categoria: 'vintage' },
  { value: 'prata-antiga', label: 'Prata Antiga', cor: '#6B6B6B', categoria: 'vintage' },
  { value: 'cobre-antigo', label: 'Cobre Antigo', cor: '#96503B', categoria: 'vintage' },
  { value: 'latao-antigo', label: 'Latão Antigo', cor: '#9B7E46', categoria: 'vintage' },
  { value: 'patina', label: 'Pátina', cor: '#4A5D23', categoria: 'vintage' },
  { value: 'oxidado', label: 'Oxidado', cor: '#5C4033', categoria: 'vintage' },
  { value: 'envelhecido', label: 'Envelhecido', cor: '#8B7355', categoria: 'vintage' },
  { value: 'rustico', label: 'Rústico', cor: '#A0522D', categoria: 'vintage' },
  { value: 'bruto', label: 'Bruto', cor: '#8B8B83', categoria: 'vintage' },
  { value: 'vintage', label: 'Vintage', cor: '#8E7618', categoria: 'vintage' },
];

// Helper function to get color from banho
const getBanhoColor = (banho: Banho): string => {
  const tipo = TIPOS_BANHO.find(t => t.label === banho.nome || t.value === banho.tipo);
  return tipo?.cor || '#C0C0C0';
};

// ============ ACABAMENTOS ============
const ACABAMENTOS = [
  { value: 'brilhante', label: 'Brilhante' },
  { value: 'fosco', label: 'Fosco' },
  { value: 'acetinado', label: 'Acetinado' },
  { value: 'escovado', label: 'Escovado' },
  { value: 'polido', label: 'Polido' },
  { value: 'diamantado', label: 'Diamantado' },
  { value: 'texturizado', label: 'Texturizado' },
  { value: 'martelado', label: 'Martelado' },
  { value: 'gravado', label: 'Gravado' },
  { value: 'esmaltado', label: 'Esmaltado' },
  { value: 'vernizado', label: 'Vernizado' },
  { value: 'lacado', label: 'Lacado' },
  { value: 'envelhecido', label: 'Envelhecido' },
  { value: 'oxidado', label: 'Oxidado' },
  { value: 'patinado', label: 'Patinado' },
  { value: 'natural', label: 'Natural' },
];

// ============ QUALIDADES/ESPESSURAS ============
const QUALIDADES = [
  { value: 'standard', label: 'Standard' },
  { value: 'premium', label: 'Premium' },
  { value: 'luxo', label: 'Luxo' },
  { value: 'flash', label: 'Flash (fino)' },
  { value: 'semi-flash', label: 'Semi-Flash' },
  { value: 'medio', label: 'Médio' },
  { value: 'grosso', label: 'Grosso' },
  { value: 'extra-grosso', label: 'Extra Grosso' },
  { value: 'duplo', label: 'Duplo' },
  { value: 'triplo', label: 'Triplo' },
];

// ============ ESPESSURAS ESPECÍFICAS (MICRONS) ============
const ESPESSURAS_MICRONS = [
  { value: '0.5', label: '0.5 µm' },
  { value: '1', label: '1 µm' },
  { value: '2', label: '2 µm' },
  { value: '3', label: '3 µm' },
  { value: '5', label: '5 µm' },
  { value: '7', label: '7 µm' },
  { value: '10', label: '10 µm' },
  { value: '15', label: '15 µm' },
  { value: '20', label: '20 µm' },
  { value: '25', label: '25 µm' },
  { value: '30', label: '30 µm' },
  { value: '50', label: '50 µm' },
];

// ============ DURABILIDADE ============
const DURABILIDADES = [
  { value: 'baixa', label: 'Baixa (uso ocasional)' },
  { value: 'media', label: 'Média (uso regular)' },
  { value: 'alta', label: 'Alta (uso intenso)' },
  { value: 'muito-alta', label: 'Muito Alta (profissional)' },
  { value: 'permanente', label: 'Permanente' },
];

// ============ FORNECEDORES/GALVÂNICAS ============
const FORNECEDORES_GALVANICA = [
  { value: 'galvanica-principal', label: 'Galvânica Principal' },
  { value: 'galvanica-secundaria', label: 'Galvânica Secundária' },
  { value: 'galvanica-express', label: 'Galvânica Express' },
  { value: 'galvanica-premium', label: 'Galvânica Premium' },
  { value: 'outro', label: 'Outro Fornecedor' },
];

// ============ PRIORIDADES ============
const PRIORIDADES = [
  { value: 'baixa', label: 'Baixa', color: 'bg-gray-500/20 text-gray-700' },
  { value: 'normal', label: 'Normal', color: 'bg-blue-500/20 text-blue-700' },
  { value: 'alta', label: 'Alta', color: 'bg-amber-500/20 text-amber-700' },
  { value: 'urgente', label: 'Urgente', color: 'bg-red-500/20 text-red-700' },
];

// ============ STATUS DE ENVIO ============
const STATUS_ENVIO: Record<string, { label: string; color: string }> = {
  pendente: { label: 'Pendente', color: 'bg-gray-500/20 text-gray-700' },
  aguardando_coleta: { label: 'Aguardando Coleta', color: 'bg-yellow-500/20 text-yellow-700' },
  coletado: { label: 'Coletado', color: 'bg-orange-500/20 text-orange-700' },
  enviado: { label: 'Enviado', color: 'bg-blue-500/20 text-blue-700' },
  em_transito: { label: 'Em Trânsito', color: 'bg-cyan-500/20 text-cyan-700' },
  recebido: { label: 'Recebido', color: 'bg-indigo-500/20 text-indigo-700' },
  em_processo: { label: 'Em Processo', color: 'bg-purple-500/20 text-purple-700' },
  em_banho: { label: 'Em Banho', color: 'bg-violet-500/20 text-violet-700' },
  secagem: { label: 'Secagem', color: 'bg-pink-500/20 text-pink-700' },
  controle_qualidade: { label: 'Controle de Qualidade', color: 'bg-teal-500/20 text-teal-700' },
  finalizado: { label: 'Finalizado', color: 'bg-amber-500/20 text-amber-700' },
  aguardando_retorno: { label: 'Aguardando Retorno', color: 'bg-lime-500/20 text-lime-700' },
  retornado: { label: 'Retornado', color: 'bg-green-500/20 text-green-700' },
  parcial: { label: 'Retorno Parcial', color: 'bg-emerald-500/20 text-emerald-700' },
  problema: { label: 'Problema/Retrabalho', color: 'bg-red-500/20 text-red-700' },
  cancelado: { label: 'Cancelado', color: 'bg-slate-500/20 text-slate-700' },
};

// ============ TIPO DE PEÇAS ============
const TIPOS_PECAS = [
  { value: 'aneis', label: 'Anéis' },
  { value: 'aliancas', label: 'Alianças' },
  { value: 'brincos', label: 'Brincos' },
  { value: 'colares', label: 'Colares' },
  { value: 'correntes', label: 'Correntes' },
  { value: 'pulseiras', label: 'Pulseiras' },
  { value: 'braceletes', label: 'Braceletes' },
  { value: 'pingentes', label: 'Pingentes' },
  { value: 'medalhas', label: 'Medalhas' },
  { value: 'crucifixos', label: 'Crucifixos' },
  { value: 'berloques', label: 'Berloques' },
  { value: 'tornozeleiras', label: 'Tornozeleiras' },
  { value: 'broches', label: 'Broches' },
  { value: 'abotoaduras', label: 'Abotoaduras' },
  { value: 'clips', label: 'Clips/Presilhas' },
  { value: 'piercing', label: 'Piercing' },
  { value: 'relogios', label: 'Relógios' },
  { value: 'fivelas', label: 'Fivelas' },
  { value: 'componentes', label: 'Componentes' },
  { value: 'mix', label: 'Mix/Diversos' },
];

// ============ MÉTODOS DE BANHO ============
const METODOS_BANHO = [
  { value: 'imersao', label: 'Imersão' },
  { value: 'spray', label: 'Spray/Pulverização' },
  { value: 'eletrolise', label: 'Eletrólise' },
  { value: 'sputtering', label: 'Sputtering/PVD' },
  { value: 'ionizacao', label: 'Ionização' },
  { value: 'a-quente', label: 'A Quente' },
  { value: 'a-frio', label: 'A Frio' },
  { value: 'manual', label: 'Manual' },
  { value: 'automatizado', label: 'Automatizado' },
];

export default function BanhosPage() {
  const { data: banhos = [], isLoading: isLoadingBanhos } = useBanhos();
  const { data: envios = [], isLoading: isLoadingEnvios } = useEnviosGalvanica();
  const { data: allEnvioItens = [], isLoading: isLoadingItens } = useAllEnvioGalvanicaItens();
  const { mutate: addBanho } = useAddBanho();
  const { mutate: updateBanho } = useUpdateBanho();
  const { mutate: deleteBanho } = useDeleteBanho();
  const { mutate: addEnvio } = useAddEnvioGalvanica();
  const { mutate: updateEnvio } = useUpdateEnvioGalvanica();
  const { mutate: deleteEnvio } = useDeleteEnvioGalvanica();

  const [activeTab, setActiveTab] = useState('banhos');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEnvioFormOpen, setIsEnvioFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedBanho, setSelectedBanho] = useState<Banho | null>(null);
  const [selectedEnvio, setSelectedEnvio] = useState<EnvioGalvanica | null>(null);
  const [expandedEnvios, setExpandedEnvios] = useState<Set<string>>(new Set());
  
  // Hook do tour interativo
  const { showTour, startTour, endTour } = useInteractiveTour('banhos_tour_completed');
  
  // Estado para controlar visibilidade das dicas (persistido no localStorage)
  const [showDicaBanhos, setShowDicaBanhos] = useState(() => {
    const saved = localStorage.getItem('banhos_dica_banhos_visible');
    return saved !== 'false';
  });
  const [showDicaGalvanica, setShowDicaGalvanica] = useState(() => {
    const saved = localStorage.getItem('banhos_dica_galvanica_visible');
    return saved !== 'false';
  });
  
  const toggleDicaBanhos = () => {
    const newValue = !showDicaBanhos;
    setShowDicaBanhos(newValue);
    localStorage.setItem('banhos_dica_banhos_visible', String(newValue));
  };
  
  const toggleDicaGalvanica = () => {
    const newValue = !showDicaGalvanica;
    setShowDicaGalvanica(newValue);
    localStorage.setItem('banhos_dica_galvanica_visible', String(newValue));
  };

  // Função para obter itens de um envio específico
  const getEnvioItens = (envioId: string) => {
    return allEnvioItens.filter(item => item.envio_id === envioId);
  };
  
  // Toggle expandir/recolher envio
  const toggleEnvioExpanded = (envioId: string) => {
    setExpandedEnvios(prev => {
      const newSet = new Set(prev);
      if (newSet.has(envioId)) {
        newSet.delete(envioId);
      } else {
        newSet.add(envioId);
      }
      return newSet;
    });
  };

  const [formData, setFormData] = useState({
    nome: '',
    tipo: '',
    categoria: '',
    cor: '#C0C0C0',
    preco_por_grama: '',
    acabamento: '',
    qualidade: '',
    espessura_microns: '',
    durabilidade: '',
    descricao: '',
    ativo: true,
  });

  // Interface para item do envio (agora com nome da peça manual)
  interface EnvioItem {
    id: string;
    banho_id: string;
    nome_peca: string;
    tipo_pecas: string;
    quantidade_pecas: number;
    peso_enviado: number;
    peso_cobrado: number;
    preco_por_grama: number;
    subtotal: number;
  }

  // Interface para peça cadastrada manualmente no envio
  interface PecaEnvio {
    id: string;
    nome: string;
    tipo: string;
    quantidade: number;
    peso: number;
  }

  const [envioItens, setEnvioItens] = useState<EnvioItem[]>([]);
  const [pecasEnvio, setPecasEnvio] = useState<PecaEnvio[]>([]);
  
  const emptyEnvioItem = (): EnvioItem => ({
    id: crypto.randomUUID(),
    banho_id: '',
    nome_peca: '',
    tipo_pecas: '',
    quantidade_pecas: 0,
    peso_enviado: 0,
    peso_cobrado: 0,
    preco_por_grama: 0,
    subtotal: 0,
  });
  
  const emptyPecaEnvio = (): PecaEnvio => ({
    id: crypto.randomUUID(),
    nome: '',
    tipo: '',
    quantidade: 1,
    peso: 0,
  });
  
  // Adicionar nova peça ao envio
  const adicionarPecaEnvio = () => {
    setPecasEnvio(prev => [...prev, emptyPecaEnvio()]);
  };
  
  // Remover peça do envio
  const removerPecaEnvio = (id: string) => {
    setPecasEnvio(prev => prev.filter(p => p.id !== id));
  };
  
  // Atualizar peça do envio
  const atualizarPecaEnvio = (id: string, campo: keyof PecaEnvio, valor: any) => {
    setPecasEnvio(prev => 
      prev.map(p => p.id === id ? { ...p, [campo]: valor } : p)
    );
  };
  
  // Calcular totais das peças do envio
  const calcularTotaisPecasEnvio = () => {
    const totalQtd = pecasEnvio.reduce((acc, p) => acc + p.quantidade, 0);
    const totalPeso = pecasEnvio.reduce((acc, p) => acc + (p.peso * p.quantidade), 0);
    return { totalQtd, totalPeso };
  };
  
  const totaisPecas = calcularTotaisPecasEnvio();

  const [envioFormData, setEnvioFormData] = useState({
    data_envio: new Date().toISOString().split('T')[0],
    data_retorno: null as string | null,
    status: 'pendente',
    observacoes: null as string | null,
    fornecedor: '',
    prioridade: 'normal',
    metodo_banho: '',
    numero_lote: '',
    previsao_retorno: null as string | null,
  });

  // Estado para modal de etiqueta
  const [isEtiquetaOpen, setIsEtiquetaOpen] = useState(false);
  const [selectedEnvioEtiqueta, setSelectedEnvioEtiqueta] = useState<EnvioGalvanica | null>(null);

  const handleOpenEtiqueta = (envio: EnvioGalvanica) => {
    setSelectedEnvioEtiqueta(envio);
    setIsEtiquetaOpen(true);
  };

  // Calcular totais
  const calcularTotais = (itens: EnvioItem[]) => {
    const totalPecas = itens.reduce((acc, item) => acc + (item.quantidade_pecas || 0), 0);
    const totalPesoEnviado = itens.reduce((acc, item) => acc + (item.peso_enviado || 0), 0);
    const totalPesoCobrado = itens.reduce((acc, item) => acc + (item.peso_cobrado || 0), 0);
    const valorTotal = itens.reduce((acc, item) => acc + (item.subtotal || 0), 0);
    return { totalPecas, totalPesoEnviado, totalPesoCobrado, valorTotal };
  };

  const totais = calcularTotais(envioItens);

  // Atualizar item do envio
  const atualizarItem = (id: string, campo: keyof EnvioItem, valor: any) => {
    setEnvioItens(prev => prev.map(item => {
      if (item.id !== id) return item;
      
      const updated = { ...item, [campo]: valor };
      
      // Se mudou banho_id, atualizar o preço por grama
      if (campo === 'banho_id') {
        const banho = banhos.find(b => b.id === valor);
        updated.preco_por_grama = banho?.custo_por_grama || 0;
      }
      
      // Recalcular subtotal
      updated.subtotal = (updated.peso_cobrado || 0) * (updated.preco_por_grama || 0);
      
      return updated;
    }));
  };

  // Adicionar novo item
  const adicionarItem = () => {
    setEnvioItens(prev => [...prev, emptyEnvioItem()]);
  };

  // Remover item
  const removerItem = (id: string) => {
    setEnvioItens(prev => prev.filter(item => item.id !== id));
  };

  const filteredBanhos = banhos.filter(
    (banho) => banho.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEnvios = envios.filter(
    (envio) => {
      const banhoNome = envio.banho?.nome || '';
      return banhoNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        envio.status?.toLowerCase().includes(searchTerm.toLowerCase());
    }
  );

  // Handlers para Banhos
  const handleOpenForm = (banho?: Banho) => {
    if (banho) {
      setSelectedBanho(banho);
      const tipoEncontrado = TIPOS_BANHO.find(t => t.label === banho.nome);
      setFormData({
        nome: banho.nome,
        tipo: tipoEncontrado?.value || banho.tipo || '',
        categoria: tipoEncontrado?.categoria || '',
        cor: getBanhoColor(banho),
        preco_por_grama: banho.custo_por_grama?.toString() || '',
        acabamento: '',
        qualidade: '',
        espessura_microns: '',
        durabilidade: '',
        descricao: banho.descricao || '',
        ativo: banho.ativo ?? true,
      });
    } else {
      setSelectedBanho(null);
      setFormData({
        nome: '',
        tipo: '',
        categoria: '',
        cor: '#C0C0C0',
        preco_por_grama: '',
        acabamento: '',
        qualidade: '',
        espessura_microns: '',
        durabilidade: '',
        descricao: '',
        ativo: true,
      });
    }
    setIsFormOpen(true);
  };

  const handleTipoChange = (value: string) => {
    const tipoSelecionado = TIPOS_BANHO.find(t => t.value === value);
    if (tipoSelecionado) {
      setFormData({
        ...formData,
        tipo: value,
        nome: tipoSelecionado.label,
        categoria: tipoSelecionado.categoria,
        cor: tipoSelecionado.cor.startsWith('linear') ? '#C0C0C0' : tipoSelecionado.cor,
      });
    }
  };

  const handleCategoriaChange = (value: string) => {
    setFormData({
      ...formData,
      categoria: value,
      tipo: '',
      nome: '',
    });
  };

  const filteredTiposByCategoria = formData.categoria 
    ? TIPOS_BANHO.filter(t => t.categoria === formData.categoria)
    : TIPOS_BANHO;

  const handleSubmit = async () => {
    if (!formData.tipo) {
      toast.error('Selecione um tipo de banho');
      return;
    }

    const tipoSelecionado = TIPOS_BANHO.find(t => t.value === formData.tipo);
    
    // Usar apenas campos que existem na tabela banhos
    const banhoData = {
      nome: tipoSelecionado?.label || formData.nome,
      tipo: formData.tipo,
      custo_por_grama: formData.preco_por_grama ? parseFloat(formData.preco_por_grama) : null,
      descricao: `${formData.categoria ? `Categoria: ${formData.categoria} | ` : ''}Cor: ${tipoSelecionado?.cor || '#C0C0C0'}`,
      ativo: true,
    };

    if (selectedBanho) {
      updateBanho({ id: selectedBanho.id, ...banhoData });
    } else {
      addBanho(banhoData);
    }
    setIsFormOpen(false);
  };

  const handleDelete = async () => {
    if (selectedBanho) {
      deleteBanho(selectedBanho.id);
    }
    setIsDeleteOpen(false);
    setSelectedBanho(null);
  };

  // Handlers para Envios Galvânica
  const handleOpenEnvioForm = (envio?: EnvioGalvanica) => {
    if (envio) {
      setSelectedEnvio(envio);
      setEnvioFormData({
        data_envio: envio.data_envio || new Date().toISOString().split('T')[0],
        data_retorno: envio.data_retorno || null,
        status: envio.status || 'pendente',
        observacoes: envio.observacoes || null,
        fornecedor: '',
        prioridade: 'normal',
        metodo_banho: '',
        numero_lote: '',
        previsao_retorno: null,
      });
      // Carregar item existente
      const banho = banhos.find(b => b.id === envio.banho_id);
      setEnvioItens([{
        id: crypto.randomUUID(),
        banho_id: envio.banho_id || '',
        nome_peca: '',
        tipo_pecas: '',
        quantidade_pecas: 0,
        peso_enviado: envio.peso_total || 0,
        peso_cobrado: envio.peso_total || 0,
        preco_por_grama: banho?.custo_por_grama || 0,
        subtotal: envio.valor_total || 0,
      }]);
      // Carregar peças do envio existente
      const itensDoEnvio = allEnvioItens.filter(item => item.envio_id === envio.id);
      setPecasEnvio(itensDoEnvio.map(item => ({
        id: item.id,
        nome: item.nome_peca || item.peca?.nome || 'Peça',
        tipo: '',
        quantidade: item.quantidade,
        peso: item.peso || 0,
      })));
    } else {
      setSelectedEnvio(null);
      setEnvioFormData({
        data_envio: new Date().toISOString().split('T')[0],
        data_retorno: null,
        status: 'pendente',
        observacoes: null,
        fornecedor: '',
        prioridade: 'normal',
        metodo_banho: '',
        numero_lote: '',
        previsao_retorno: null,
      });
      // Iniciar com um item vazio
      setEnvioItens([emptyEnvioItem()]);
      setPecasEnvio([]);
    }
    setIsEnvioFormOpen(true);
  };

  const handleSubmitEnvio = async () => {
    // Validar se tem banho selecionado ou peças
    const temBanho = envioItens.some(item => item.banho_id);
    const temPecas = pecasEnvio.length > 0;
    
    if (!temBanho && !temPecas) {
      toast.error('Adicione pelo menos um tipo de banho ou cadastre peças');
      return;
    }

    // Usar o primeiro banho_id para o registro principal (compatibilidade)
    const primeiroItem = envioItens.find(item => item.banho_id);
    
    // Calcular totais incluindo peças cadastradas
    const pesoTotalPecas = pecasEnvio.reduce((acc, p) => acc + (p.peso * p.quantidade), 0);
    
    const pesoFinal = totais.totalPesoCobrado + pesoTotalPecas;
    
    const envioData = {
      ...envioFormData,
      banho_id: primeiroItem?.banho_id || null,
      peso_total: pesoFinal,
      valor_total: totais.valorTotal,
    };

    try {
      if (selectedEnvio) {
        updateEnvio({ id: selectedEnvio.id, ...envioData });
        
        // Atualizar itens do envio - deletar antigos e inserir novos
        await supabase
          .from('envio_galvanica_itens')
          .delete()
          .eq('envio_id', selectedEnvio.id);
        
        // Inserir novos itens (peças cadastradas manualmente)
        if (pecasEnvio.length > 0) {
          const itensParaInserir = pecasEnvio.map(p => ({
            envio_id: selectedEnvio.id,
            peca_id: null, // Não vinculado ao estoque
            quantidade: p.quantidade,
            peso: p.peso * p.quantidade,
            banho_id: primeiroItem?.banho_id || null,
            nome_peca: p.nome, // Salvar nome da peça manual
          }));
          
          await supabase.from('envio_galvanica_itens').insert(itensParaInserir);
        }
        
        toast.success('Envio atualizado com sucesso!');
      } else {
        // Para novo envio, precisamos do ID retornado
        const { data: { user } } = await supabase.auth.getUser();
        
        const { data: novoEnvio, error } = await supabase
          .from('envios_galvanica')
          .insert({ ...envioData, user_id: user?.id })
          .select()
          .single();
        
        if (error) throw error;
        
        // Inserir itens do envio (peças cadastradas manualmente)
        if (pecasEnvio.length > 0 && novoEnvio) {
          const itensParaInserir = pecasEnvio.map(p => ({
            envio_id: novoEnvio.id,
            peca_id: null, // Não vinculado ao estoque
            quantidade: p.quantidade,
            peso: p.peso * p.quantidade,
            banho_id: primeiroItem?.banho_id || null,
            nome_peca: p.nome, // Salvar nome da peça manual
          }));
          
          await supabase.from('envio_galvanica_itens').insert(itensParaInserir);
        }
        
        toast.success('Envio cadastrado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao salvar envio:', error);
      toast.error('Erro ao salvar envio');
      return;
    }
    
    setIsEnvioFormOpen(false);
  };

  const handleDeleteEnvio = (envio: EnvioGalvanica) => {
    deleteEnvio(envio.id);
  };

  const isLoading = isLoadingBanhos || isLoadingEnvios || isLoadingItens;

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl gold-gradient flex items-center justify-center">
            <Droplets className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Banhos</h1>
            <p className="text-sm text-muted-foreground">Gerencie banhos e envios para galvânica</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={startTour}
            className="gap-2"
          >
            <HelpCircle className="w-4 h-4" />
            Tour Guiado
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2" data-tour="tabs-banhos">
          <TabsTrigger value="banhos" className="gap-2">
            <Droplets className="w-4 h-4" />
            Tipos de Banho
          </TabsTrigger>
          <TabsTrigger value="galvanica" className="gap-2" data-tour="tab-galvanica">
            <Package className="w-4 h-4" />
            Galvânica
          </TabsTrigger>
        </TabsList>

        {/* Tab Banhos */}
        <TabsContent value="banhos" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="relative overflow-hidden rounded-2xl p-4 shadow-lg bg-gradient-to-br from-violet-500 via-purple-500 to-purple-600">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/20" />
              </div>
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Droplets className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-2xl font-bold">{banhos.length}</p>
                  <p className="text-white/80 text-sm">Total</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar banho..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 input-search"
              />
            </div>
            <ReadOnlyGuard>
              <Button onClick={() => handleOpenForm()} className="btn-gold" data-tour="btn-novo-banho">
                <Plus className="w-4 h-4 mr-2" />
                Novo Banho
              </Button>
            </ReadOnlyGuard>
          </div>

          {/* Banhos Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" data-tour="lista-banhos">
            {filteredBanhos.length === 0 ? (
              <div className="col-span-full p-12 text-center glass-card rounded-xl">
                <Droplets className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum banho encontrado</p>
                <Button onClick={() => handleOpenForm()} variant="outline" className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar primeiro banho
                </Button>
              </div>
            ) : (
              filteredBanhos.map((banho) => (
                <Card key={banho.id} className="glass-card hover-lift">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {(() => {
                          const tipo = TIPOS_BANHO.find(t => t.label === banho.nome);
                          const banhoColor = getBanhoColor(banho);
                          const isGradient = tipo?.cor.startsWith('linear');
                          return (
                            <div 
                              className="w-10 h-10 rounded-full border-2"
                              style={{ 
                                background: isGradient ? tipo?.cor : banhoColor,
                                backgroundColor: !isGradient ? banhoColor : undefined,
                                borderColor: banhoColor === '#FFFFFF' ? '#e5e5e5' : (isGradient ? '#ccc' : banhoColor)
                              }}
                            />
                          );
                        })()}
                        <div>
                          <h3 className="font-semibold">{banho.nome}</h3>
                          <Badge 
                            className="text-xs mt-1"
                            style={{ 
                              backgroundColor: getBanhoColor(banho) === '#FFFFFF' ? '#f5f5f5' : (getBanhoColor(banho)) + '20',
                              color: getBanhoColor(banho) === '#FFFFFF' || getBanhoColor(banho) === '#FFFFF0' ? '#666' : getBanhoColor(banho),
                              borderColor: getBanhoColor(banho) === '#FFFFFF' ? '#e5e5e5' : getBanhoColor(banho)
                            }}
                          >
                            {banho.nome}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleOpenForm(banho)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => {
                            setSelectedBanho(banho);
                            setIsDeleteOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {banho.tipo && (
                        <p><span className="font-medium">Tipo:</span> {banho.tipo}</p>
                      )}
                      {banho.custo_por_grama !== null && banho.custo_por_grama !== undefined && (
                        <p><span className="font-medium">Preço/grama:</span> R$ {Number(banho.custo_por_grama).toFixed(2)}</p>
                      )}
                      <p>
                        <span className="font-medium">Status:</span>{' '}
                        <Badge variant={banho.ativo ? 'default' : 'secondary'}>
                          {banho.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Dica para o usuário */}
          {showDicaBanhos ? (
            <Card className="p-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
                  <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Como funciona?</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>1º Passo:</strong> Cadastre aqui os tipos de banho que você utiliza (Ouro, Prata, Ródio, etc.) com seus respectivos preços por grama.
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    <strong>2º Passo:</strong> Vá para a aba <span className="font-semibold">"Galvânica"</span> para criar envios e registrar as peças que serão enviadas para banho.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-blue-500 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/50 shrink-0"
                  onClick={toggleDicaBanhos}
                  title="Ocultar dica"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={toggleDicaBanhos}
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              Mostrar dica
            </Button>
          )}
        </TabsContent>

        {/* Tab Galvânica */}
        <TabsContent value="galvanica" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="relative overflow-hidden rounded-2xl p-4 shadow-lg bg-gradient-to-br from-violet-500 via-purple-500 to-purple-600">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/20" />
              </div>
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-2xl font-bold">{envios.length}</p>
                  <p className="text-white/80 text-sm">Total Envios</p>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-2xl p-4 shadow-lg bg-gradient-to-br from-amber-400 via-orange-500 to-orange-600">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/20" />
              </div>
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-2xl font-bold">{envios.filter(e => e.status === 'enviado').length}</p>
                  <p className="text-white/80 text-sm">Enviados</p>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-2xl p-4 shadow-lg bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/20" />
              </div>
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Send className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-2xl font-bold">{envios.filter(e => e.status === 'em_processo' || e.status === 'finalizado').length}</p>
                  <p className="text-white/80 text-sm">Em Processo</p>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-2xl p-4 shadow-lg bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/20" />
              </div>
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-2xl font-bold">{envios.filter(e => e.status === 'retornado').length}</p>
                  <p className="text-white/80 text-sm">Retornados</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar envio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 input-search"
              />
            </div>
            <Button onClick={() => handleOpenEnvioForm()} className="btn-gold">
              <Plus className="w-4 h-4 mr-2" />
              Novo Envio
            </Button>
          </div>

          {/* Envios Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEnvios.length === 0 ? (
              <div className="col-span-full p-12 text-center glass-card rounded-xl">
                <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum envio cadastrado</p>
                <Button onClick={() => handleOpenEnvioForm()} variant="outline" className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Cadastrar primeiro envio
                </Button>
              </div>
            ) : (
              filteredEnvios.map((envio) => {
                const envioItens = getEnvioItens(envio.id);
                const isExpanded = expandedEnvios.has(envio.id);
                
                return (
                  <Card key={envio.id} className="glass-card hover-lift">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{envio.banho?.nome || 'Banho não especificado'}</h3>
                          <p className="text-sm text-muted-foreground">
                            {envio.data_envio ? format(new Date(envio.data_envio), 'dd/MM/yyyy', { locale: ptBR }) : 'Data não informada'}
                          </p>
                        </div>
                        <Badge className={cn("text-xs", STATUS_ENVIO[envio.status || 'enviado']?.color || STATUS_ENVIO.enviado.color)}>
                          {STATUS_ENVIO[envio.status || 'enviado']?.label || 'Enviado'}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>Envio: {envio.data_envio ? format(new Date(envio.data_envio), 'dd/MM/yyyy', { locale: ptBR }) : '-'}</span>
                        </div>
                        {envio.data_retorno && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>Retorno: {format(new Date(envio.data_retorno), 'dd/MM/yyyy', { locale: ptBR })}</span>
                          </div>
                        )}
                        {envio.peso_total && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Scale className="w-4 h-4" />
                            <span>{envio.peso_total}g</span>
                          </div>
                        )}
                        {envio.valor_total && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="font-medium">Valor: R$ {Number(envio.valor_total).toFixed(2)}</span>
                          </div>
                        )}
                      </div>

                      {/* Seção de Peças */}
                      {envioItens.length > 0 && (
                        <Collapsible open={isExpanded} onOpenChange={() => toggleEnvioExpanded(envio.id)}>
                          <CollapsibleTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="w-full mt-3 gap-2 justify-between hover:bg-muted/50"
                            >
                              <span className="flex items-center gap-2">
                                <Package className="w-4 h-4" />
                                {envioItens.length} peça(s) • {envioItens.reduce((acc, i) => acc + i.quantidade, 0)} unidades
                              </span>
                              <ChevronDown className={cn("w-4 h-4 transition-transform", isExpanded && "rotate-180")} />
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-2">
                            <div className="space-y-2 bg-muted/30 rounded-lg p-3">
                              {envioItens.map((item, idx) => (
                                <div 
                                  key={item.id} 
                                  className={cn(
                                    "flex items-center justify-between text-sm py-2",
                                    idx < envioItens.length - 1 && "border-b border-border/50"
                                  )}
                                >
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">
                                      {item.nome_peca || item.peca?.nome || 'Peça sem nome'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {item.peca?.codigo || (item.nome_peca ? 'Manual' : '-')} • {item.banho?.nome || envio.banho?.nome || '-'}
                                    </p>
                                  </div>
                                  <div className="text-right shrink-0 ml-2">
                                    <p className="font-medium">{item.quantidade} un</p>
                                    <p className="text-xs text-muted-foreground">
                                      {item.peso ? `${item.peso.toFixed(2)}g` : '-'}
                                    </p>
                                  </div>
                                </div>
                              ))}
                              <div className="pt-2 border-t border-border flex justify-between text-sm font-medium">
                                <span>Total</span>
                                <span>
                                  {envioItens.reduce((acc, i) => acc + i.quantidade, 0)} un • 
                                  {envioItens.reduce((acc, i) => acc + (i.peso || 0), 0).toFixed(2)}g
                                </span>
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )}

                      {/* Indicador de peças quando há itens mas está fechado */}
                      {envioItens.length > 0 && !isExpanded && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                          <Eye className="w-3 h-3" />
                          <span>Clique para ver peças</span>
                        </div>
                      )}

                      <div className="flex gap-2 mt-4 pt-3 border-t">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleOpenEtiqueta(envio)}
                          title="Imprimir etiqueta"
                        >
                          <Printer className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleOpenEnvioForm(envio)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteEnvio(envio)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Dica para o usuário */}
          {showDicaGalvanica ? (
            <Card className="p-4 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
                  <Info className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">Dica: Como gerar um envio</h4>
                  <ol className="text-sm text-amber-700 dark:text-amber-300 space-y-1 list-decimal list-inside">
                    <li>Clique em <strong>"Novo Envio"</strong> para iniciar</li>
                    <li>Selecione o tipo de banho (cadastrado na aba anterior)</li>
                    <li>Adicione as peças com nome, quantidade e peso</li>
                    <li>Acompanhe o status: Pendente → Em Processamento → Concluído</li>
                  </ol>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 italic">
                    💡 Você pode imprimir etiquetas para identificar os envios!
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-amber-500 hover:text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/50 shrink-0"
                  onClick={toggleDicaGalvanica}
                  title="Ocultar dica"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={toggleDicaGalvanica}
            >
              <Info className="w-4 h-4 mr-2" />
              Mostrar dica
            </Button>
          )}
        </TabsContent>
      </Tabs>

      {/* Form Dialog Banho */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {selectedBanho ? 'Editar Banho' : 'Novo Banho'}
            </DialogTitle>
            <DialogDescription>
              {selectedBanho ? 'Atualize as informações do banho' : 'Cadastre um novo tipo de banho'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
            {/* Categoria e Tipo */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={formData.categoria} onValueChange={handleCategoriaChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    {CATEGORIAS_BANHO.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo de Banho *</Label>
                <Select value={formData.tipo} onValueChange={handleTipoChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent className="bg-background max-h-[300px]">
                    {filteredTiposByCategoria.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full border shrink-0"
                            style={{ 
                              background: tipo.cor.startsWith('linear') ? tipo.cor : tipo.cor,
                              borderColor: tipo.cor === '#FFFFFF' ? '#e5e5e5' : 'transparent'
                            }}
                          />
                          <span className="truncate">{tipo.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Preview do Banho Selecionado */}
            {formData.tipo && (
              <div className="p-3 rounded-lg bg-muted/50 flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-full border-2 shrink-0"
                  style={{ 
                    background: TIPOS_BANHO.find(t => t.value === formData.tipo)?.cor || formData.cor,
                    borderColor: formData.cor === '#FFFFFF' ? '#e5e5e5' : formData.cor
                  }}
                />
                <div>
                  <p className="font-semibold">{formData.nome}</p>
                  <p className="text-sm text-muted-foreground">
                    {CATEGORIAS_BANHO.find(c => c.value === formData.categoria)?.label || 'Categoria não definida'}
                  </p>
                </div>
              </div>
            )}

            {/* Acabamento e Qualidade */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Acabamento</Label>
                <Select value={formData.acabamento} onValueChange={(v) => setFormData({ ...formData, acabamento: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o acabamento" />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    {ACABAMENTOS.map((acabamento) => (
                      <SelectItem key={acabamento.value} value={acabamento.value}>
                        {acabamento.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Qualidade/Tipo</Label>
                <Select value={formData.qualidade} onValueChange={(v) => setFormData({ ...formData, qualidade: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a qualidade" />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    {QUALIDADES.map((qual) => (
                      <SelectItem key={qual.value} value={qual.value}>
                        {qual.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Espessura e Durabilidade */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Espessura (µm)</Label>
                <Select value={formData.espessura_microns} onValueChange={(v) => setFormData({ ...formData, espessura_microns: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a espessura" />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    {ESPESSURAS_MICRONS.map((esp) => (
                      <SelectItem key={esp.value} value={esp.value}>
                        {esp.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Durabilidade</Label>
                <Select value={formData.durabilidade} onValueChange={(v) => setFormData({ ...formData, durabilidade: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a durabilidade" />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    {DURABILIDADES.map((dur) => (
                      <SelectItem key={dur.value} value={dur.value}>
                        {dur.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Preço */}
            <div className="space-y-2">
              <Label htmlFor="preco_por_grama">Preço por Grama (R$)</Label>
              <Input
                id="preco_por_grama"
                type="number"
                step="0.01"
                min="0"
                value={formData.preco_por_grama}
                onChange={(e) => setFormData({ ...formData, preco_por_grama: e.target.value })}
                placeholder="Ex: 1.00"
              />
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Detalhes adicionais sobre o banho..."
                rows={2}
              />
            </div>

            {/* Status Ativo */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="ativo"
                checked={formData.ativo}
                onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="ativo">Banho Ativo</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} className="btn-gold">
              {selectedBanho ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Form Dialog Envio Galvânica */}
      <Dialog open={isEnvioFormOpen} onOpenChange={setIsEnvioFormOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[95vh]">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {selectedEnvio ? 'Editar Envio' : 'Novo Envio para Galvânica'}
            </DialogTitle>
            <DialogDescription>
              Cadastre os dados do envio para a galvanoplastia. Adicione múltiplos tipos de banho e peças.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            {/* Cabeçalho - Fornecedor e Datas */}
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Fornecedor/Galvânica</Label>
                <Select 
                  value={envioFormData.fornecedor} 
                  onValueChange={(v) => setEnvioFormData({ ...envioFormData, fornecedor: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    {FORNECEDORES_GALVANICA.map((forn) => (
                      <SelectItem key={forn.value} value={forn.value}>
                        {forn.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data de Envio *</Label>
                <Input
                  type="date"
                  value={envioFormData.data_envio}
                  onChange={(e) => setEnvioFormData({ ...envioFormData, data_envio: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Previsão Retorno</Label>
                <Input
                  type="date"
                  value={envioFormData.previsao_retorno || ''}
                  onChange={(e) => setEnvioFormData({ ...envioFormData, previsao_retorno: e.target.value || null })}
                />
              </div>
              <div className="space-y-2">
                <Label>Nº Lote</Label>
                <Input
                  value={envioFormData.numero_lote}
                  onChange={(e) => setEnvioFormData({ ...envioFormData, numero_lote: e.target.value })}
                  placeholder="Ex: L001"
                />
              </div>
            </div>

            {/* Status, Prioridade e Método */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={envioFormData.status} 
                  onValueChange={(v) => setEnvioFormData({ ...envioFormData, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    {Object.entries(STATUS_ENVIO).map(([key, val]) => (
                      <SelectItem key={key} value={key}>
                        {val.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select 
                  value={envioFormData.prioridade} 
                  onValueChange={(v) => setEnvioFormData({ ...envioFormData, prioridade: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    {PRIORIDADES.map((pri) => (
                      <SelectItem key={pri.value} value={pri.value}>
                        {pri.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Método de Banho</Label>
                <Select 
                  value={envioFormData.metodo_banho} 
                  onValueChange={(v) => setEnvioFormData({ ...envioFormData, metodo_banho: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    {METODOS_BANHO.map((met) => (
                      <SelectItem key={met.value} value={met.value}>
                        {met.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Seção de Itens */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Itens do Envio
                </Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={adicionarItem}
                  className="gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Item
                </Button>
              </div>

              {/* Lista de Itens */}
              <div className="space-y-3">
                {envioItens.map((item, index) => {
                  const banhoSelecionado = banhos.find(b => b.id === item.banho_id);
                  return (
                    <Card key={item.id} className="p-4 bg-muted/30">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">
                            Item {index + 1}
                          </span>
                          {envioItens.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={() => removerItem(item.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-6 gap-3">
                          {/* Banho */}
                          <div className="col-span-2 space-y-1">
                            <Label className="text-xs">Tipo de Banho *</Label>
                            <Select 
                              value={item.banho_id} 
                              onValueChange={(v) => atualizarItem(item.id, 'banho_id', v)}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent className="bg-background">
                                {banhos.map((banho) => (
                                  <SelectItem key={banho.id} value={banho.id}>
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="w-3 h-3 rounded-full shrink-0"
                                        style={{ backgroundColor: getBanhoColor(banho) }}
                                      />
                                      <span className="truncate">{banho.nome}</span>
                                      {banho.custo_por_grama && (
                                        <span className="text-xs text-muted-foreground">
                                          (R$ {banho.custo_por_grama}/g)
                                        </span>
                                      )}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Tipo de Peças */}
                          <div className="space-y-1">
                            <Label className="text-xs">Tipo Peças</Label>
                            <Select 
                              value={item.tipo_pecas} 
                              onValueChange={(v) => atualizarItem(item.id, 'tipo_pecas', v)}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Tipo" />
                              </SelectTrigger>
                              <SelectContent className="bg-background">
                                {TIPOS_PECAS.map((tipo) => (
                                  <SelectItem key={tipo.value} value={tipo.value}>
                                    {tipo.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Quantidade */}
                          <div className="space-y-1">
                            <Label className="text-xs flex items-center gap-1">
                              <Hash className="w-3 h-3" />
                              Qtd
                            </Label>
                            <Input
                              type="number"
                              min="0"
                              className="h-9"
                              value={item.quantidade_pecas || ''}
                              onChange={(e) => atualizarItem(item.id, 'quantidade_pecas', parseInt(e.target.value) || 0)}
                              placeholder="0"
                            />
                          </div>

                          {/* Peso Enviado */}
                          <div className="space-y-1">
                            <Label className="text-xs flex items-center gap-1">
                              <Scale className="w-3 h-3" />
                              Peso Env. (g)
                            </Label>
                            <Input
                              type="number"
                              step="0.001"
                              min="0"
                              className="h-9"
                              value={item.peso_enviado || ''}
                              onChange={(e) => atualizarItem(item.id, 'peso_enviado', parseFloat(e.target.value) || 0)}
                              placeholder="0.000"
                            />
                          </div>

                          {/* Peso Cobrado */}
                          <div className="space-y-1">
                            <Label className="text-xs flex items-center gap-1">
                              <Calculator className="w-3 h-3" />
                              Peso Cob. (g)
                            </Label>
                            <Input
                              type="number"
                              step="0.001"
                              min="0"
                              className="h-9"
                              value={item.peso_cobrado || ''}
                              onChange={(e) => atualizarItem(item.id, 'peso_cobrado', parseFloat(e.target.value) || 0)}
                              placeholder="0.000"
                            />
                          </div>
                        </div>

                        {/* Resumo do item */}
                        {banhoSelecionado && item.peso_cobrado > 0 && (
                          <div className="flex items-center justify-between pt-2 border-t text-sm">
                            <div className="flex items-center gap-4 text-muted-foreground">
                              <span>Preço: R$ {item.preco_por_grama.toFixed(2)}/g</span>
                              <span>×</span>
                              <span>{item.peso_cobrado.toFixed(3)}g</span>
                            </div>
                            <div className="font-semibold text-primary">
                              Subtotal: R$ {item.subtotal.toFixed(2)}
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Seção de Peças do Envio (cadastro manual) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Peças do Envio
                  {pecasEnvio.length > 0 && (
                    <Badge variant="secondary">{pecasEnvio.length} peça(s)</Badge>
                  )}
                </Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={adicionarPecaEnvio}
                  className="gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Peça
                </Button>
              </div>
              
              {/* Lista de peças cadastradas */}
              {pecasEnvio.length === 0 ? (
                <Card className="p-6 text-center bg-muted/30">
                  <Package className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nenhuma peça adicionada. Clique em "Adicionar Peça" para cadastrar.
                  </p>
                </Card>
              ) : (
                <div className="space-y-2">
                  {pecasEnvio.map((peca, index) => (
                    <Card key={peca.id} className="p-3 bg-muted/30">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground font-medium w-6">{index + 1}.</span>
                        
                        {/* Nome da peça */}
                        <div className="flex-1 min-w-0">
                          <Input
                            placeholder="Nome/descrição da peça"
                            value={peca.nome}
                            onChange={(e) => atualizarPecaEnvio(peca.id, 'nome', e.target.value)}
                            className="h-8"
                          />
                        </div>
                        
                        {/* Tipo de peça */}
                        <div className="w-32">
                          <Select 
                            value={peca.tipo} 
                            onValueChange={(v) => atualizarPecaEnvio(peca.id, 'tipo', v)}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                            <SelectContent className="bg-background">
                              {TIPOS_PECAS.map((tipo) => (
                                <SelectItem key={tipo.value} value={tipo.value}>
                                  {tipo.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Quantidade */}
                        <div className="w-20">
                          <Input
                            type="number"
                            min="1"
                            placeholder="Qtd"
                            value={peca.quantidade || ''}
                            onChange={(e) => atualizarPecaEnvio(peca.id, 'quantidade', parseInt(e.target.value) || 1)}
                            className="h-8 text-center"
                          />
                        </div>
                        
                        {/* Peso unitário */}
                        <div className="w-24">
                          <Input
                            type="number"
                            step="0.001"
                            min="0"
                            placeholder="Peso (g)"
                            value={peca.peso || ''}
                            onChange={(e) => atualizarPecaEnvio(peca.id, 'peso', parseFloat(e.target.value) || 0)}
                            className="h-8 text-center"
                          />
                        </div>
                        
                        {/* Remover */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                          onClick={() => removerPecaEnvio(peca.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
              
              {/* Resumo das peças */}
              {pecasEnvio.length > 0 && (
                <div className="flex items-center justify-between text-sm bg-muted/50 rounded-lg p-3">
                  <span className="text-muted-foreground">
                    {pecasEnvio.length} peça(s) • {totaisPecas.totalQtd} unidades
                  </span>
                  <span className="font-medium">
                    Peso total: {totaisPecas.totalPeso.toFixed(3)}g
                  </span>
                </div>
              )}
            </div>

            {/* Resumo Total */}
            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="w-5 h-5 text-primary" />
                <span className="font-semibold">Resumo do Envio</span>
              </div>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground">Peças Selecionadas</p>
                  <p className="text-xl font-bold">{totaisPecas.totalQtd + totais.totalPecas}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Peso Enviado</p>
                  <p className="text-xl font-bold">{(totais.totalPesoEnviado + totaisPecas.totalPeso).toFixed(3)}g</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Peso Cobrado</p>
                  <p className="text-xl font-bold">{(totais.totalPesoCobrado + totaisPecas.totalPeso).toFixed(3)}g</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Valor Total</p>
                  <p className="text-2xl font-bold text-primary">
                    R$ {totais.valorTotal.toFixed(2)}
                  </p>
                </div>
              </div>
            </Card>

            {/* Observações */}
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={envioFormData.observacoes || ''}
                onChange={(e) => setEnvioFormData({ ...envioFormData, observacoes: e.target.value || null })}
                placeholder="Observações adicionais, instruções especiais, detalhes sobre as peças..."
                rows={2}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsEnvioFormOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitEnvio} className="btn-gold">
              {selectedEnvio ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir banho?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O banho "{selectedBanho?.nome}" será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Etiqueta */}
      <EtiquetaGalvanicaModal
        open={isEtiquetaOpen}
        onOpenChange={setIsEtiquetaOpen}
        envio={selectedEnvioEtiqueta ? {
          id: selectedEnvioEtiqueta.id,
          data_envio: selectedEnvioEtiqueta.data_envio || '',
          peso_total: selectedEnvioEtiqueta.peso_total || 0,
          valor_total: selectedEnvioEtiqueta.valor_total || 0,
          status: selectedEnvioEtiqueta.status || '',
          banho_nome: selectedEnvioEtiqueta.banho?.nome,
          observacoes: selectedEnvioEtiqueta.observacoes || undefined,
        } : null}
      />

      {/* Tour Interativo */}
      {showTour && (
        <InteractiveTour
          steps={BANHOS_TOUR_STEPS}
          onComplete={endTour}
          onSkip={endTour}
          storageKey="banhos_tour_completed"
        />
      )}
    </div>
  );
}
