import { useState, useMemo, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  Tag,
  Settings,
  Printer,
  Eye,
  Copy,
  QrCode,
  Barcode,
  Square,
  RectangleHorizontal,
  Circle,
  Loader2,
  Palette,
  Type,
  Layout,
  SlidersHorizontal,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  LayoutTemplate,
  Wand2,
  Bluetooth,
  Usb,
  Cable,
  Wifi,
  Package,
  Minus,
  X,
  CheckSquare,
  SquareStack
} from 'lucide-react';
import { usePrinter } from '@/hooks/usePrinter';
import { PrinterAdvancedSettings } from '@/components/printer/PrinterAdvancedSettings';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  useModelosEtiquetas, 
  useAddModeloEtiqueta, 
  useUpdateModeloEtiqueta, 
  useDeleteModeloEtiqueta,
  usePecas,
  ModeloEtiqueta,
  Peca
} from '@/hooks/useSupabaseData';
import { ReadOnlyGuard } from '@/components/subscription/ReadOnlyGuard';
// Tipos de etiqueta
type TipoEtiqueta = 'preco' | 'codigo' | 'produto' | 'personalizada';
type FormatoEtiqueta = 'retangular' | 'quadrada' | 'circular' | 'oval';

// Tamanhos pré-definidos
const TAMANHOS_ETIQUETA = [
  { id: 'padrao', nome: 'Padrão', largura: 30, altura: 20, desc: 'Tamanho padrão 30x20mm' },
  { id: 'mini', nome: 'Mini', largura: 25, altura: 15, desc: 'Ideal para anéis' },
  { id: 'pequena', nome: 'Pequena', largura: 40, altura: 20, desc: 'Brincos e pingentes' },
  { id: 'media', nome: 'Média', largura: 50, altura: 30, desc: 'Uso geral' },
  { id: 'grande', nome: 'Grande', largura: 70, altura: 40, desc: 'Colares e pulseiras' },
  { id: 'joalheria-p', nome: 'Joalheria P', largura: 22, altura: 10, desc: 'Delicada' },
  { id: 'joalheria-m', nome: 'Joalheria M', largura: 35, altura: 15, desc: 'Elegante' },
  { id: 'joalheria-g', nome: 'Joalheria G', largura: 50, altura: 22, desc: 'Premium' },
  { id: 'argola', nome: 'Argola', largura: 12, altura: 60, desc: 'Para anéis' },
  { id: 'personalizado', nome: 'Personalizado', largura: 0, altura: 0, desc: 'Defina as medidas' },
];

// Templates rápidos (para aplicar configurações de elementos)
const TEMPLATES_RAPIDOS = [
  { 
    id: 'minimalista', 
    nome: 'Minimalista', 
    desc: 'Apenas nome e preço',
    config: { mostrar_nome: true, mostrar_preco: true, mostrar_codigo: false, mostrar_qrcode: false, mostrar_codigo_barras: false }
  },
  { 
    id: 'completo', 
    nome: 'Completo', 
    desc: 'Todas as informações',
    config: { mostrar_nome: true, mostrar_preco: true, mostrar_codigo: true, mostrar_qrcode: true, mostrar_banho: true, mostrar_codigo_barras: false }
  },
  { 
    id: 'codigo-barras', 
    nome: 'Código de Barras', 
    desc: 'Foco no código',
    config: { mostrar_nome: true, mostrar_preco: true, mostrar_codigo: true, mostrar_codigo_barras: true, mostrar_qrcode: false }
  },
  { 
    id: 'qrcode', 
    nome: 'QR Code', 
    desc: 'Com QR Code',
    config: { mostrar_nome: true, mostrar_preco: true, mostrar_qrcode: true, mostrar_codigo_barras: false }
  },
];

// Modelos prontos completos (pré-configurados)
const MODELOS_PRONTOS: FormData[] = [
  {
    nome: 'Joalheria Clássica',
    tipo: 'preco',
    formato: 'retangular',
    tamanho_id: 'padrao',
    largura: 30,
    altura: 20,
    cor_fundo: '#FFFFFF',
    cor_texto: '#1A1A1A',
    cor_borda: '#D4AF37',
    cor_preco: '#D4AF37',
    cor_codigo: '#666666',
    fonte: 'Georgia',
    fonte_preco: 'Georgia',
    tamanho_fonte: 8,
    tamanho_fonte_preco: 12,
    tamanho_fonte_codigo: 6,
    peso_fonte: 'normal',
    peso_fonte_preco: 'bold',
    alinhamento: 'center',
    estilo_borda: 'solid',
    espessura_borda: 1,
    borda_arredondada: 2,
    margem_interna: 3,
    espacamento_linhas: 1,
    espacamento_elementos: 1,
    mostrar_logo: false,
    mostrar_preco: true,
    mostrar_codigo: true,
    mostrar_nome: true,
    mostrar_qrcode: false,
    mostrar_codigo_barras: false,
    mostrar_banho: false,
    mostrar_numeracao: false,
    mostrar_categoria: false,
    mostrar_material: false,
    mostrar_peso: false,
    mostrar_fornecedor: false,
    mostrar_data: false,
    simbolo_moeda: 'R$',
    prefixo_preco: '',
    sufixo_preco: '',
    mostrar_centavos: true,
    preco_promocional: false,
    tipo_codigo_barras: 'code128',
    prefixo_codigo: '',
    posicao_logo: 'top',
    tamanho_logo: 20,
    tamanho_qrcode: 30,
    conteudo_qrcode: 'codigo',
    qrcode_custom_text: '',
    descricao: 'Etiqueta clássica para joalherias',
    texto_rodape: '',
    orientacao: 'vertical',
  },
  {
    nome: 'Moderna com Barras',
    tipo: 'preco',
    formato: 'retangular',
    tamanho_id: 'padrao',
    largura: 30,
    altura: 20,
    cor_fundo: '#1A1A2E',
    cor_texto: '#FFFFFF',
    cor_borda: '#E94560',
    cor_preco: '#E94560',
    cor_codigo: '#888888',
    fonte: 'Montserrat',
    fonte_preco: 'Montserrat',
    tamanho_fonte: 7,
    tamanho_fonte_preco: 10,
    tamanho_fonte_codigo: 5,
    peso_fonte: 'medium',
    peso_fonte_preco: 'bold',
    alinhamento: 'center',
    estilo_borda: 'solid',
    espessura_borda: 0,
    borda_arredondada: 4,
    margem_interna: 3,
    espacamento_linhas: 1,
    espacamento_elementos: 1,
    mostrar_logo: false,
    mostrar_preco: true,
    mostrar_codigo: true,
    mostrar_nome: true,
    mostrar_qrcode: false,
    mostrar_codigo_barras: true,
    mostrar_banho: false,
    mostrar_numeracao: false,
    mostrar_categoria: false,
    mostrar_material: false,
    mostrar_peso: false,
    mostrar_fornecedor: false,
    mostrar_data: false,
    simbolo_moeda: 'R$',
    prefixo_preco: '',
    sufixo_preco: '',
    mostrar_centavos: true,
    preco_promocional: false,
    tipo_codigo_barras: 'ean13',
    prefixo_codigo: '',
    posicao_logo: 'top',
    tamanho_logo: 20,
    tamanho_qrcode: 30,
    conteudo_qrcode: 'codigo',
    qrcode_custom_text: '',
    descricao: 'Etiqueta moderna com código de barras',
    texto_rodape: '',
    orientacao: 'vertical',
  },
  {
    nome: 'Rosé Elegante',
    tipo: 'preco',
    formato: 'retangular',
    tamanho_id: 'padrao',
    largura: 30,
    altura: 20,
    cor_fundo: '#FFF5F5',
    cor_texto: '#4A4A4A',
    cor_borda: '#B76E79',
    cor_preco: '#B76E79',
    cor_codigo: '#999999',
    fonte: 'Playfair Display',
    fonte_preco: 'Playfair Display',
    tamanho_fonte: 8,
    tamanho_fonte_preco: 11,
    tamanho_fonte_codigo: 6,
    peso_fonte: 'normal',
    peso_fonte_preco: 'semibold',
    alinhamento: 'center',
    estilo_borda: 'solid',
    espessura_borda: 1,
    borda_arredondada: 8,
    margem_interna: 4,
    espacamento_linhas: 1,
    espacamento_elementos: 1,
    mostrar_logo: false,
    mostrar_preco: true,
    mostrar_codigo: true,
    mostrar_nome: true,
    mostrar_qrcode: false,
    mostrar_codigo_barras: false,
    mostrar_banho: true,
    mostrar_numeracao: false,
    mostrar_categoria: false,
    mostrar_material: false,
    mostrar_peso: false,
    mostrar_fornecedor: false,
    mostrar_data: false,
    simbolo_moeda: 'R$',
    prefixo_preco: '',
    sufixo_preco: '',
    mostrar_centavos: true,
    preco_promocional: false,
    tipo_codigo_barras: 'code128',
    prefixo_codigo: '',
    posicao_logo: 'top',
    tamanho_logo: 20,
    tamanho_qrcode: 30,
    conteudo_qrcode: 'codigo',
    qrcode_custom_text: '',
    descricao: 'Etiqueta rosé para joias femininas',
    texto_rodape: '',
    orientacao: 'vertical',
  },
  {
    nome: 'QR Code Premium',
    tipo: 'preco',
    formato: 'retangular',
    tamanho_id: 'media',
    largura: 50,
    altura: 30,
    cor_fundo: '#000000',
    cor_texto: '#D4AF37',
    cor_borda: '#D4AF37',
    cor_preco: '#D4AF37',
    cor_codigo: '#888888',
    fonte: 'Georgia',
    fonte_preco: 'Georgia',
    tamanho_fonte: 10,
    tamanho_fonte_preco: 14,
    tamanho_fonte_codigo: 7,
    peso_fonte: 'normal',
    peso_fonte_preco: 'bold',
    alinhamento: 'center',
    estilo_borda: 'solid',
    espessura_borda: 2,
    borda_arredondada: 0,
    margem_interna: 4,
    espacamento_linhas: 1,
    espacamento_elementos: 2,
    mostrar_logo: false,
    mostrar_preco: true,
    mostrar_codigo: true,
    mostrar_nome: true,
    mostrar_qrcode: true,
    mostrar_codigo_barras: false,
    mostrar_banho: false,
    mostrar_numeracao: false,
    mostrar_categoria: false,
    mostrar_material: false,
    mostrar_peso: false,
    mostrar_fornecedor: false,
    mostrar_data: false,
    simbolo_moeda: 'R$',
    prefixo_preco: '',
    sufixo_preco: '',
    mostrar_centavos: true,
    preco_promocional: false,
    tipo_codigo_barras: 'code128',
    prefixo_codigo: '',
    posicao_logo: 'top',
    tamanho_logo: 20,
    tamanho_qrcode: 35,
    conteudo_qrcode: 'codigo',
    qrcode_custom_text: '',
    descricao: 'Etiqueta premium com QR Code',
    texto_rodape: '',
    orientacao: 'vertical',
  },
  {
    nome: 'Minimalista Branca',
    tipo: 'preco',
    formato: 'retangular',
    tamanho_id: 'padrao',
    largura: 30,
    altura: 20,
    cor_fundo: '#FFFFFF',
    cor_texto: '#333333',
    cor_borda: '#EEEEEE',
    cor_preco: '#000000',
    cor_codigo: '#999999',
    fonte: 'Lato',
    fonte_preco: 'Lato',
    tamanho_fonte: 8,
    tamanho_fonte_preco: 12,
    tamanho_fonte_codigo: 6,
    peso_fonte: 'normal',
    peso_fonte_preco: 'bold',
    alinhamento: 'center',
    estilo_borda: 'solid',
    espessura_borda: 1,
    borda_arredondada: 2,
    margem_interna: 3,
    espacamento_linhas: 1,
    espacamento_elementos: 1,
    mostrar_logo: false,
    mostrar_preco: true,
    mostrar_codigo: true,
    mostrar_nome: true,
    mostrar_qrcode: false,
    mostrar_codigo_barras: false,
    mostrar_banho: false,
    mostrar_numeracao: false,
    mostrar_categoria: false,
    mostrar_material: false,
    mostrar_peso: false,
    mostrar_fornecedor: false,
    mostrar_data: false,
    simbolo_moeda: 'R$',
    prefixo_preco: '',
    sufixo_preco: '',
    mostrar_centavos: true,
    preco_promocional: false,
    tipo_codigo_barras: 'code128',
    prefixo_codigo: '',
    posicao_logo: 'top',
    tamanho_logo: 20,
    tamanho_qrcode: 30,
    conteudo_qrcode: 'codigo',
    qrcode_custom_text: '',
    descricao: 'Etiqueta simples e limpa',
    texto_rodape: '',
    orientacao: 'vertical',
  },
  {
    nome: 'Promoção Destaque',
    tipo: 'preco',
    formato: 'retangular',
    tamanho_id: 'padrao',
    largura: 30,
    altura: 20,
    cor_fundo: '#DC2626',
    cor_texto: '#FFFFFF',
    cor_borda: '#FFFFFF',
    cor_preco: '#FFFF00',
    cor_codigo: '#FFCCCC',
    fonte: 'Montserrat',
    fonte_preco: 'Montserrat',
    tamanho_fonte: 7,
    tamanho_fonte_preco: 12,
    tamanho_fonte_codigo: 5,
    peso_fonte: 'medium',
    peso_fonte_preco: 'bold',
    alinhamento: 'center',
    estilo_borda: 'solid',
    espessura_borda: 2,
    borda_arredondada: 4,
    margem_interna: 3,
    espacamento_linhas: 1,
    espacamento_elementos: 1,
    mostrar_logo: false,
    mostrar_preco: true,
    mostrar_codigo: true,
    mostrar_nome: true,
    mostrar_qrcode: false,
    mostrar_codigo_barras: false,
    mostrar_banho: false,
    mostrar_numeracao: false,
    mostrar_categoria: false,
    mostrar_material: false,
    mostrar_peso: false,
    mostrar_fornecedor: false,
    mostrar_data: false,
    simbolo_moeda: 'R$',
    prefixo_preco: '',
    sufixo_preco: '',
    mostrar_centavos: true,
    preco_promocional: true,
    tipo_codigo_barras: 'code128',
    prefixo_codigo: '',
    posicao_logo: 'top',
    tamanho_logo: 20,
    tamanho_qrcode: 30,
    conteudo_qrcode: 'codigo',
    qrcode_custom_text: '',
    descricao: 'Etiqueta chamativa para promoções',
    texto_rodape: '',
    orientacao: 'vertical',
  },
  {
    nome: 'Comercial com Logo',
    tipo: 'preco',
    formato: 'retangular',
    tamanho_id: 'grande',
    largura: 70,
    altura: 40,
    cor_fundo: '#FFFFFF',
    cor_texto: '#000000',
    cor_borda: '#CCCCCC',
    cor_preco: '#0099CC',
    cor_codigo: '#000000',
    fonte: 'Arial',
    fonte_preco: 'Arial',
    tamanho_fonte: 10,
    tamanho_fonte_preco: 16,
    tamanho_fonte_codigo: 8,
    peso_fonte: 'bold',
    peso_fonte_preco: 'bold',
    alinhamento: 'center',
    estilo_borda: 'dashed',
    espessura_borda: 1,
    borda_arredondada: 4,
    margem_interna: 6,
    espacamento_linhas: 2,
    espacamento_elementos: 3,
    mostrar_logo: true,
    mostrar_preco: true,
    mostrar_codigo: true,
    mostrar_nome: true,
    mostrar_qrcode: false,
    mostrar_codigo_barras: true,
    mostrar_banho: false,
    mostrar_numeracao: false,
    mostrar_categoria: false,
    mostrar_material: false,
    mostrar_peso: false,
    mostrar_fornecedor: false,
    mostrar_data: false,
    simbolo_moeda: 'R$',
    prefixo_preco: '',
    sufixo_preco: '',
    mostrar_centavos: true,
    preco_promocional: false,
    tipo_codigo_barras: 'ean13',
    prefixo_codigo: '',
    posicao_logo: 'top',
    tamanho_logo: 30,
    tamanho_qrcode: 30,
    conteudo_qrcode: 'codigo',
    qrcode_custom_text: '',
    descricao: 'Etiqueta comercial com logo e código de barras',
    texto_rodape: '',
    orientacao: 'vertical',
  },
  {
    nome: 'Identificação Simples',
    tipo: 'codigo',
    formato: 'retangular',
    tamanho_id: 'padrao',
    largura: 40,
    altura: 25,
    cor_fundo: '#FFFFFF',
    cor_texto: '#000000',
    cor_borda: '#E0E0E0',
    cor_preco: '#000000',
    cor_codigo: '#333333',
    fonte: 'Arial',
    fonte_preco: 'Arial',
    tamanho_fonte: 9,
    tamanho_fonte_preco: 10,
    tamanho_fonte_codigo: 7,
    peso_fonte: 'bold',
    peso_fonte_preco: 'normal',
    alinhamento: 'center',
    estilo_borda: 'solid',
    espessura_borda: 1,
    borda_arredondada: 3,
    margem_interna: 4,
    espacamento_linhas: 2,
    espacamento_elementos: 3,
    mostrar_logo: false,
    mostrar_preco: false,
    mostrar_codigo: true,
    mostrar_nome: true,
    mostrar_qrcode: false,
    mostrar_codigo_barras: true,
    mostrar_banho: false,
    mostrar_numeracao: false,
    mostrar_categoria: false,
    mostrar_material: false,
    mostrar_peso: false,
    mostrar_fornecedor: false,
    mostrar_data: false,
    simbolo_moeda: 'R$',
    prefixo_preco: '',
    sufixo_preco: '',
    mostrar_centavos: true,
    preco_promocional: false,
    tipo_codigo_barras: 'code128',
    prefixo_codigo: '',
    posicao_logo: 'top',
    tamanho_logo: 20,
    tamanho_qrcode: 30,
    conteudo_qrcode: 'codigo',
    qrcode_custom_text: '',
    descricao: 'Etiqueta simples com nome, código e código de barras',
    texto_rodape: '',
    orientacao: 'vertical',
  },
];

// Temas de cores
const TEMAS_CORES = [
  { id: 'classico', nome: 'Clássico', fundo: '#FFFFFF', texto: '#000000', borda: '#D4AF37', preco: '#000000' },
  { id: 'elegante', nome: 'Elegante', fundo: '#000000', texto: '#D4AF37', borda: '#D4AF37', preco: '#D4AF37' },
  { id: 'rose', nome: 'Rosé', fundo: '#FFF5F5', texto: '#4A4A4A', borda: '#B76E79', preco: '#B76E79' },
  { id: 'prata', nome: 'Prata', fundo: '#F5F5F5', texto: '#333333', borda: '#C0C0C0', preco: '#333333' },
  { id: 'moderno', nome: 'Moderno', fundo: '#1A1A2E', texto: '#EAEAEA', borda: '#E94560', preco: '#E94560' },
  { id: 'natural', nome: 'Natural', fundo: '#F5F5DC', texto: '#4A4A4A', borda: '#8B7355', preco: '#6B4423' },
];

// Formatos de etiqueta
const FORMATOS_ETIQUETA = [
  { id: 'retangular', nome: 'Retangular', icone: RectangleHorizontal },
  { id: 'quadrada', nome: 'Quadrada', icone: Square },
  { id: 'circular', nome: 'Circular', icone: Circle },
];

// Fontes disponíveis
const FONTES_DISPONIVEIS = [
  { value: 'Arial', label: 'Arial', style: 'Simples' },
  { value: 'Georgia', label: 'Georgia', style: 'Clássica' },
  { value: 'Playfair Display', label: 'Playfair', style: 'Elegante' },
  { value: 'Montserrat', label: 'Montserrat', style: 'Moderna' },
  { value: 'Lato', label: 'Lato', style: 'Clean' },
  { value: 'Roboto', label: 'Roboto', style: 'Neutra' },
];

// Símbolos de moeda
const SIMBOLOS_MOEDA = [
  { value: 'R$', label: 'R$ (Real)' },
  { value: '$', label: '$ (Dólar)' },
  { value: '€', label: '€ (Euro)' },
  { value: 'none', label: 'Sem símbolo' },
];

// Tipos de código de barras
const TIPOS_CODIGO_BARRAS = [
  { 
    id: 'code128', 
    nome: 'Code 128', 
    desc: 'Alfanumérico - uso geral',
    pattern: [2, 1, 1, 2, 3, 2, 1, 2, 1, 3, 2, 1, 2, 1, 3, 1, 1, 2, 1, 3, 1, 2, 2, 1, 3, 1, 1, 2, 1, 2, 1, 1, 2, 3, 1, 2, 2, 3, 1, 1, 1, 2]
  },
  { 
    id: 'ean13', 
    nome: 'EAN-13', 
    desc: 'Produtos de varejo',
    pattern: [1, 1, 1, 3, 2, 1, 1, 1, 1, 2, 2, 1, 2, 2, 1, 2, 1, 1, 1, 1, 1, 1, 2, 2, 1, 2, 1, 1, 2, 1, 1, 2, 2, 2, 1, 1, 1, 3, 1, 1]
  },
  { 
    id: 'upca', 
    nome: 'UPC-A', 
    desc: 'Produtos na América do Norte',
    pattern: [1, 1, 1, 3, 2, 1, 1, 2, 2, 1, 1, 1, 2, 1, 2, 2, 1, 2, 2, 1, 1, 1, 1, 1, 2, 1, 2, 2, 1, 1, 1, 2, 1, 1, 1, 1, 1, 3, 1, 1]
  },
  { 
    id: 'code39', 
    nome: 'Code 39', 
    desc: 'Industrial/logística',
    pattern: [1, 2, 1, 1, 2, 1, 2, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 2, 2, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1]
  },
];

// Opções de conteúdo do QR Code
const CONTEUDO_QRCODE_OPTIONS = [
  { id: 'codigo', nome: 'Código da Peça', desc: 'Ex: PEC-001', icon: Barcode },
  { id: 'catalogo', nome: 'Link do Catálogo', desc: 'URL do catálogo público', icon: QrCode },
  { id: 'preco', nome: 'Preço Formatado', desc: 'Ex: R$ 150,00', icon: Tag },
  { id: 'custom', nome: 'Texto Personalizado', desc: 'Defina seu próprio texto', icon: Type },
];

// Tamanhos de QR Code
const TAMANHO_QRCODE_OPTIONS = [
  { value: 25, label: 'Pequeno', desc: '25px' },
  { value: 35, label: 'Médio', desc: '35px' },
  { value: 50, label: 'Grande', desc: '50px' },
];

interface FormData {
  nome: string;
  tipo: string;
  formato: string;
  tamanho_id: string | null;
  largura: number;
  altura: number;
  cor_fundo: string;
  cor_texto: string;
  cor_borda: string;
  cor_preco: string;
  cor_codigo: string;
  fonte: string;
  fonte_preco: string;
  tamanho_fonte: number;
  tamanho_fonte_preco: number;
  tamanho_fonte_codigo: number;
  peso_fonte: string;
  peso_fonte_preco: string;
  alinhamento: string;
  estilo_borda: string;
  espessura_borda: number;
  borda_arredondada: number;
  margem_interna: number;
  espacamento_linhas: number;
  espacamento_elementos: number;
  mostrar_logo: boolean;
  mostrar_preco: boolean;
  mostrar_codigo: boolean;
  mostrar_nome: boolean;
  mostrar_qrcode: boolean;
  mostrar_codigo_barras: boolean;
  mostrar_banho: boolean;
  mostrar_numeracao: boolean;
  mostrar_categoria: boolean;
  mostrar_material: boolean;
  mostrar_peso: boolean;
  mostrar_fornecedor: boolean;
  mostrar_data: boolean;
  simbolo_moeda: string;
  prefixo_preco: string;
  sufixo_preco: string;
  mostrar_centavos: boolean;
  preco_promocional: boolean;
  tipo_codigo_barras: string;
  prefixo_codigo: string;
  posicao_logo: string;
  tamanho_logo: number;
  tamanho_qrcode: number;
  conteudo_qrcode: string;
  qrcode_custom_text: string;
  descricao: string;
  texto_rodape: string;
  orientacao: string;
}

const modeloVazio: FormData = {
  nome: '',
  tipo: 'preco',
  formato: 'retangular',
  tamanho_id: 'padrao',
  largura: 30,
  altura: 20,
  cor_fundo: '#FFFFFF',
  cor_texto: '#000000',
  cor_borda: '#D4AF37',
  cor_preco: '#000000',
  cor_codigo: '#666666',
  fonte: 'Arial',
  fonte_preco: 'Arial',
  tamanho_fonte: 10,
  tamanho_fonte_preco: 14,
  tamanho_fonte_codigo: 8,
  peso_fonte: 'normal',
  peso_fonte_preco: 'bold',
  alinhamento: 'center',
  estilo_borda: 'solid',
  espessura_borda: 1,
  borda_arredondada: 4,
  margem_interna: 4,
  espacamento_linhas: 1,
  espacamento_elementos: 2,
  mostrar_logo: false,
  mostrar_preco: true,
  mostrar_codigo: true,
  mostrar_nome: true,
  mostrar_qrcode: false,
  mostrar_codigo_barras: false,
  mostrar_banho: false,
  mostrar_numeracao: false,
  mostrar_categoria: false,
  mostrar_material: false,
  mostrar_peso: false,
  mostrar_fornecedor: false,
  mostrar_data: false,
  simbolo_moeda: 'R$',
  prefixo_preco: '',
  sufixo_preco: '',
  mostrar_centavos: true,
  preco_promocional: false,
  tipo_codigo_barras: 'code128',
  prefixo_codigo: '',
  posicao_logo: 'top',
  tamanho_logo: 20,
  tamanho_qrcode: 30,
  conteudo_qrcode: 'codigo',
  qrcode_custom_text: '',
  descricao: '',
  texto_rodape: '',
  orientacao: 'vertical',
};

// Interface para seleção de peças no lote
interface PecaLote {
  peca: Peca;
  quantidade: number;
}

export default function EtiquetasPage() {
  const { data: modelos = [], isLoading } = useModelosEtiquetas();
  const { data: pecas = [], isLoading: loadingPecas } = usePecas();
  const { mutate: addModelo } = useAddModeloEtiqueta();
  const { mutate: updateModelo } = useUpdateModeloEtiqueta();
  const { mutate: deleteModelo } = useDeleteModeloEtiqueta();

  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedModelo, setSelectedModelo] = useState<ModeloEtiqueta | null>(null);
  const [formData, setFormData] = useState<FormData>(modeloVazio);
  const [editorStep, setEditorStep] = useState<'tamanho' | 'elementos' | 'estilo' | 'ajustes'>('tamanho');
  
  // Estado para impressão em lote
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedModeloForBatch, setSelectedModeloForBatch] = useState<ModeloEtiqueta | FormData | null>(null);
  const [batchPecas, setBatchPecas] = useState<PecaLote[]>([]);
  const [batchSearchTerm, setBatchSearchTerm] = useState('');
  const [isPrintingBatch, setIsPrintingBatch] = useState(false);
  const [previewPeca, setPreviewPeca] = useState<Peca | null>(null);

  const filteredModelos = modelos.filter(
    (modelo) => modelo.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTamanhoChange = (tamanhoId: string) => {
    const tamanho = TAMANHOS_ETIQUETA.find(t => t.id === tamanhoId);
    if (tamanho && tamanhoId !== 'personalizado') {
      setFormData({
        ...formData,
        tamanho_id: tamanhoId,
        largura: tamanho.largura,
        altura: tamanho.altura,
      });
    } else {
      setFormData({ ...formData, tamanho_id: tamanhoId });
    }
  };

  const handleTemplateRapido = (templateId: string) => {
    const template = TEMPLATES_RAPIDOS.find(t => t.id === templateId);
    if (template) {
      setFormData({ ...formData, ...template.config });
      toast.success(`Template "${template.nome}" aplicado!`);
    }
  };

  const handleTemaCores = (temaId: string) => {
    const tema = TEMAS_CORES.find(t => t.id === temaId);
    if (tema) {
      setFormData({ 
        ...formData, 
        cor_fundo: tema.fundo, 
        cor_texto: tema.texto, 
        cor_borda: tema.borda,
        cor_preco: tema.preco 
      });
      toast.success(`Tema "${tema.nome}" aplicado!`);
    }
  };

  const handleOpenForm = (modelo?: ModeloEtiqueta) => {
    if (modelo) {
      setSelectedModelo(modelo);
      setFormData({
        ...modeloVazio,
        nome: modelo.nome,
        tipo: modelo.tipo || modeloVazio.tipo,
        formato: modelo.formato || modeloVazio.formato,
        tamanho_id: modelo.tamanho_id || modeloVazio.tamanho_id,
        largura: modelo.largura,
        altura: modelo.altura,
        cor_fundo: modelo.cor_fundo || modeloVazio.cor_fundo,
        cor_texto: modelo.cor_texto || modeloVazio.cor_texto,
        cor_borda: modelo.cor_borda || modeloVazio.cor_borda,
        cor_preco: (modelo as any).cor_preco || modeloVazio.cor_preco,
        cor_codigo: (modelo as any).cor_codigo || modeloVazio.cor_codigo,
        fonte: modelo.fonte || modeloVazio.fonte,
        fonte_preco: (modelo as any).fonte_preco || modeloVazio.fonte_preco,
        tamanho_fonte: modelo.tamanho_fonte ?? modeloVazio.tamanho_fonte,
        tamanho_fonte_preco: (modelo as any).tamanho_fonte_preco ?? modeloVazio.tamanho_fonte_preco,
        tamanho_fonte_codigo: (modelo as any).tamanho_fonte_codigo ?? modeloVazio.tamanho_fonte_codigo,
        peso_fonte: (modelo as any).peso_fonte || modeloVazio.peso_fonte,
        peso_fonte_preco: (modelo as any).peso_fonte_preco || modeloVazio.peso_fonte_preco,
        alinhamento: (modelo as any).alinhamento || modeloVazio.alinhamento,
        estilo_borda: (modelo as any).estilo_borda || modeloVazio.estilo_borda,
        espessura_borda: (modelo as any).espessura_borda ?? modeloVazio.espessura_borda,
        borda_arredondada: modelo.borda_arredondada ?? modeloVazio.borda_arredondada,
        margem_interna: modelo.margem_interna ?? modeloVazio.margem_interna,
        espacamento_linhas: (modelo as any).espacamento_linhas ?? modeloVazio.espacamento_linhas,
        espacamento_elementos: (modelo as any).espacamento_elementos ?? modeloVazio.espacamento_elementos,
        mostrar_logo: modelo.mostrar_logo ?? modeloVazio.mostrar_logo,
        mostrar_preco: modelo.mostrar_preco ?? modeloVazio.mostrar_preco,
        mostrar_codigo: modelo.mostrar_codigo ?? modeloVazio.mostrar_codigo,
        mostrar_nome: modelo.mostrar_nome ?? modeloVazio.mostrar_nome,
        mostrar_qrcode: modelo.mostrar_qrcode ?? modeloVazio.mostrar_qrcode,
        mostrar_codigo_barras: modelo.mostrar_codigo_barras ?? modeloVazio.mostrar_codigo_barras,
        mostrar_banho: modelo.mostrar_banho ?? modeloVazio.mostrar_banho,
        mostrar_numeracao: modelo.mostrar_numeracao ?? modeloVazio.mostrar_numeracao,
        mostrar_categoria: (modelo as any).mostrar_categoria ?? modeloVazio.mostrar_categoria,
        mostrar_material: (modelo as any).mostrar_material ?? modeloVazio.mostrar_material,
        mostrar_peso: (modelo as any).mostrar_peso ?? modeloVazio.mostrar_peso,
        mostrar_fornecedor: (modelo as any).mostrar_fornecedor ?? modeloVazio.mostrar_fornecedor,
        mostrar_data: (modelo as any).mostrar_data ?? modeloVazio.mostrar_data,
        simbolo_moeda: (modelo as any).simbolo_moeda || modeloVazio.simbolo_moeda,
        prefixo_preco: (modelo as any).prefixo_preco || modeloVazio.prefixo_preco,
        sufixo_preco: (modelo as any).sufixo_preco || modeloVazio.sufixo_preco,
        mostrar_centavos: (modelo as any).mostrar_centavos ?? modeloVazio.mostrar_centavos,
        preco_promocional: (modelo as any).preco_promocional ?? modeloVazio.preco_promocional,
        tipo_codigo_barras: (modelo as any).tipo_codigo_barras || modeloVazio.tipo_codigo_barras,
        prefixo_codigo: (modelo as any).prefixo_codigo || modeloVazio.prefixo_codigo,
        posicao_logo: (modelo as any).posicao_logo || modeloVazio.posicao_logo,
        tamanho_logo: (modelo as any).tamanho_logo ?? modeloVazio.tamanho_logo,
        tamanho_qrcode: (modelo as any).tamanho_qrcode ?? modeloVazio.tamanho_qrcode,
        conteudo_qrcode: (modelo as any).conteudo_qrcode || modeloVazio.conteudo_qrcode,
        qrcode_custom_text: (modelo as any).qrcode_custom_text || modeloVazio.qrcode_custom_text,
        descricao: modelo.descricao || '',
        texto_rodape: (modelo as any).texto_rodape || modeloVazio.texto_rodape,
        orientacao: (modelo as any).orientacao || modeloVazio.orientacao,
      });
    } else {
      setSelectedModelo(null);
      setFormData(modeloVazio);
    }
    setEditorStep('tamanho');
    setIsFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.nome.trim()) {
      toast.error('Nome do modelo é obrigatório');
      return;
    }

    const modeloData = { ...formData, descricao: formData.descricao || null };

    if (selectedModelo) {
      updateModelo({ id: selectedModelo.id, ...modeloData });
    } else {
      addModelo(modeloData);
    }
    setIsFormOpen(false);
  };

  const handleDelete = async () => {
    if (selectedModelo) {
      deleteModelo(selectedModelo.id);
    }
    setIsDeleteOpen(false);
    setSelectedModelo(null);
  };

  const handleDuplicate = (modelo: ModeloEtiqueta) => {
    const duplicatedData = {
      ...modeloVazio,
      ...modelo,
      nome: `${modelo.nome} (cópia)`,
    };
    delete (duplicatedData as any).id;
    delete (duplicatedData as any).created_at;
    delete (duplicatedData as any).updated_at;
    delete (duplicatedData as any).user_id;
    addModelo(duplicatedData);
  };

  // Estado da impressora
  const {
    status: printerStatus,
    connectedPrinter,
    scanBluetooth,
    scanUSB,
    scanSerial,
    connect,
    disconnect,
    printLabel,
    testPrint,
    getDiagnostics,
    ESCPOSEncoder,
    isBluetoothSupported,
    isUSBSupported,
    isSerialSupported,
    isReconnecting,
    attemptReconnection,
    hasSavedPrinter,
    getSavedPrinterName,
    clearSavedPrinter,
  } = usePrinter();

  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [printingLabelId, setPrintingLabelId] = useState<string | null>(null);
  const [isTestingPrint, setIsTestingPrint] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  
  // Tenta reconectar automaticamente ao carregar a página
  useEffect(() => {
    if (hasSavedPrinter() && printerStatus === 'disconnected' && !isReconnecting) {
      attemptReconnection();
    }
  }, [hasSavedPrinter, printerStatus, isReconnecting, attemptReconnection]);

  // Função para teste de impressão com diagnóstico
  const handleTestPrint = async () => {
    if (printerStatus !== 'connected') {
      toast.error('Conecte a impressora primeiro');
      return;
    }
    
    setIsTestingPrint(true);
    try {
      const diagnostics = getDiagnostics();
      console.log('Printer diagnostics:', diagnostics);
      await testPrint();
    } catch (error: any) {
      console.error('Test print failed:', error);
      toast.error(`Falha no teste: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsTestingPrint(false);
    }
  };

  // Função para diagnóstico rápido
  const handleShowDiagnostics = () => {
    const diag = getDiagnostics();
    console.log('=== DIAGNÓSTICO DE IMPRESSORA ===');
    console.log(JSON.stringify(diag, null, 2));
    setShowDiagnostics(!showDiagnostics);
    toast.info('Diagnóstico exibido no console (F12)');
  };

  // Função para imprimir etiqueta
  const handlePrintLabel = async (modelo: ModeloEtiqueta) => {
    if (printerStatus !== 'connected') {
      setShowPrinterModal(true);
      return;
    }

    setPrintingLabelId(modelo.id);
    try {
      const labelData: {
        code: string;
        name: string;
        price?: number;
        qrcode?: string;
        qrcodeSize?: number;
      } = {
        code: 'ASO-12345',
        name: modelo.nome,
        price: 199.90,
      };

      // Adicionar QR Code se configurado
      if (modelo.mostrar_qrcode) {
        const qrcodeContent = (modelo as any).conteudo_qrcode || 'codigo';
        const qrcodeSize = (modelo as any).tamanho_qrcode || 30;
        
        switch (qrcodeContent) {
          case 'codigo':
            labelData.qrcode = 'ASO-12345';
            break;
          case 'catalogo':
            labelData.qrcode = 'https://nexsilesemijoias.lovable.app/catalogo/preview';
            break;
          case 'preco':
            labelData.qrcode = 'R$ 199,90';
            break;
          case 'custom':
            labelData.qrcode = (modelo as any).qrcode_custom_text || 'Texto personalizado';
            break;
          default:
            labelData.qrcode = 'ASO-12345';
        }
        
        // Converter tamanho de pixels para escala (1-8)
        labelData.qrcodeSize = Math.max(3, Math.min(8, Math.round(qrcodeSize / 10)));
      }

      await printLabel(labelData);
      toast.success('Etiqueta enviada para impressão!');
    } catch (error) {
      toast.error('Erro ao imprimir etiqueta');
    } finally {
      setPrintingLabelId(null);
    }
  };

  // Funções para impressão em lote
  const filteredPecasForBatch = useMemo(() => {
    if (!batchSearchTerm) return pecas;
    const search = batchSearchTerm.toLowerCase();
    return pecas.filter(p => 
      p.nome.toLowerCase().includes(search) ||
      (p.codigo && p.codigo.toLowerCase().includes(search)) ||
      (p.categoria && p.categoria.toLowerCase().includes(search))
    );
  }, [pecas, batchSearchTerm]);

  const handleOpenBatchModal = (modelo: ModeloEtiqueta | FormData) => {
    setSelectedModeloForBatch(modelo);
    setBatchPecas([]);
    setBatchSearchTerm('');
    setPreviewPeca(null);
    setShowBatchModal(true);
  };

  const handleAddPecaToBatch = (peca: Peca) => {
    const exists = batchPecas.find(bp => bp.peca.id === peca.id);
    if (exists) {
      toast.info('Peça já adicionada ao lote');
      return;
    }
    setBatchPecas([...batchPecas, { peca, quantidade: 1 }]);
    setPreviewPeca(peca); // Atualiza o preview com a última peça adicionada
  };

  const handleRemovePecaFromBatch = (pecaId: string) => {
    setBatchPecas(batchPecas.filter(bp => bp.peca.id !== pecaId));
  };

  const handleUpdateQuantity = (pecaId: string, quantidade: number) => {
    if (quantidade < 1) return;
    setBatchPecas(batchPecas.map(bp => 
      bp.peca.id === pecaId ? { ...bp, quantidade } : bp
    ));
  };

  const handleSelectAll = () => {
    const allPecas = filteredPecasForBatch.map(p => ({ peca: p, quantidade: 1 }));
    setBatchPecas(allPecas);
  };

  const handleClearSelection = () => {
    setBatchPecas([]);
  };

  const getTotalLabels = () => {
    return batchPecas.reduce((acc, bp) => acc + bp.quantidade, 0);
  };

  const handlePrintBatch = async () => {
    if (printerStatus !== 'connected') {
      setShowPrinterModal(true);
      return;
    }

    if (batchPecas.length === 0) {
      toast.error('Selecione ao menos uma peça para imprimir');
      return;
    }

    setIsPrintingBatch(true);
    let printed = 0;
    const total = getTotalLabels();

    try {
      for (const item of batchPecas) {
        for (let i = 0; i < item.quantidade; i++) {
          const labelData: {
            code: string;
            name: string;
            price?: number;
            qrcode?: string;
            qrcodeSize?: number;
          } = {
            code: item.peca.codigo || item.peca.id.slice(0, 8),
            name: item.peca.nome,
            price: item.peca.preco_venda || 0,
          };

          // Adicionar QR Code se o modelo tiver configurado
          if (selectedModeloForBatch && (selectedModeloForBatch as any).mostrar_qrcode) {
            const modelo = selectedModeloForBatch as any;
            const qrcodeContent = modelo.conteudo_qrcode || 'codigo';
            const qrcodeSize = modelo.tamanho_qrcode || 30;
            
            switch (qrcodeContent) {
              case 'codigo':
                labelData.qrcode = item.peca.codigo || item.peca.id.slice(0, 8);
                break;
              case 'catalogo':
                labelData.qrcode = `https://nexsilesemijoias.lovable.app/catalogo/${item.peca.id}`;
                break;
              case 'preco':
                labelData.qrcode = `R$ ${(item.peca.preco_venda || 0).toFixed(2).replace('.', ',')}`;
                break;
              case 'custom':
                labelData.qrcode = modelo.qrcode_custom_text || 'Texto personalizado';
                break;
              default:
                labelData.qrcode = item.peca.codigo || item.peca.id.slice(0, 8);
            }
            
            labelData.qrcodeSize = Math.max(3, Math.min(8, Math.round(qrcodeSize / 10)));
          }

          await printLabel(labelData);
          printed++;
          // Small delay between prints to avoid overwhelming the printer
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      toast.success(`${printed} etiqueta(s) enviada(s) para impressão!`);
      setShowBatchModal(false);
    } catch (error) {
      toast.error(`Erro na impressão. ${printed} de ${total} etiquetas impressas.`);
    } finally {
      setIsPrintingBatch(false);
    }
  };

  // Obter padrão do código de barras baseado no tipo selecionado
  const getBarcodePattern = (tipo: string) => {
    const barcodeType = TIPOS_CODIGO_BARRAS.find(t => t.id === tipo);
    return barcodeType?.pattern || TIPOS_CODIGO_BARRAS[0].pattern;
  };

  // Obter código de exemplo baseado no tipo
  const getExampleCode = (tipo: string) => {
    switch (tipo) {
      case 'ean13': return '7891234567890';
      case 'upca': return '012345678905';
      case 'code39': return 'ABC-12345';
      default: return 'ASO12345';
    }
  };

  // Gerar valor do QR Code baseado nas configurações
  const getQRCodeValue = (modelo: FormData, pecaReal?: Peca | null): string => {
    const peca = pecaReal;
    
    switch (modelo.conteudo_qrcode) {
      case 'codigo':
        return peca?.codigo || peca?.id?.slice(0, 8) || 'PEC-001';
      case 'catalogo':
        // URL do catálogo público
        return `https://nexsilesemijoias.lovable.app/catalogo/${peca?.id || 'preview'}`;
      case 'preco':
        const preco = peca?.preco_venda || 199.90;
        return `R$ ${preco.toFixed(2).replace('.', ',')}`;
      case 'custom':
        return modelo.qrcode_custom_text || 'Texto personalizado';
      default:
        return peca?.codigo || 'PEC-001';
    }
  };

  // Preview da etiqueta - Visual melhorado com atualização em tempo real
  // Agora aceita dados reais de peça para preview
  interface EtiquetaPreviewProps {
    modelo: FormData;
    scale?: number;
    pecaReal?: Peca | null;
  }

  const EtiquetaPreview = ({ modelo, scale = 1, pecaReal }: EtiquetaPreviewProps) => {
    const getBorderRadius = () => {
      if (modelo.formato === 'circular') return '50%';
      if (modelo.formato === 'oval') return '50%';
      return `${modelo.borda_arredondada * scale}px`;
    };

    const getBorderStyle = () => {
      if (modelo.estilo_borda === 'none') return 'none';
      return `${modelo.espessura_borda}px ${modelo.estilo_borda} ${modelo.cor_borda}`;
    };

    const getFontWeight = (peso: string) => {
      const pesos: Record<string, string> = {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      };
      return pesos[peso] || '400';
    };

    // Usar dados reais da peça ou exemplo
    const nomeExibir = pecaReal?.nome || 'Anel Solitário';
    const codigoExibir = pecaReal?.codigo || 'ASO-12345';
    const precoExibir = pecaReal?.preco_venda || 199.90;
    const precoPromoExibir = precoExibir * 0.75;
    const banhoExibir = pecaReal?.material || 'Ouro 18k';

    // Renderizar código de barras realista baseado no tipo
    const renderBarcode = () => {
      const barcodeHeight = Math.max(12, 18 * scale);
      const barWidth = Math.max(0.8, 1 * scale);
      const pattern = getBarcodePattern(modelo.tipo_codigo_barras);
      const exampleCode = getExampleCode(modelo.tipo_codigo_barras);
      
      // Calcular largura total do código de barras
      const totalWidth = pattern.reduce((a, b) => a + b, 0) * 1.2;
      
      return (
        <div className="flex flex-col items-center gap-0.5 bg-white px-1.5 py-1 rounded shadow-sm">
          <svg 
            width={Math.min(totalWidth * barWidth, modelo.largura * scale * 2)}
            height={barcodeHeight}
            viewBox={`0 0 ${totalWidth} ${barcodeHeight / scale}`}
            preserveAspectRatio="xMidYMid meet"
          >
            {pattern.map((width, i) => {
              const x = pattern.slice(0, i).reduce((a, b) => a + b, 0) * 1.2;
              const isBar = i % 2 === 0;
              return isBar ? (
                <rect
                  key={i}
                  x={x}
                  y={0}
                  width={width * 1.2}
                  height={barcodeHeight / scale}
                  fill="black"
                />
              ) : null;
            })}
          </svg>
          <span 
            className="font-mono text-black tracking-wider"
            style={{ fontSize: `${Math.max(6, 7 * scale)}px` }}
          >
            {exampleCode}
          </span>
        </div>
      );
    };

    return (
      <div
        className="relative flex flex-col items-center justify-center"
        style={{
          width: `${modelo.largura * scale * 2.5}px`,
          height: modelo.formato === 'circular' || modelo.formato === 'quadrada' 
            ? `${modelo.largura * scale * 2.5}px` 
            : `${modelo.altura * scale * 2.5}px`,
          backgroundColor: modelo.cor_fundo,
          border: getBorderStyle(),
          borderRadius: getBorderRadius(),
          color: modelo.cor_texto,
          fontFamily: modelo.fonte,
          fontSize: `${modelo.tamanho_fonte * scale}px`,
          padding: `${modelo.margem_interna * scale * 1.5}px`,
          textAlign: modelo.alinhamento as 'left' | 'center' | 'right',
          gap: `${modelo.espacamento_elementos * scale}px`,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          transition: 'all 0.15s ease-out',
        }}
      >
        {/* Logo */}
        {modelo.mostrar_logo && (
          <div 
            className="flex items-center justify-center opacity-50 border border-dashed border-current rounded text-[8px]"
            style={{ padding: `${2 * scale}px`, transition: 'all 0.15s ease-out' }}
          >
            ✦ LOGO ✦
          </div>
        )}
        
        {/* Nome do Produto */}
        {modelo.mostrar_nome && (
          <div 
            className="truncate w-full leading-tight font-medium"
            style={{ 
              fontSize: `${modelo.tamanho_fonte * scale * 1.1}px`,
              fontWeight: getFontWeight(modelo.peso_fonte),
              transition: 'all 0.15s ease-out',
            }}
          >
            {nomeExibir}
          </div>
        )}
        
        {/* Código */}
        {modelo.mostrar_codigo && (
          <div 
            className="opacity-60 font-mono"
            style={{ 
              fontSize: `${modelo.tamanho_fonte_codigo * scale}px`,
              color: modelo.cor_codigo,
              transition: 'all 0.15s ease-out',
            }}
          >
            {modelo.prefixo_codigo}{codigoExibir}
          </div>
        )}
        
        {/* Categoria */}
        {modelo.mostrar_categoria && (
          <div 
            className="opacity-50 uppercase tracking-wider"
            style={{ fontSize: `${Math.max(7, 8 * scale)}px`, transition: 'all 0.15s ease-out' }}
          >
            {pecaReal?.categoria || 'Anéis'}
          </div>
        )}
        
        {/* Material/Banho */}
        {modelo.mostrar_banho && (
          <div 
            className="opacity-70 flex items-center justify-center gap-1"
            style={{ fontSize: `${Math.max(8, 9 * scale)}px`, transition: 'all 0.15s ease-out' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
            {banhoExibir}
          </div>
        )}
        
        {/* Numeração */}
        {modelo.mostrar_numeracao && (
          <div 
            className="opacity-60"
            style={{ fontSize: `${Math.max(7, 8 * scale)}px`, transition: 'all 0.15s ease-out' }}
          >
            Tam: 18
          </div>
        )}
        
        {/* Preço */}
        {modelo.mostrar_preco && (
          <div className="flex flex-col items-center gap-0.5 mt-auto" style={{ transition: 'all 0.15s ease-out' }}>
            {modelo.preco_promocional && (
              <div 
                className="line-through opacity-40"
                style={{ fontSize: `${modelo.tamanho_fonte_preco * scale * 0.6}px` }}
              >
                {modelo.simbolo_moeda !== 'none' ? modelo.simbolo_moeda : ''} {precoExibir.toFixed(modelo.mostrar_centavos ? 2 : 0)}
              </div>
            )}
            <div 
              className="font-bold"
              style={{ 
                fontSize: `${modelo.tamanho_fonte_preco * scale}px`,
                fontFamily: modelo.fonte_preco,
                fontWeight: getFontWeight(modelo.peso_fonte_preco),
                color: modelo.preco_promocional ? '#dc2626' : modelo.cor_preco,
                transition: 'all 0.15s ease-out',
              }}
            >
              {modelo.prefixo_preco}
              {modelo.simbolo_moeda !== 'none' ? modelo.simbolo_moeda : ''} 
              {(modelo.preco_promocional ? precoPromoExibir : precoExibir).toFixed(modelo.mostrar_centavos ? 2 : 0)}
              {modelo.sufixo_preco}
            </div>
          </div>
        )}
        
        {/* Peso */}
        {modelo.mostrar_peso && (
          <div
            className="opacity-50"
            style={{ fontSize: `${Math.max(7, 8 * scale)}px`, transition: 'all 0.15s ease-out' }}
          >
            2.5g
          </div>
        )}
        
        {/* QR Code */}
        {modelo.mostrar_qrcode && (
          <div 
            className="rounded p-0.5 flex items-center justify-center bg-white mt-auto"
            style={{ 
              width: `${modelo.tamanho_qrcode * scale * 0.6}px`, 
              height: `${modelo.tamanho_qrcode * scale * 0.6}px`,
              transition: 'all 0.15s ease-out',
            }}
          >
            <QRCodeSVG 
              value={getQRCodeValue(modelo, pecaReal)}
              size={Math.max(16, modelo.tamanho_qrcode * scale * 0.55)}
              level="M"
              bgColor="white"
              fgColor="black"
            />
          </div>
        )}
        
        {/* Código de Barras Realista */}
        {modelo.mostrar_codigo_barras && (
          <div className="mt-auto" style={{ transition: 'all 0.15s ease-out' }}>
            {renderBarcode()}
          </div>
        )}
        
        {/* Texto Rodapé */}
        {modelo.texto_rodape && (
          <div 
            className="opacity-40 mt-auto"
            style={{ fontSize: `${Math.max(6, 7 * scale)}px`, transition: 'all 0.15s ease-out' }}
          >
            {modelo.texto_rodape}
          </div>
        )}
      </div>
    );
  };

  // Steps do editor
  const EDITOR_STEPS = [
    { id: 'tamanho', label: 'Tamanho', icon: Layout, desc: 'Dimensões da etiqueta' },
    { id: 'elementos', label: 'Elementos', icon: LayoutTemplate, desc: 'O que exibir' },
    { id: 'estilo', label: 'Estilo', icon: Palette, desc: 'Cores e fontes' },
    { id: 'ajustes', label: 'Ajustes', icon: SlidersHorizontal, desc: 'Refinamentos' },
  ];

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
            <Tag className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Etiquetas</h1>
            <p className="text-sm text-muted-foreground">Crie e personalize modelos de etiquetas para suas peças</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Tag className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{modelos.length}</p>
              <p className="text-xs text-muted-foreground">Total de modelos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              printerStatus === 'connected' ? "bg-green-500/10" : "bg-muted"
            )}>
              <Printer className={cn(
                "w-5 h-5",
                printerStatus === 'connected' ? "text-green-500" : "text-muted-foreground"
              )} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">
                {printerStatus === 'connected' ? 'Conectada' : 'Desconectada'}
              </p>
              <p className="text-xs text-muted-foreground truncate max-w-[100px]">
                {connectedPrinter?.name || 'Impressora'}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowPrinterModal(true)}
              className="h-8"
            >
              {printerStatus === 'connected' ? 'Ver' : 'Conectar'}
            </Button>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-2">Ação rápida</p>
            <ReadOnlyGuard>
              <Button onClick={() => handleOpenForm()} className="w-full btn-gold">
                <Wand2 className="w-4 h-4 mr-2" />
                Criar Nova Etiqueta
              </Button>
            </ReadOnlyGuard>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-2">Impressão em lote</p>
            <Button 
              onClick={() => {
                if (modelos.length > 0) {
                  handleOpenBatchModal(modelos[0]);
                } else if (MODELOS_PRONTOS.length > 0) {
                  handleOpenBatchModal(MODELOS_PRONTOS[0]);
                }
              }} 
              variant="outline"
              className="w-full"
            >
              <SquareStack className="w-4 h-4 mr-2" />
              Imprimir Várias
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Modelos Prontos */}
      <Card className="glass-card mb-8">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Modelos Prontos
              </CardTitle>
              <CardDescription>
                Selecione um modelo pré-configurado ou crie personalizado
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {MODELOS_PRONTOS.map((modeloPronto, idx) => (
              <div
                key={idx}
                className="group p-3 rounded-xl border border-border hover:border-primary/50 bg-gradient-to-br from-background to-muted/30 transition-all hover:shadow-lg"
              >
                <button
                  onClick={() => {
                    setFormData({ ...modeloPronto });
                    setEditorStep('tamanho');
                    setIsFormOpen(true);
                  }}
                  className="w-full"
                >
                  <div className="flex justify-center py-4 mb-2">
                    <EtiquetaPreview modelo={modeloPronto} scale={1.5} />
                  </div>
                  <p className="text-xs font-medium text-center truncate">{modeloPronto.nome}</p>
                  <p className="text-[10px] text-muted-foreground text-center truncate">{modeloPronto.largura}x{modeloPronto.altura}mm</p>
                </button>
                <div className="flex justify-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenBatchModal(modeloPronto);
                    }}
                  >
                    <SquareStack className="w-3 h-3 mr-1" />
                    Lote
                  </Button>
                </div>
              </div>
            ))}
            
            {/* Botão Personalizar */}
            <button
              onClick={() => handleOpenForm()}
              className="group p-3 rounded-xl border-2 border-dashed border-primary/30 hover:border-primary/60 bg-primary/5 transition-all hover:bg-primary/10 flex flex-col items-center justify-center min-h-[140px]"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-all">
                <Plus className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xs font-medium text-primary">Personalizar</p>
              <p className="text-[10px] text-muted-foreground">Do zero</p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Search & Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar modelo salvo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <ReadOnlyGuard>
          <Button onClick={() => handleOpenForm()} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Novo Modelo
          </Button>
        </ReadOnlyGuard>
      </div>

      {/* Meus Modelos Salvos */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Tag className="w-5 h-5" />
          Meus Modelos Salvos
          <Badge variant="secondary" className="ml-2">{modelos.length}</Badge>
        </h2>
      </div>

      {/* Modelos Grid */}
      {filteredModelos.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Tag className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-medium mb-2">Nenhum modelo encontrado</h3>
            <p className="text-muted-foreground mb-6">Crie seu primeiro modelo de etiqueta para começar</p>
            <ReadOnlyGuard>
              <Button onClick={() => handleOpenForm()} className="btn-gold">
                <Plus className="w-4 h-4 mr-2" />
                Criar Modelo
              </Button>
            </ReadOnlyGuard>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredModelos.map((modelo) => (
            <Card key={modelo.id} className="glass-card hover-lift group overflow-hidden">
              <CardContent className="p-4">
                {/* Preview */}
                <div className="flex justify-center py-6 bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg mb-4 min-h-[120px] items-center">
                  <EtiquetaPreview modelo={{
                    ...modeloVazio,
                    ...modelo,
                    descricao: modelo.descricao || '',
                    tamanho_id: modelo.tamanho_id || 'media',
                  }} scale={1.8} />
                </div>

                {/* Info */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold truncate flex-1">{modelo.nome}</h3>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">
                      {modelo.largura}x{modelo.altura}mm
                    </Badge>
                    <Badge variant="secondary" className="text-xs capitalize">
                      {modelo.formato || 'retangular'}
                    </Badge>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1 mt-4 pt-4 border-t border-border/50">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex-1 h-8 text-xs"
                    onClick={() => handleOpenForm(modelo)}
                  >
                    <Pencil className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2"
                    onClick={() => handleOpenBatchModal(modelo)}
                    title="Impressão em lote"
                  >
                    <SquareStack className="w-3 h-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2"
                    onClick={() => handlePrintLabel(modelo)}
                    disabled={printingLabelId === modelo.id}
                    title="Imprimir teste"
                  >
                    {printingLabelId === modelo.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Printer className="w-3 h-3" />
                    )}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2"
                    onClick={() => handleDuplicate(modelo)}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2 text-destructive hover:text-destructive"
                    onClick={() => {
                      setSelectedModelo(modelo);
                      setIsDeleteOpen(true);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Editor Dialog - Redesigned */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden">
          <div className="flex h-[85vh]">
            {/* Left Side - Live Preview */}
            <div className="w-[45%] bg-gradient-to-br from-muted/50 to-muted/20 p-6 flex flex-col border-r">
              <div className="mb-4">
                <h3 className="font-semibold text-lg">Preview em Tempo Real</h3>
                <p className="text-sm text-muted-foreground">As alterações aparecem instantaneamente</p>
              </div>
              
              {/* Preview Container */}
              <div className="flex-1 flex items-center justify-center bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.02)_10px,rgba(0,0,0,0.02)_20px)] rounded-xl p-8">
                <EtiquetaPreview modelo={formData} scale={3} />
              </div>

              {/* Quick Info */}
              <div className="mt-4 p-3 bg-background/80 rounded-lg">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Largura</p>
                    <p className="font-medium">{formData.largura}mm</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Altura</p>
                    <p className="font-medium">{formData.altura}mm</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Formato</p>
                    <p className="font-medium capitalize">{formData.formato}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Editor */}
            <div className="flex-1 flex flex-col">
              {/* Header */}
              <div className="p-4 border-b">
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome do modelo (ex: Etiqueta Padrão)"
                  className="text-lg font-medium border-0 shadow-none focus-visible:ring-0 px-0 h-auto"
                />
              </div>

              {/* Step Tabs */}
              <div className="px-4 pt-4">
                <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
                  {EDITOR_STEPS.map((step, idx) => (
                    <button
                      key={step.id}
                      onClick={() => setEditorStep(step.id as any)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all",
                        editorStep === step.id 
                          ? "bg-background shadow-sm text-foreground" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <step.icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{step.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step Content */}
              <ScrollArea className="flex-1 p-4">
                {/* Step 1: Tamanho */}
                {editorStep === 'tamanho' && (
                  <div className="space-y-6">
                    {/* Tamanhos Pré-definidos */}
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Tamanho da Etiqueta</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {TAMANHOS_ETIQUETA.map((tam) => (
                          <button
                            key={tam.id}
                            onClick={() => handleTamanhoChange(tam.id)}
                            className={cn(
                              "p-3 rounded-lg border text-left transition-all",
                              formData.tamanho_id === tam.id 
                                ? "border-primary bg-primary/5 ring-1 ring-primary" 
                                : "border-border hover:border-primary/50"
                            )}
                          >
                            <p className="font-medium text-sm">{tam.nome}</p>
                            <p className="text-xs text-muted-foreground">
                              {tam.id === 'personalizado' ? tam.desc : `${tam.largura}x${tam.altura}mm`}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Dimensões Personalizadas */}
                    {formData.tamanho_id === 'personalizado' && (
                      <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                        <div className="space-y-2">
                          <Label>Largura (mm)</Label>
                          <Input
                            type="number"
                            value={formData.largura}
                            onChange={(e) => setFormData({ ...formData, largura: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Altura (mm)</Label>
                          <Input
                            type="number"
                            value={formData.altura}
                            onChange={(e) => setFormData({ ...formData, altura: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                      </div>
                    )}

                    {/* Formato */}
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Formato</Label>
                      <div className="flex gap-2">
                        {FORMATOS_ETIQUETA.map((formato) => (
                          <button
                            key={formato.id}
                            onClick={() => setFormData({ ...formData, formato: formato.id })}
                            className={cn(
                              "flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition-all",
                              formData.formato === formato.id 
                                ? "border-primary bg-primary/5 ring-1 ring-primary" 
                                : "border-border hover:border-primary/50"
                            )}
                          >
                            <formato.icone className="w-5 h-5" />
                            <span className="font-medium text-sm">{formato.nome}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Elementos */}
                {editorStep === 'elementos' && (
                  <div className="space-y-6">
                    {/* Templates Rápidos */}
                    <div>
                      <Label className="text-sm font-medium mb-3 block flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        Templates Rápidos
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        {TEMPLATES_RAPIDOS.map((template) => (
                          <button
                            key={template.id}
                            onClick={() => handleTemplateRapido(template.id)}
                            className="p-3 rounded-lg border border-border hover:border-primary/50 text-left transition-all hover:bg-muted/30"
                          >
                            <p className="font-medium text-sm">{template.nome}</p>
                            <p className="text-xs text-muted-foreground">{template.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Elementos Toggle */}
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Elementos a Exibir</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { key: 'mostrar_nome', label: 'Nome do Produto', icon: Type },
                          { key: 'mostrar_preco', label: 'Preço', icon: Tag },
                          { key: 'mostrar_codigo', label: 'Código', icon: Barcode },
                          { key: 'mostrar_qrcode', label: 'QR Code', icon: QrCode },
                          { key: 'mostrar_codigo_barras', label: 'Código de Barras', icon: Barcode },
                          { key: 'mostrar_banho', label: 'Tipo de Banho', icon: Circle },
                          { key: 'mostrar_numeracao', label: 'Numeração', icon: Tag },
                          { key: 'mostrar_categoria', label: 'Categoria', icon: Tag },
                          { key: 'mostrar_peso', label: 'Peso', icon: Tag },
                          { key: 'mostrar_logo', label: 'Logo', icon: Square },
                        ].map((elem) => (
                          <div 
                            key={elem.key}
                            className={cn(
                              "flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer",
                              (formData as any)[elem.key] 
                                ? "border-primary/50 bg-primary/5" 
                                : "border-border"
                            )}
                            onClick={() => setFormData({ ...formData, [elem.key]: !(formData as any)[elem.key] })}
                          >
                            <div className="flex items-center gap-2">
                              <elem.icon className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">{elem.label}</span>
                            </div>
                            <Switch
                              checked={(formData as any)[elem.key]}
                              onCheckedChange={(v) => setFormData({ ...formData, [elem.key]: v })}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Configurações de Preço */}
                    {formData.mostrar_preco && (
                      <div className="p-4 bg-muted/30 rounded-lg space-y-4">
                        <Label className="text-sm font-medium">Configurações de Preço</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-xs">Moeda</Label>
                            <Select 
                              value={formData.simbolo_moeda} 
                              onValueChange={(v) => setFormData({ ...formData, simbolo_moeda: v })}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-background">
                                {SIMBOLOS_MOEDA.map((s) => (
                                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-end gap-4">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={formData.mostrar_centavos}
                                onCheckedChange={(v) => setFormData({ ...formData, mostrar_centavos: v })}
                              />
                              <Label className="text-xs">Centavos</Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={formData.preco_promocional}
                                onCheckedChange={(v) => setFormData({ ...formData, preco_promocional: v })}
                              />
                              <Label className="text-xs">Promocional</Label>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Configurações de Código de Barras */}
                    {formData.mostrar_codigo_barras && (
                      <div className="p-4 bg-muted/30 rounded-lg space-y-4">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Barcode className="w-4 h-4 text-primary" />
                          Tipo de Código de Barras
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                          {TIPOS_CODIGO_BARRAS.map((tipo) => (
                            <button
                              key={tipo.id}
                              onClick={() => setFormData({ ...formData, tipo_codigo_barras: tipo.id })}
                              className={cn(
                                "p-3 rounded-lg border text-left transition-all",
                                formData.tipo_codigo_barras === tipo.id 
                                  ? "border-primary bg-primary/5 ring-1 ring-primary" 
                                  : "border-border hover:border-primary/50"
                              )}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-medium text-sm">{tipo.nome}</p>
                                {formData.tipo_codigo_barras === tipo.id && (
                                  <CheckCircle2 className="w-4 h-4 text-primary" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">{tipo.desc}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Configurações de QR Code */}
                    {formData.mostrar_qrcode && (
                      <div className="p-4 bg-muted/30 rounded-lg space-y-4">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <QrCode className="w-4 h-4 text-primary" />
                          Configurações do QR Code
                        </Label>
                        
                        {/* Conteúdo do QR Code */}
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Conteúdo do QR Code</Label>
                          <div className="grid grid-cols-2 gap-2">
                            {CONTEUDO_QRCODE_OPTIONS.map((opcao) => (
                              <button
                                key={opcao.id}
                                onClick={() => setFormData({ ...formData, conteudo_qrcode: opcao.id })}
                                className={cn(
                                  "p-3 rounded-lg border text-left transition-all",
                                  formData.conteudo_qrcode === opcao.id 
                                    ? "border-primary bg-primary/5 ring-1 ring-primary" 
                                    : "border-border hover:border-primary/50"
                                )}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <opcao.icon className="w-3.5 h-3.5 text-muted-foreground" />
                                    <p className="font-medium text-sm">{opcao.nome}</p>
                                  </div>
                                  {formData.conteudo_qrcode === opcao.id && (
                                    <CheckCircle2 className="w-4 h-4 text-primary" />
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">{opcao.desc}</p>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Texto personalizado */}
                        {formData.conteudo_qrcode === 'custom' && (
                          <div className="space-y-2">
                            <Label className="text-xs">Texto Personalizado</Label>
                            <Input
                              value={formData.qrcode_custom_text}
                              onChange={(e) => setFormData({ ...formData, qrcode_custom_text: e.target.value })}
                              placeholder="Digite o texto do QR Code"
                            />
                          </div>
                        )}

                        {/* Tamanho do QR Code */}
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Tamanho</Label>
                          <div className="flex gap-2">
                            {TAMANHO_QRCODE_OPTIONS.map((tamanho) => (
                              <button
                                key={tamanho.value}
                                onClick={() => setFormData({ ...formData, tamanho_qrcode: tamanho.value })}
                                className={cn(
                                  "flex-1 p-2 rounded-lg border text-center transition-all",
                                  formData.tamanho_qrcode === tamanho.value 
                                    ? "border-primary bg-primary/5 ring-1 ring-primary" 
                                    : "border-border hover:border-primary/50"
                                )}
                              >
                                <p className="font-medium text-sm">{tamanho.label}</p>
                                <p className="text-xs text-muted-foreground">{tamanho.desc}</p>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Preview do QR Code */}
                        <div className="pt-2 border-t">
                          <Label className="text-xs text-muted-foreground mb-2 block">Preview</Label>
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded border">
                              <QRCodeSVG 
                                value={getQRCodeValue(formData)}
                                size={formData.tamanho_qrcode}
                                level="M"
                              />
                            </div>
                            <div className="text-xs text-muted-foreground flex-1">
                              <p className="font-medium text-foreground mb-1">Conteúdo:</p>
                              <p className="break-all bg-muted p-2 rounded text-[10px] font-mono">
                                {getQRCodeValue(formData)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Estilo */}
                {editorStep === 'estilo' && (
                  <div className="space-y-6">
                    {/* Temas de Cores */}
                    <div>
                      <Label className="text-sm font-medium mb-3 block flex items-center gap-2">
                        <Palette className="w-4 h-4 text-primary" />
                        Temas de Cores
                      </Label>
                      <div className="grid grid-cols-3 gap-2">
                        {TEMAS_CORES.map((tema) => (
                          <button
                            key={tema.id}
                            onClick={() => handleTemaCores(tema.id)}
                            className="p-3 rounded-lg border border-border hover:border-primary/50 transition-all"
                          >
                            <div className="flex gap-1 mb-2">
                              <div className="w-5 h-5 rounded" style={{ backgroundColor: tema.fundo, border: '1px solid #ddd' }} />
                              <div className="w-5 h-5 rounded" style={{ backgroundColor: tema.texto }} />
                              <div className="w-5 h-5 rounded" style={{ backgroundColor: tema.borda }} />
                            </div>
                            <p className="text-xs font-medium">{tema.nome}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Cores Personalizadas */}
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Cores Personalizadas</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { key: 'cor_fundo', label: 'Fundo' },
                          { key: 'cor_texto', label: 'Texto' },
                          { key: 'cor_borda', label: 'Borda' },
                          { key: 'cor_preco', label: 'Preço' },
                        ].map((cor) => (
                          <div key={cor.key} className="space-y-1">
                            <Label className="text-xs">{cor.label}</Label>
                            <div className="flex gap-2">
                              <Input
                                type="color"
                                value={(formData as any)[cor.key]}
                                onChange={(e) => setFormData({ ...formData, [cor.key]: e.target.value })}
                                className="w-10 h-9 p-1 cursor-pointer"
                              />
                              <Input
                                value={(formData as any)[cor.key]}
                                onChange={(e) => setFormData({ ...formData, [cor.key]: e.target.value })}
                                className="flex-1 h-9 text-xs font-mono"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Fonte */}
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Fonte Principal</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {FONTES_DISPONIVEIS.map((fonte) => (
                          <button
                            key={fonte.value}
                            onClick={() => setFormData({ ...formData, fonte: fonte.value, fonte_preco: fonte.value })}
                            className={cn(
                              "p-3 rounded-lg border text-left transition-all",
                              formData.fonte === fonte.value 
                                ? "border-primary bg-primary/5 ring-1 ring-primary" 
                                : "border-border hover:border-primary/50"
                            )}
                          >
                            <p className="font-medium text-sm" style={{ fontFamily: fonte.value }}>{fonte.label}</p>
                            <p className="text-xs text-muted-foreground">{fonte.style}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Ajustes */}
                {editorStep === 'ajustes' && (
                  <div className="space-y-6">
                    {/* Tamanhos de Fonte */}
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Tamanhos de Fonte</Label>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Texto Principal</span>
                            <span className="text-muted-foreground">{formData.tamanho_fonte}pt</span>
                          </div>
                          <Slider
                            value={[formData.tamanho_fonte]}
                            onValueChange={([v]) => setFormData({ ...formData, tamanho_fonte: v })}
                            min={6}
                            max={20}
                            step={1}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Preço</span>
                            <span className="text-muted-foreground">{formData.tamanho_fonte_preco}pt</span>
                          </div>
                          <Slider
                            value={[formData.tamanho_fonte_preco]}
                            onValueChange={([v]) => setFormData({ ...formData, tamanho_fonte_preco: v })}
                            min={8}
                            max={28}
                            step={1}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Código</span>
                            <span className="text-muted-foreground">{formData.tamanho_fonte_codigo}pt</span>
                          </div>
                          <Slider
                            value={[formData.tamanho_fonte_codigo]}
                            onValueChange={([v]) => setFormData({ ...formData, tamanho_fonte_codigo: v })}
                            min={6}
                            max={14}
                            step={1}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Borda */}
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Borda</Label>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Espessura</span>
                            <span className="text-muted-foreground">{formData.espessura_borda}px</span>
                          </div>
                          <Slider
                            value={[formData.espessura_borda]}
                            onValueChange={([v]) => setFormData({ ...formData, espessura_borda: v })}
                            min={0}
                            max={4}
                            step={1}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Arredondamento</span>
                            <span className="text-muted-foreground">{formData.borda_arredondada}px</span>
                          </div>
                          <Slider
                            value={[formData.borda_arredondada]}
                            onValueChange={([v]) => setFormData({ ...formData, borda_arredondada: v })}
                            min={0}
                            max={16}
                            step={1}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Espaçamento */}
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Espaçamento</Label>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Margem Interna</span>
                            <span className="text-muted-foreground">{formData.margem_interna}px</span>
                          </div>
                          <Slider
                            value={[formData.margem_interna]}
                            onValueChange={([v]) => setFormData({ ...formData, margem_interna: v })}
                            min={2}
                            max={16}
                            step={1}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Entre Elementos</span>
                            <span className="text-muted-foreground">{formData.espacamento_elementos}px</span>
                          </div>
                          <Slider
                            value={[formData.espacamento_elementos]}
                            onValueChange={([v]) => setFormData({ ...formData, espacamento_elementos: v })}
                            min={0}
                            max={8}
                            step={1}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Texto Rodapé */}
                    <div className="space-y-2">
                      <Label className="text-sm">Texto de Rodapé (opcional)</Label>
                      <Input
                        value={formData.texto_rodape}
                        onChange={(e) => setFormData({ ...formData, texto_rodape: e.target.value })}
                        placeholder="Ex: www.minhaloja.com"
                      />
                    </div>

                    {/* Descrição */}
                    <div className="space-y-2">
                      <Label className="text-sm">Descrição do Modelo (opcional)</Label>
                      <Input
                        value={formData.descricao}
                        onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                        placeholder="Descrição para identificar o modelo..."
                      />
                    </div>
                  </div>
                )}
              </ScrollArea>

              {/* Footer */}
              <div className="p-4 border-t flex items-center justify-between">
                <div className="flex gap-2">
                  {editorStep !== 'tamanho' && (
                    <Button 
                      variant="ghost" 
                      onClick={() => {
                        const steps = ['tamanho', 'elementos', 'estilo', 'ajustes'];
                        const currentIdx = steps.indexOf(editorStep);
                        if (currentIdx > 0) setEditorStep(steps[currentIdx - 1] as any);
                      }}
                    >
                      Voltar
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsFormOpen(false)}>
                    Cancelar
                  </Button>
                  {editorStep !== 'ajustes' ? (
                    <Button 
                      onClick={() => {
                        const steps = ['tamanho', 'elementos', 'estilo', 'ajustes'];
                        const currentIdx = steps.indexOf(editorStep);
                        if (currentIdx < steps.length - 1) setEditorStep(steps[currentIdx + 1] as any);
                      }}
                    >
                      Próximo
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  ) : (
                    <Button onClick={handleSubmit} className="btn-gold">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {selectedModelo ? 'Atualizar Modelo' : 'Criar Modelo'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir modelo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O modelo "{selectedModelo?.nome}" será removido permanentemente.
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

      {/* Printer Connection Modal */}
      <Dialog open={showPrinterModal} onOpenChange={setShowPrinterModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="w-5 h-5" />
              Conectar Impressora
            </DialogTitle>
            <DialogDescription>
              Conecte uma impressora térmica para imprimir etiquetas
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Status atual */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  printerStatus === 'connected' ? "bg-green-500" : 
                  printerStatus === 'connecting' || isReconnecting ? "bg-yellow-500 animate-pulse" : 
                  "bg-muted-foreground"
                )} />
                <span className="text-sm font-medium">
                  {printerStatus === 'connected' 
                    ? `Conectado: ${connectedPrinter?.name}` 
                    : isReconnecting 
                    ? `Reconectando a ${getSavedPrinterName()}...`
                    : printerStatus === 'connecting' 
                    ? 'Conectando...' 
                    : hasSavedPrinter() 
                    ? `Última: ${getSavedPrinterName()}`
                    : 'Nenhuma impressora conectada'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {printerStatus === 'connected' && (
                  <Button variant="ghost" size="sm" onClick={disconnect}>
                    Desconectar
                  </Button>
                )}
                {printerStatus === 'disconnected' && hasSavedPrinter() && (
                  <>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={attemptReconnection}
                      disabled={isReconnecting}
                    >
                      {isReconnecting ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Wifi className="w-3 h-3 mr-1" />
                      )}
                      Reconectar
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={clearSavedPrinter}
                      className="text-muted-foreground"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Reconexão automática em progresso */}
            {isReconnecting && (
              <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-yellow-600 dark:text-yellow-400" />
                  <span className="text-sm text-yellow-700 dark:text-yellow-400">
                    Tentando reconectar a {getSavedPrinterName()}...
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Certifique-se de que a impressora está ligada e próxima.
                </p>
              </div>
            )}

            {/* Opções de conexão */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tipo de Conexão</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  className="flex flex-col h-auto py-4 gap-2 relative"
                  onClick={async () => {
                    const device = await scanBluetooth();
                    if (device) {
                      await connect(device);
                    }
                  }}
                  disabled={!isBluetoothSupported || printerStatus === 'connecting' || isReconnecting}
                >
                  {printerStatus === 'connecting' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Bluetooth className={cn("w-5 h-5", !isBluetoothSupported && "opacity-30")} />
                  )}
                  <span className="text-xs">
                    {printerStatus === 'connecting' ? 'Conectando...' : 'Bluetooth'}
                  </span>
                  {!isBluetoothSupported && printerStatus !== 'connecting' && (
                    <span className="text-[10px] text-muted-foreground">Indisponível</span>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="flex flex-col h-auto py-4 gap-2 relative"
                  onClick={async () => {
                    const device = await scanUSB();
                    if (device) {
                      await connect(device);
                    }
                  }}
                  disabled={!isUSBSupported || printerStatus === 'connecting' || isReconnecting}
                >
                  {printerStatus === 'connecting' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Usb className={cn("w-5 h-5", !isUSBSupported && "opacity-30")} />
                  )}
                  <span className="text-xs">
                    {printerStatus === 'connecting' ? 'Conectando...' : 'USB'}
                  </span>
                  {!isUSBSupported && printerStatus !== 'connecting' && (
                    <span className="text-[10px] text-muted-foreground">Indisponível</span>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="flex flex-col h-auto py-4 gap-2 relative"
                  onClick={async () => {
                    const device = await scanSerial();
                    if (device) {
                      await connect(device);
                    }
                  }}
                  disabled={!isSerialSupported || printerStatus === 'connecting' || isReconnecting}
                >
                  {printerStatus === 'connecting' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Cable className={cn("w-5 h-5", !isSerialSupported && "opacity-30")} />
                  )}
                  <span className="text-xs">
                    {printerStatus === 'connecting' ? 'Conectando...' : 'Serial'}
                  </span>
                  {!isSerialSupported && printerStatus !== 'connecting' && (
                    <span className="text-[10px] text-muted-foreground">Indisponível</span>
                  )}
                </Button>
              </div>
            </div>

            {/* Teste de Impressão - Aparece quando conectado */}
            {printerStatus === 'connected' && (
              <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/30 space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">
                    Impressora conectada: {connectedPrinter?.name}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Clique no botão abaixo para enviar uma página de teste e verificar se a impressora está funcionando corretamente.
                </p>
                <Button 
                  onClick={handleTestPrint}
                  disabled={isTestingPrint}
                  className="w-full"
                  variant="outline"
                >
                  {isTestingPrint ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando teste...
                    </>
                  ) : (
                    <>
                      <Printer className="w-4 h-4 mr-2" />
                      Testar Impressão
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Configurações Avançadas - Aparece quando conectado */}
            {printerStatus === 'connected' && (
              <PrinterAdvancedSettings />
            )}

            {/* Dica */}
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Dica:</strong> {hasSavedPrinter() 
                  ? 'Sua impressora será reconectada automaticamente ao abrir esta página.' 
                  : 'Clique em uma das opções acima para buscar impressoras disponíveis. Certifique-se de que a impressora está ligada e pareada (para Bluetooth) ou conectada (para USB/Serial).'}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            {printerStatus === 'connected' && (
              <Button 
                onClick={handleTestPrint}
                disabled={isTestingPrint}
                variant="secondary"
              >
                {isTestingPrint ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Printer className="w-4 h-4 mr-2" />
                )}
                Testar
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowPrinterModal(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Batch Print Modal */}
      <Dialog open={showBatchModal} onOpenChange={setShowBatchModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SquareStack className="w-5 h-5" />
              Impressão em Lote
            </DialogTitle>
            <DialogDescription>
              Selecione as peças e quantidade de etiquetas para imprimir. Clique em uma peça para ver o preview.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-3 gap-4 min-h-0">
            {/* Lista de peças disponíveis */}
            <div className="flex flex-col border rounded-lg overflow-hidden">
              <div className="p-3 border-b bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-sm">Peças Disponíveis</span>
                  <Badge variant="secondary" className="ml-auto">{pecas.length}</Badge>
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar peça..."
                    value={batchSearchTerm}
                    onChange={(e) => setBatchSearchTerm(e.target.value)}
                    className="pl-8 h-8 text-sm"
                  />
                </div>
              </div>
              <ScrollArea className="flex-1 p-2">
                <div className="space-y-1">
                  {loadingPecas ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredPecasForBatch.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm py-8">
                      Nenhuma peça encontrada
                    </div>
                  ) : (
                    filteredPecasForBatch.map((peca) => {
                      const isSelected = batchPecas.some(bp => bp.peca.id === peca.id);
                      return (
                        <button
                          key={peca.id}
                          onClick={() => handleAddPecaToBatch(peca)}
                          disabled={isSelected}
                          className={cn(
                            "w-full p-2 rounded-md text-left transition-all flex items-center gap-2",
                            isSelected 
                              ? "bg-primary/10 border border-primary/20 opacity-60 cursor-not-allowed" 
                              : "hover:bg-muted border border-transparent"
                          )}
                        >
                          {peca.imagem_url ? (
                            <img 
                              src={peca.imagem_url} 
                              alt={peca.nome}
                              className="w-8 h-8 rounded object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                              <Package className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{peca.nome}</p>
                            <p className="text-xs text-muted-foreground">
                              {peca.codigo} • R$ {peca.preco_venda?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                          {isSelected ? (
                            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                          ) : (
                            <Plus className="w-4 h-4 text-muted-foreground shrink-0" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
              <div className="p-2 border-t flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSelectAll}
                  className="flex-1 text-xs"
                >
                  <CheckSquare className="w-3 h-3 mr-1" />
                  Selecionar Todos
                </Button>
              </div>
            </div>

            {/* Lista de peças selecionadas */}
            <div className="flex flex-col border rounded-lg overflow-hidden">
              <div className="p-3 border-b bg-muted/30">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">Etiquetas a Imprimir</span>
                  <Badge className="ml-auto">{getTotalLabels()} etiqueta(s)</Badge>
                </div>
              </div>
              <ScrollArea className="flex-1 p-2">
                {batchPecas.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm py-12">
                    <SquareStack className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>Nenhuma peça selecionada</p>
                    <p className="text-xs mt-1">Clique em uma peça para adicionar</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {batchPecas.map((item) => (
                      <div 
                        key={item.peca.id}
                        onClick={() => setPreviewPeca(item.peca)}
                        className={cn(
                          "p-2 rounded-lg border bg-card flex items-center gap-2 cursor-pointer transition-all",
                          previewPeca?.id === item.peca.id 
                            ? "border-primary ring-1 ring-primary/20" 
                            : "hover:border-primary/30"
                        )}
                      >
                        {item.peca.imagem_url ? (
                          <img 
                            src={item.peca.imagem_url} 
                            alt={item.peca.nome}
                            className="w-10 h-10 rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                            <Package className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.peca.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.peca.codigo} • R$ {item.peca.preco_venda?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleUpdateQuantity(item.peca.id, item.quantidade - 1)}
                            disabled={item.quantidade <= 1}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantidade}
                            onChange={(e) => handleUpdateQuantity(item.peca.id, parseInt(e.target.value) || 1)}
                            className="w-14 h-7 text-center text-sm"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleUpdateQuantity(item.peca.id, item.quantidade + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleRemovePecaFromBatch(item.peca.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              {batchPecas.length > 0 && (
                <div className="p-2 border-t">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleClearSelection}
                    className="w-full text-xs text-muted-foreground"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Limpar Seleção
                  </Button>
                </div>
              )}
            </div>

            {/* Preview da etiqueta com dados reais */}
            <div className="flex flex-col border rounded-lg overflow-hidden">
              <div className="p-3 border-b bg-muted/30">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">Preview da Etiqueta</span>
                </div>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center p-4 bg-gradient-to-br from-muted/20 to-muted/5">
                {previewPeca && selectedModeloForBatch ? (
                  <>
                    <div className="mb-4 transform scale-110">
                      <EtiquetaPreview 
                        modelo={{
                          ...modeloVazio,
                          ...(selectedModeloForBatch as FormData),
                          descricao: (selectedModeloForBatch as any).descricao || '',
                        }} 
                        scale={2.5} 
                        pecaReal={previewPeca}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">{previewPeca.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {previewPeca.codigo} • R$ {previewPeca.preco_venda?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Eye className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">Selecione uma peça</p>
                    <p className="text-xs">para ver o preview da etiqueta</p>
                  </div>
                )}

                {/* Seletor de modelo */}
                {batchPecas.length > 0 && (
                  <div className="mt-4 pt-4 border-t w-full">
                    <Label className="text-xs text-muted-foreground mb-2 block">Modelo de etiqueta</Label>
                    <Select
                      value={(selectedModeloForBatch as any)?.nome || ''}
                      onValueChange={(nome) => {
                        const modelo = [...MODELOS_PRONTOS, ...modelos].find(m => m.nome === nome);
                        if (modelo) setSelectedModeloForBatch(modelo);
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Selecione o modelo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="header-prontos" disabled className="text-xs font-semibold">
                          Modelos Prontos
                        </SelectItem>
                        {MODELOS_PRONTOS.map((m, idx) => (
                          <SelectItem key={`pronto-${idx}`} value={m.nome} className="text-xs">
                            {m.nome}
                          </SelectItem>
                        ))}
                        {modelos.length > 0 && (
                          <>
                            <SelectItem value="header-salvos" disabled className="text-xs font-semibold mt-2">
                              Meus Modelos
                            </SelectItem>
                            {modelos.map((m) => (
                              <SelectItem key={m.id} value={m.nome} className="text-xs">
                                {m.nome}
                              </SelectItem>
                            ))}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer com status e botão de impressão */}
          <div className="pt-4 border-t flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                printerStatus === 'connected' ? "bg-green-500" : "bg-muted-foreground"
              )} />
              <span className="text-sm text-muted-foreground">
                {printerStatus === 'connected' 
                  ? `Impressora: ${connectedPrinter?.name}` 
                  : 'Nenhuma impressora conectada'}
              </span>
              {printerStatus !== 'connected' && (
                <Button variant="link" size="sm" onClick={() => setShowPrinterModal(true)}>
                  Conectar
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowBatchModal(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handlePrintBatch}
                disabled={batchPecas.length === 0 || isPrintingBatch}
                className="btn-gold"
              >
                {isPrintingBatch ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Imprimindo...
                  </>
                ) : (
                  <>
                    <Printer className="w-4 h-4 mr-2" />
                    Imprimir {getTotalLabels()} Etiqueta(s)
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
