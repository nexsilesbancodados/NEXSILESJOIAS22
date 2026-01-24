import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Printer, 
  Package, 
  Save,
  FileText,
  Loader2,
  Truck,
  MapPin,
  Search,
  Droplets,
  Scale
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase-db';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DadosEnvioGalvanica {
  // Remetente (você)
  remetenteNome: string;
  remetenteTelefone: string;
  remetenteEndereco: string;
  remetenteCidade: string;
  remetenteEstado: string;
  remetenteCep: string;
  // Destinatário (fornecedor galvânica)
  destinatarioNome: string;
  destinatarioTelefone: string;
  destinatarioEndereco: string;
  destinatarioCidade: string;
  destinatarioEstado: string;
  destinatarioCep: string;
  // Informações do pacote
  observacoes: string;
  volume: string;
  peso: string;
  comprimento: string;
  largura: string;
  altura: string;
}

interface FreteResult {
  sedex: { valor: number; prazo: number } | null;
  pac: { valor: number; prazo: number } | null;
}

interface EnvioInfo {
  id: string;
  data_envio: string;
  peso_total: number;
  valor_total: number;
  status: string;
  banho_nome?: string;
  observacoes?: string;
}

interface EtiquetaGalvanicaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  envio: EnvioInfo | null;
}

const dadosVazios: DadosEnvioGalvanica = {
  remetenteNome: '',
  remetenteTelefone: '',
  remetenteEndereco: '',
  remetenteCidade: '',
  remetenteEstado: '',
  remetenteCep: '',
  destinatarioNome: '',
  destinatarioTelefone: '',
  destinatarioEndereco: '',
  destinatarioCidade: '',
  destinatarioEstado: '',
  destinatarioCep: '',
  observacoes: '',
  volume: '1',
  peso: '0.5',
  comprimento: '25',
  largura: '20',
  altura: '15',
};

export function EtiquetaGalvanicaModal({ 
  open, 
  onOpenChange, 
  envio
}: EtiquetaGalvanicaModalProps) {
  const etiquetaRef = useRef<HTMLDivElement>(null);
  const romaneioRef = useRef<HTMLDivElement>(null);
  const [dados, setDados] = useState<DadosEnvioGalvanica>(dadosVazios);
  const [activeTab, setActiveTab] = useState('remetente');
  const [frete, setFrete] = useState<FreteResult | null>(null);
  const [calculandoFrete, setCalculandoFrete] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState<'origem' | 'destino' | null>(null);
  const [freteEscolhido, setFreteEscolhido] = useState<'sedex' | 'pac'>('pac');

  // Load saved data
  useEffect(() => {
    if (open) {
      const savedRemetente = localStorage.getItem('remetente_galvanica_padrao');
      const savedDestinatario = localStorage.getItem('destinatario_galvanica_padrao');
      
      setDados(prev => ({
        ...dadosVazios,
        ...(savedRemetente ? JSON.parse(savedRemetente) : {}),
        ...(savedDestinatario ? JSON.parse(savedDestinatario) : {}),
        peso: envio?.peso_total?.toString() || '0.5',
      }));
      setFrete(null);
    }
  }, [open, envio]);

  const buscarEnderecoPorCep = async (cep: string, tipo: 'origem' | 'destino') => {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) {
      toast.error('CEP deve ter 8 dígitos');
      return;
    }

    setBuscandoCep(tipo);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const endereco = await response.json();

      if (endereco.erro) {
        toast.error('CEP não encontrado');
        return;
      }

      if (tipo === 'origem') {
        setDados(prev => ({
          ...prev,
          remetenteEndereco: `${endereco.logradouro}, ${endereco.bairro}`,
          remetenteCidade: endereco.localidade,
          remetenteEstado: endereco.uf,
        }));
      } else {
        setDados(prev => ({
          ...prev,
          destinatarioEndereco: `${endereco.logradouro}, ${endereco.bairro}`,
          destinatarioCidade: endereco.localidade,
          destinatarioEstado: endereco.uf,
        }));
      }

      toast.success('Endereço preenchido!');
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast.error('Erro ao buscar endereço');
    } finally {
      setBuscandoCep(null);
    }
  };

  const calcularFrete = async () => {
    if (!dados.remetenteCep || !dados.destinatarioCep) {
      toast.error('Preencha o CEP de origem e destino');
      return;
    }

    setCalculandoFrete(true);
    try {
      const { data, error } = await supabase.functions.invoke('calcular-frete', {
        body: {
          cepOrigem: dados.remetenteCep,
          cepDestino: dados.destinatarioCep,
          peso: parseFloat(dados.peso) || 0.5,
          comprimento: parseFloat(dados.comprimento) || 25,
          largura: parseFloat(dados.largura) || 20,
          altura: parseFloat(dados.altura) || 15,
          valor: envio?.valor_total || 0,
        },
      });

      if (error) throw error;

      setFrete(data);
      toast.success('Frete calculado!');
    } catch (error) {
      console.error('Erro ao calcular frete:', error);
      toast.error('Erro ao calcular frete');
    } finally {
      setCalculandoFrete(false);
    }
  };

  const handlePrintEtiqueta = () => {
    if (!dados.remetenteNome || !dados.destinatarioNome) {
      toast.error('Preencha pelo menos o nome do remetente e destinatário');
      return;
    }

    const printContent = etiquetaRef.current?.innerHTML;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Não foi possível abrir a janela de impressão');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Etiqueta Galvânica - ${envio?.id.slice(-6).toUpperCase()}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 10mm; }
            .etiqueta { border: 3px solid #000; padding: 15px; max-width: 150mm; margin: 0 auto; }
            .header { text-align: center; background: #1a1a1a; color: white; padding: 8px; margin: -15px -15px 15px -15px; }
            .header h2 { font-size: 14px; }
            .secao { padding: 12px 0; border-bottom: 2px dashed #333; }
            .secao:last-child { border-bottom: none; }
            .secao-titulo { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #666; margin-bottom: 5px; letter-spacing: 1px; }
            .nome { font-size: 16px; font-weight: bold; margin-bottom: 3px; }
            .endereco { font-size: 12px; line-height: 1.5; }
            .telefone { font-size: 11px; color: #333; margin-top: 3px; }
            .info-envio { background: #f5f5f5; padding: 10px; border-radius: 4px; margin-top: 10px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 11px; }
            .info-item { text-align: center; }
            .info-item .label { font-size: 9px; color: #666; text-transform: uppercase; }
            .info-item .value { font-size: 14px; font-weight: bold; }
            .envio-id { text-align: center; font-size: 14px; font-weight: bold; background: #ffc107; padding: 8px; margin-top: 10px; border-radius: 4px; }
            .frete-badge { display: inline-block; background: #28a745; color: white; padding: 3px 8px; border-radius: 3px; font-size: 10px; margin-top: 5px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>${printContent}<script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};};</script></body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintRomaneio = () => {
    const printContent = romaneioRef.current?.innerHTML;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Não foi possível abrir a janela de impressão');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Romaneio Galvânica - ${envio?.id.slice(-6).toUpperCase()}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 15mm; font-size: 12px; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 3px solid #1a1a1a; padding-bottom: 15px; }
            .header h1 { font-size: 22px; margin-bottom: 5px; }
            .header p { color: #666; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
            .info-box { border: 1px solid #ddd; padding: 12px; border-radius: 6px; background: #fafafa; }
            .info-box h3 { font-size: 10px; text-transform: uppercase; color: #888; margin-bottom: 8px; letter-spacing: 1px; }
            .info-box p { margin: 4px 0; font-size: 12px; }
            .info-box .nome { font-weight: bold; font-size: 14px; }
            .resumo { background: #f0f8ff; border: 2px solid #0066cc; padding: 15px; border-radius: 6px; margin: 20px 0; }
            .resumo h3 { color: #0066cc; margin-bottom: 10px; }
            .resumo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; text-align: center; }
            .resumo-item .label { font-size: 10px; color: #666; text-transform: uppercase; }
            .resumo-item .value { font-size: 18px; font-weight: bold; color: #0066cc; }
            .frete-info { background: #e8f5e9; border: 1px solid #4caf50; padding: 12px; border-radius: 6px; margin-top: 15px; }
            .footer { margin-top: 30px; padding-top: 15px; border-top: 2px dashed #ccc; }
            .assinaturas { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; }
            .assinatura { text-align: center; }
            .assinatura .linha { border-top: 1px solid #333; margin-top: 50px; padding-top: 5px; }
            @media print { body { padding: 10mm; } }
          </style>
        </head>
        <body>${printContent}<script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};};</script></body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleSaveRemetente = () => {
    const remetenteData = {
      remetenteNome: dados.remetenteNome,
      remetenteTelefone: dados.remetenteTelefone,
      remetenteEndereco: dados.remetenteEndereco,
      remetenteCidade: dados.remetenteCidade,
      remetenteEstado: dados.remetenteEstado,
      remetenteCep: dados.remetenteCep,
    };
    localStorage.setItem('remetente_galvanica_padrao', JSON.stringify(remetenteData));
    toast.success('Dados do remetente salvos!');
  };

  const handleSaveDestinatario = () => {
    const destinatarioData = {
      destinatarioNome: dados.destinatarioNome,
      destinatarioTelefone: dados.destinatarioTelefone,
      destinatarioEndereco: dados.destinatarioEndereco,
      destinatarioCidade: dados.destinatarioCidade,
      destinatarioEstado: dados.destinatarioEstado,
      destinatarioCep: dados.destinatarioCep,
    };
    localStorage.setItem('destinatario_galvanica_padrao', JSON.stringify(destinatarioData));
    toast.success('Fornecedor salvo como padrão!');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Droplets className="w-5 h-5 text-primary" />
            Etiqueta de Envio Galvânica
          </DialogTitle>
          <DialogDescription>
            {envio && (
              <div className="flex items-center gap-3 mt-1">
                <Badge variant="outline">#{envio.id.slice(-6).toUpperCase()}</Badge>
                <span className="text-muted-foreground">•</span>
                <span>{envio.peso_total?.toFixed(1)}g</span>
                <span className="text-muted-foreground">•</span>
                <span>{formatCurrency(envio.valor_total || 0)}</span>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Formulário */}
          <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="remetente" className="text-xs">Remetente</TabsTrigger>
                <TabsTrigger value="destinatario" className="text-xs">Fornecedor</TabsTrigger>
                <TabsTrigger value="pacote" className="text-xs">Pacote</TabsTrigger>
              </TabsList>

              <TabsContent value="remetente" className="space-y-3 mt-4">
                <div className="space-y-2">
                  <Label className="text-xs">Nome / Empresa</Label>
                  <Input
                    value={dados.remetenteNome}
                    onChange={(e) => setDados({ ...dados, remetenteNome: e.target.value })}
                    placeholder="Sua empresa"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Telefone</Label>
                  <Input
                    value={dados.remetenteTelefone}
                    onChange={(e) => setDados({ ...dados, remetenteTelefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">CEP</Label>
                  <div className="flex gap-2">
                    <Input
                      value={dados.remetenteCep}
                      onChange={(e) => setDados({ ...dados, remetenteCep: e.target.value })}
                      placeholder="00000-000"
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => buscarEnderecoPorCep(dados.remetenteCep, 'origem')}
                      disabled={buscandoCep === 'origem'}
                    >
                      {buscandoCep === 'origem' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Endereço</Label>
                  <Textarea
                    value={dados.remetenteEndereco}
                    onChange={(e) => setDados({ ...dados, remetenteEndereco: e.target.value })}
                    placeholder="Rua, número, bairro"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Cidade</Label>
                    <Input
                      value={dados.remetenteCidade}
                      onChange={(e) => setDados({ ...dados, remetenteCidade: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">UF</Label>
                    <Input
                      value={dados.remetenteEstado}
                      onChange={(e) => setDados({ ...dados, remetenteEstado: e.target.value })}
                      maxLength={2}
                    />
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={handleSaveRemetente}>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Remetente
                </Button>
              </TabsContent>

              <TabsContent value="destinatario" className="space-y-3 mt-4">
                <div className="space-y-2">
                  <Label className="text-xs">Fornecedor Galvânica</Label>
                  <Input
                    value={dados.destinatarioNome}
                    onChange={(e) => setDados({ ...dados, destinatarioNome: e.target.value })}
                    placeholder="Nome do fornecedor"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Telefone</Label>
                  <Input
                    value={dados.destinatarioTelefone}
                    onChange={(e) => setDados({ ...dados, destinatarioTelefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">CEP</Label>
                  <div className="flex gap-2">
                    <Input
                      value={dados.destinatarioCep}
                      onChange={(e) => setDados({ ...dados, destinatarioCep: e.target.value })}
                      placeholder="00000-000"
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => buscarEnderecoPorCep(dados.destinatarioCep, 'destino')}
                      disabled={buscandoCep === 'destino'}
                    >
                      {buscandoCep === 'destino' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Endereço</Label>
                  <Textarea
                    value={dados.destinatarioEndereco}
                    onChange={(e) => setDados({ ...dados, destinatarioEndereco: e.target.value })}
                    placeholder="Rua, número, bairro"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Cidade</Label>
                    <Input
                      value={dados.destinatarioCidade}
                      onChange={(e) => setDados({ ...dados, destinatarioCidade: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">UF</Label>
                    <Input
                      value={dados.destinatarioEstado}
                      onChange={(e) => setDados({ ...dados, destinatarioEstado: e.target.value })}
                      maxLength={2}
                    />
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={handleSaveDestinatario}>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Fornecedor
                </Button>
              </TabsContent>

              <TabsContent value="pacote" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Peso (kg)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={dados.peso}
                      onChange={(e) => setDados({ ...dados, peso: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Volumes</Label>
                    <Input
                      type="number"
                      value={dados.volume}
                      onChange={(e) => setDados({ ...dados, volume: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Comp. (cm)</Label>
                    <Input
                      type="number"
                      value={dados.comprimento}
                      onChange={(e) => setDados({ ...dados, comprimento: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Larg. (cm)</Label>
                    <Input
                      type="number"
                      value={dados.largura}
                      onChange={(e) => setDados({ ...dados, largura: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Alt. (cm)</Label>
                    <Input
                      type="number"
                      value={dados.altura}
                      onChange={(e) => setDados({ ...dados, altura: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Observações</Label>
                  <Textarea
                    value={dados.observacoes}
                    onChange={(e) => setDados({ ...dados, observacoes: e.target.value })}
                    placeholder="Instruções especiais..."
                    rows={2}
                  />
                </div>

                <Button 
                  className="w-full" 
                  onClick={calcularFrete}
                  disabled={calculandoFrete}
                >
                  {calculandoFrete ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Truck className="w-4 h-4 mr-2" />
                  )}
                  Calcular Frete
                </Button>

                {frete && (
                  <div className="space-y-3">
                    <Label className="text-xs">Escolha o frete:</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {frete.sedex && (
                        <Card 
                          className={`cursor-pointer transition-all ${freteEscolhido === 'sedex' ? 'ring-2 ring-primary' : ''}`}
                          onClick={() => setFreteEscolhido('sedex')}
                        >
                          <CardContent className="p-3 text-center">
                            <p className="text-xs text-muted-foreground">SEDEX</p>
                            <p className="font-bold text-lg">{formatCurrency(frete.sedex.valor)}</p>
                            <p className="text-xs text-muted-foreground">{frete.sedex.prazo} dia(s)</p>
                          </CardContent>
                        </Card>
                      )}
                      {frete.pac && (
                        <Card 
                          className={`cursor-pointer transition-all ${freteEscolhido === 'pac' ? 'ring-2 ring-primary' : ''}`}
                          onClick={() => setFreteEscolhido('pac')}
                        >
                          <CardContent className="p-3 text-center">
                            <p className="text-xs text-muted-foreground">PAC</p>
                            <p className="font-bold text-lg">{formatCurrency(frete.pac.valor)}</p>
                            <p className="text-xs text-muted-foreground">{frete.pac.prazo} dia(s)</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Preview */}
          <div className="space-y-4">
            <div className="text-sm font-medium text-muted-foreground">Pré-visualização</div>
            
            {/* Etiqueta Preview */}
            <div ref={etiquetaRef} className="border-2 border-dashed rounded-lg p-4 bg-white">
              <div className="text-center bg-foreground text-background py-2 -mx-4 -mt-4 mb-4">
                <h2 className="text-sm font-bold">ENVIO GALVÂNICA</h2>
              </div>
              
              <div className="space-y-3">
                <div className="pb-3 border-b border-dashed">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Remetente</p>
                  <p className="font-bold text-sm">{dados.remetenteNome || 'Nome do remetente'}</p>
                  <p className="text-xs">{dados.remetenteEndereco || 'Endereço'}</p>
                  <p className="text-xs">{dados.remetenteCidade && dados.remetenteEstado ? `${dados.remetenteCidade} - ${dados.remetenteEstado}` : 'Cidade - UF'} | CEP: {dados.remetenteCep || '00000-000'}</p>
                  {dados.remetenteTelefone && <p className="text-xs text-muted-foreground">Tel: {dados.remetenteTelefone}</p>}
                </div>

                <div className="pb-3 border-b border-dashed">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Destinatário (Fornecedor)</p>
                  <p className="font-bold text-sm">{dados.destinatarioNome || 'Nome do fornecedor'}</p>
                  <p className="text-xs">{dados.destinatarioEndereco || 'Endereço'}</p>
                  <p className="text-xs">{dados.destinatarioCidade && dados.destinatarioEstado ? `${dados.destinatarioCidade} - ${dados.destinatarioEstado}` : 'Cidade - UF'} | CEP: {dados.destinatarioCep || '00000-000'}</p>
                  {dados.destinatarioTelefone && <p className="text-xs text-muted-foreground">Tel: {dados.destinatarioTelefone}</p>}
                </div>

                <div className="bg-muted/50 p-2 rounded text-center">
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase">Peso</p>
                      <p className="font-bold">{dados.peso}kg</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase">Vol.</p>
                      <p className="font-bold">{dados.volume}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase">Valor</p>
                      <p className="font-bold">{formatCurrency(envio?.valor_total || 0)}</p>
                    </div>
                  </div>
                </div>

                <div className="text-center bg-amber-100 py-2 rounded font-bold text-sm">
                  #{envio?.id.slice(-6).toUpperCase() || 'ENVIO'}
                </div>

                {frete && (
                  <div className="text-center">
                    <Badge className="bg-emerald-500">
                      {freteEscolhido.toUpperCase()} - {formatCurrency(freteEscolhido === 'sedex' ? frete.sedex?.valor || 0 : frete.pac?.valor || 0)}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Romaneio Hidden for Print */}
            <div ref={romaneioRef} className="hidden">
              <div className="header">
                <h1>Romaneio de Envio - Galvânica</h1>
                <p>Documento nº {envio?.id.slice(-6).toUpperCase()} | {envio?.data_envio ? format(new Date(envio.data_envio), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : 'Data'}</p>
              </div>

              <div className="info-grid">
                <div className="info-box">
                  <h3>Remetente</h3>
                  <p className="nome">{dados.remetenteNome}</p>
                  <p>{dados.remetenteEndereco}</p>
                  <p>{dados.remetenteCidade} - {dados.remetenteEstado}</p>
                  <p>CEP: {dados.remetenteCep}</p>
                  <p>Tel: {dados.remetenteTelefone}</p>
                </div>
                <div className="info-box">
                  <h3>Destinatário (Fornecedor)</h3>
                  <p className="nome">{dados.destinatarioNome}</p>
                  <p>{dados.destinatarioEndereco}</p>
                  <p>{dados.destinatarioCidade} - {dados.destinatarioEstado}</p>
                  <p>CEP: {dados.destinatarioCep}</p>
                  <p>Tel: {dados.destinatarioTelefone}</p>
                </div>
              </div>

              <div className="resumo">
                <h3>Resumo do Envio</h3>
                <div className="resumo-grid">
                  <div className="resumo-item">
                    <div className="label">Peso Total</div>
                    <div className="value">{dados.peso}kg</div>
                  </div>
                  <div className="resumo-item">
                    <div className="label">Volumes</div>
                    <div className="value">{dados.volume}</div>
                  </div>
                  <div className="resumo-item">
                    <div className="label">Valor Declarado</div>
                    <div className="value">{formatCurrency(envio?.valor_total || 0)}</div>
                  </div>
                </div>
              </div>

              {envio?.banho_nome && (
                <div className="info-box" style={{ marginTop: '15px' }}>
                  <h3>Tipo de Banho Solicitado</h3>
                  <p className="nome">{envio.banho_nome}</p>
                </div>
              )}

              {frete && (
                <div className="frete-info">
                  <strong>Frete Selecionado:</strong> {freteEscolhido.toUpperCase()} - {formatCurrency(freteEscolhido === 'sedex' ? frete.sedex?.valor || 0 : frete.pac?.valor || 0)} 
                  ({freteEscolhido === 'sedex' ? frete.sedex?.prazo : frete.pac?.prazo} dias úteis)
                </div>
              )}

              {dados.observacoes && (
                <div className="info-box" style={{ marginTop: '15px' }}>
                  <h3>Observações</h3>
                  <p>{dados.observacoes}</p>
                </div>
              )}

              <div className="footer">
                <div className="assinaturas">
                  <div className="assinatura">
                    <div className="linha">Remetente</div>
                  </div>
                  <div className="assinatura">
                    <div className="linha">Recebido por</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handlePrintRomaneio}>
            <FileText className="w-4 h-4 mr-2" />
            Imprimir Romaneio
          </Button>
          <Button onClick={handlePrintEtiqueta}>
            <Printer className="w-4 h-4 mr-2" />
            Imprimir Etiqueta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
