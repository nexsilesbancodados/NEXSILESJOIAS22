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
  Printer, 
  Package, 
  Save,
  FileText,
  Loader2,
  Truck,
  MapPin,
  Search
} from 'lucide-react';
import { toast } from 'sonner';
import { type Romaneio, useRomaneioItems } from '@/hooks/useSupabaseData';
import { supabase } from '@/lib/supabase-db';

interface DadosEnvio {
  // Remetente
  remetenteNome: string;
  remetenteTelefone: string;
  remetenteEndereco: string;
  remetenteCidade: string;
  remetenteEstado: string;
  remetenteCep: string;
  // Destinatário
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

interface EtiquetaEnvioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  romaneio: Romaneio | null;
  remetenteDefault?: Partial<DadosEnvio>;
}

const dadosVazios: DadosEnvio = {
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
  peso: '0.3',
  comprimento: '20',
  largura: '15',
  altura: '10',
};

export function EtiquetaEnvioModal({ 
  open, 
  onOpenChange, 
  romaneio,
  remetenteDefault 
}: EtiquetaEnvioModalProps) {
  const etiquetaRef = useRef<HTMLDivElement>(null);
  const pedidoRef = useRef<HTMLDivElement>(null);
  const [dados, setDados] = useState<DadosEnvio>(() => ({
    ...dadosVazios,
    ...remetenteDefault,
    destinatarioNome: romaneio?.cliente_nome || romaneio?.reseller_nome || '',
  }));
  const [activeTab, setActiveTab] = useState('remetente');
  const [frete, setFrete] = useState<FreteResult | null>(null);
  const [calculandoFrete, setCalculandoFrete] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState<'origem' | 'destino' | null>(null);

  // Buscar itens do romaneio
  const { data: itens = [] } = useRomaneioItems(romaneio?.id || '');

  // Update destinatario when romaneio changes
  useEffect(() => {
    if (romaneio && open) {
      setDados(prev => ({
        ...prev,
        ...remetenteDefault,
        destinatarioNome: romaneio.cliente_nome || romaneio.reseller_nome || '',
      }));
      setFrete(null);
    }
  }, [romaneio, open, remetenteDefault]);

  const buscarEnderecoPorCep = async (cep: string, tipo: 'origem' | 'destino') => {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) {
      toast.error('CEP deve ter 8 dígitos');
      return;
    }

    setBuscandoCep(tipo);
    try {
      const { data, error } = await supabase.functions.invoke('calcular-frete', {
        body: null,
        method: 'GET',
      });

      // Fallback para ViaCEP diretamente se a função não estiver pronta
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
          peso: parseFloat(dados.peso) || 0.3,
          comprimento: parseFloat(dados.comprimento) || 20,
          largura: parseFloat(dados.largura) || 15,
          altura: parseFloat(dados.altura) || 10,
          valor: romaneio?.total || 0,
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
          <title>Etiqueta de Envio - Romaneio #${romaneio?.id.slice(-6).toUpperCase()}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 10mm; }
            .etiqueta { border: 2px solid #000; padding: 15px; max-width: 150mm; margin: 0 auto; }
            .secao { padding: 10px 0; border-bottom: 1px dashed #666; }
            .secao:last-child { border-bottom: none; }
            .secao-titulo { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #666; margin-bottom: 5px; }
            .nome { font-size: 16px; font-weight: bold; margin-bottom: 3px; }
            .endereco { font-size: 12px; line-height: 1.4; }
            .telefone { font-size: 11px; color: #333; }
            .info-pacote { display: flex; justify-content: space-between; font-size: 11px; }
            .romaneio-id { text-align: center; font-size: 12px; font-weight: bold; background: #f0f0f0; padding: 5px; margin-top: 10px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>${printContent}<script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};};</script></body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintPedido = () => {
    const printContent = pedidoRef.current?.innerHTML;
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
          <title>Pedido - Romaneio #${romaneio?.id.slice(-6).toUpperCase()}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 15mm; font-size: 12px; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 15px; }
            .header h1 { font-size: 20px; margin-bottom: 5px; }
            .header p { color: #666; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
            .info-box { border: 1px solid #ddd; padding: 10px; border-radius: 4px; }
            .info-box h3 { font-size: 11px; text-transform: uppercase; color: #666; margin-bottom: 5px; }
            .info-box p { margin: 3px 0; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f5f5f5; font-weight: bold; }
            .text-right { text-align: right; }
            .total-row { font-weight: bold; background: #f9f9f9; }
            .footer { margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd; }
            .frete-info { background: #f0f8ff; padding: 10px; border-radius: 4px; margin-top: 10px; }
            @media print { body { padding: 10mm; } }
          </style>
        </head>
        <body>${printContent}<script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};};</script></body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleSaveAsDefault = () => {
    const remetenteData = {
      remetenteNome: dados.remetenteNome,
      remetenteTelefone: dados.remetenteTelefone,
      remetenteEndereco: dados.remetenteEndereco,
      remetenteCidade: dados.remetenteCidade,
      remetenteEstado: dados.remetenteEstado,
      remetenteCep: dados.remetenteCep,
    };
    localStorage.setItem('remetente_padrao', JSON.stringify(remetenteData));
    toast.success('Dados do remetente salvos como padrão');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Package className="w-5 h-5" />
            Envio do Pedido
          </DialogTitle>
          <DialogDescription>
            {romaneio && (
              <>Romaneio #{romaneio.id.slice(-6).toUpperCase()} • {formatCurrency(Number(romaneio.total))}</>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Formulário */}
          <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="remetente" className="text-xs">Remetente</TabsTrigger>
                <TabsTrigger value="destinatario" className="text-xs">Destinatário</TabsTrigger>
                <TabsTrigger value="pacote" className="text-xs">Pacote</TabsTrigger>
              </TabsList>

              <TabsContent value="remetente" className="space-y-3 mt-4">
                <div className="space-y-2">
                  <Label className="text-xs">Nome / Empresa</Label>
                  <Input
                    value={dados.remetenteNome}
                    onChange={(e) => setDados({ ...dados, remetenteNome: e.target.value })}
                    placeholder="Nome ou razão social"
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
                      {buscandoCep === 'origem' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Endereço</Label>
                  <Textarea
                    value={dados.remetenteEndereco}
                    onChange={(e) => setDados({ ...dados, remetenteEndereco: e.target.value })}
                    placeholder="Rua, número, complemento, bairro"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Cidade</Label>
                    <Input
                      value={dados.remetenteCidade}
                      onChange={(e) => setDados({ ...dados, remetenteCidade: e.target.value })}
                      placeholder="Cidade"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Estado</Label>
                    <Input
                      value={dados.remetenteEstado}
                      onChange={(e) => setDados({ ...dados, remetenteEstado: e.target.value })}
                      placeholder="UF"
                      maxLength={2}
                    />
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-2" onClick={handleSaveAsDefault}>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar como Padrão
                </Button>
              </TabsContent>

              <TabsContent value="destinatario" className="space-y-3 mt-4">
                <div className="space-y-2">
                  <Label className="text-xs">Nome</Label>
                  <Input
                    value={dados.destinatarioNome}
                    onChange={(e) => setDados({ ...dados, destinatarioNome: e.target.value })}
                    placeholder="Nome do destinatário"
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
                      {buscandoCep === 'destino' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Endereço</Label>
                  <Textarea
                    value={dados.destinatarioEndereco}
                    onChange={(e) => setDados({ ...dados, destinatarioEndereco: e.target.value })}
                    placeholder="Rua, número, complemento, bairro"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Cidade</Label>
                    <Input
                      value={dados.destinatarioCidade}
                      onChange={(e) => setDados({ ...dados, destinatarioCidade: e.target.value })}
                      placeholder="Cidade"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Estado</Label>
                    <Input
                      value={dados.destinatarioEstado}
                      onChange={(e) => setDados({ ...dados, destinatarioEstado: e.target.value })}
                      placeholder="UF"
                      maxLength={2}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="pacote" className="space-y-3 mt-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Volumes</Label>
                    <Input
                      type="number"
                      value={dados.volume}
                      onChange={(e) => setDados({ ...dados, volume: e.target.value })}
                      placeholder="1"
                      min={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Peso (kg)</Label>
                    <Input
                      value={dados.peso}
                      onChange={(e) => setDados({ ...dados, peso: e.target.value })}
                      placeholder="0.5"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Comprimento (cm)</Label>
                    <Input
                      value={dados.comprimento}
                      onChange={(e) => setDados({ ...dados, comprimento: e.target.value })}
                      placeholder="20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Largura (cm)</Label>
                    <Input
                      value={dados.largura}
                      onChange={(e) => setDados({ ...dados, largura: e.target.value })}
                      placeholder="15"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Altura (cm)</Label>
                    <Input
                      value={dados.altura}
                      onChange={(e) => setDados({ ...dados, altura: e.target.value })}
                      placeholder="10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Observações</Label>
                  <Textarea
                    value={dados.observacoes}
                    onChange={(e) => setDados({ ...dados, observacoes: e.target.value })}
                    placeholder="Instruções especiais, conteúdo frágil, etc."
                    rows={2}
                  />
                </div>

                {/* Calcular Frete */}
                <div className="pt-3 border-t">
                  <Button 
                    onClick={calcularFrete} 
                    disabled={calculandoFrete}
                    className="w-full"
                    variant="outline"
                  >
                    {calculandoFrete ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Truck className="w-4 h-4 mr-2" />
                    )}
                    Calcular Frete
                  </Button>

                  {frete && (
                    <div className="mt-3 space-y-2">
                      {frete.sedex && (
                        <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-900">
                          <div>
                            <span className="font-semibold text-orange-700 dark:text-orange-400">SEDEX</span>
                            <p className="text-xs text-muted-foreground">{frete.sedex.prazo} dia(s) útil(eis)</p>
                          </div>
                          <span className="font-bold text-orange-700 dark:text-orange-400">
                            {formatCurrency(frete.sedex.valor)}
                          </span>
                        </div>
                      )}
                      {frete.pac && (
                        <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
                          <div>
                            <span className="font-semibold text-blue-700 dark:text-blue-400">PAC</span>
                            <p className="text-xs text-muted-foreground">{frete.pac.prazo} dia(s) útil(eis)</p>
                          </div>
                          <span className="font-bold text-blue-700 dark:text-blue-400">
                            {formatCurrency(frete.pac.valor)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Previews */}
          <div className="space-y-4">
            <Tabs defaultValue="pedido">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pedido" className="text-xs">
                  <FileText className="w-3 h-3 mr-1" />
                  Pedido
                </TabsTrigger>
                <TabsTrigger value="etiqueta" className="text-xs">
                  <Package className="w-3 h-3 mr-1" />
                  Etiqueta
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pedido" className="mt-4">
                <div className="border rounded-lg p-4 bg-white dark:bg-background min-h-[400px] text-sm overflow-y-auto max-h-[450px]">
                  <div ref={pedidoRef}>
                    <div className="header" style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #000', paddingBottom: '15px' }}>
                      <h1 style={{ fontSize: '20px', marginBottom: '5px' }}>PEDIDO / ROMANEIO</h1>
                      <p style={{ color: '#666' }}>#{romaneio?.id.slice(-6).toUpperCase()} • {new Date(romaneio?.data || '').toLocaleDateString('pt-BR')}</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                      <div style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '4px' }}>
                        <h3 style={{ fontSize: '10px', textTransform: 'uppercase', color: '#666', marginBottom: '5px' }}>REMETENTE</h3>
                        <p style={{ fontWeight: 'bold' }}>{dados.remetenteNome || '-'}</p>
                        <p>{dados.remetenteEndereco || '-'}</p>
                        <p>{dados.remetenteCidade} - {dados.remetenteEstado}</p>
                        <p>CEP: {dados.remetenteCep || '-'}</p>
                        {dados.remetenteTelefone && <p>Tel: {dados.remetenteTelefone}</p>}
                      </div>
                      <div style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '4px' }}>
                        <h3 style={{ fontSize: '10px', textTransform: 'uppercase', color: '#666', marginBottom: '5px' }}>DESTINATÁRIO</h3>
                        <p style={{ fontWeight: 'bold' }}>{dados.destinatarioNome || romaneio?.cliente_nome || '-'}</p>
                        <p>{dados.destinatarioEndereco || '-'}</p>
                        <p>{dados.destinatarioCidade} - {dados.destinatarioEstado}</p>
                        <p>CEP: {dados.destinatarioCep || '-'}</p>
                        {dados.destinatarioTelefone && <p>Tel: {dados.destinatarioTelefone}</p>}
                      </div>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px' }}>
                      <thead>
                        <tr>
                          <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left', background: '#f5f5f5' }}>Item</th>
                          <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', background: '#f5f5f5' }}>Qtd</th>
                          <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right', background: '#f5f5f5' }}>Unitário</th>
                          <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right', background: '#f5f5f5' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {itens.map((item) => (
                          <tr key={item.id}>
                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.peca_nome}</td>
                            <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{item.quantidade}</td>
                            <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>{formatCurrency(Number(item.preco_unitario))}</td>
                            <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>{formatCurrency(Number(item.preco_unitario) * item.quantidade)}</td>
                          </tr>
                        ))}
                        <tr style={{ fontWeight: 'bold', background: '#f9f9f9' }}>
                          <td colSpan={3} style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>SUBTOTAL</td>
                          <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>{formatCurrency(Number(romaneio?.total || 0))}</td>
                        </tr>
                      </tbody>
                    </table>

                    {frete && (
                      <div style={{ background: '#f0f8ff', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>
                        <h3 style={{ fontSize: '10px', textTransform: 'uppercase', color: '#666', marginBottom: '5px' }}>OPÇÕES DE FRETE</h3>
                        {frete.sedex && (
                          <p>SEDEX: {formatCurrency(frete.sedex.valor)} ({frete.sedex.prazo} dia(s))</p>
                        )}
                        {frete.pac && (
                          <p>PAC: {formatCurrency(frete.pac.valor)} ({frete.pac.prazo} dia(s))</p>
                        )}
                      </div>
                    )}

                    {dados.observacoes && (
                      <div style={{ marginTop: '15px', padding: '10px', background: '#fffef0', borderRadius: '4px' }}>
                        <h3 style={{ fontSize: '10px', textTransform: 'uppercase', color: '#666', marginBottom: '5px' }}>OBSERVAÇÕES</h3>
                        <p>{dados.observacoes}</p>
                      </div>
                    )}

                    <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #ddd', fontSize: '10px', color: '#666' }}>
                      <p>Volume(s): {dados.volume} | Peso: {dados.peso}kg | Dimensões: {dados.comprimento}x{dados.largura}x{dados.altura}cm</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="etiqueta" className="mt-4">
                <div className="border rounded-lg p-4 bg-white dark:bg-background min-h-[300px]">
                  <div ref={etiquetaRef}>
                    <div className="etiqueta" style={{ border: '2px solid #000', padding: '15px', fontFamily: 'Arial, sans-serif' }}>
                      <div className="secao" style={{ paddingBottom: '10px', borderBottom: '1px dashed #666' }}>
                        <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#666', marginBottom: '5px' }}>REMETENTE</div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '2px' }}>{dados.remetenteNome || 'Nome do Remetente'}</div>
                        <div style={{ fontSize: '11px', lineHeight: '1.3' }}>
                          {dados.remetenteEndereco || 'Endereço'}<br />
                          {dados.remetenteCidade && dados.remetenteEstado ? `${dados.remetenteCidade} - ${dados.remetenteEstado}` : 'Cidade - UF'}
                          {dados.remetenteCep && ` • CEP: ${dados.remetenteCep}`}
                        </div>
                        {dados.remetenteTelefone && <div style={{ fontSize: '10px', color: '#333', marginTop: '2px' }}>Tel: {dados.remetenteTelefone}</div>}
                      </div>

                      <div className="secao" style={{ padding: '10px 0', borderBottom: '1px dashed #666' }}>
                        <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#666', marginBottom: '5px' }}>DESTINATÁRIO</div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '3px' }}>{dados.destinatarioNome || 'Nome do Destinatário'}</div>
                        <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
                          {dados.destinatarioEndereco || 'Endereço de entrega'}<br />
                          {dados.destinatarioCidade && dados.destinatarioEstado ? `${dados.destinatarioCidade} - ${dados.destinatarioEstado}` : 'Cidade - UF'}
                          {dados.destinatarioCep && ` • CEP: ${dados.destinatarioCep}`}
                        </div>
                        {dados.destinatarioTelefone && <div style={{ fontSize: '11px', color: '#333', marginTop: '3px' }}>Tel: {dados.destinatarioTelefone}</div>}
                      </div>

                      <div className="secao" style={{ paddingTop: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                          <span>Volume: {dados.volume || '1'}/{dados.volume || '1'}</span>
                          {dados.peso && <span>Peso: {dados.peso} kg</span>}
                        </div>
                        {dados.observacoes && <div style={{ fontSize: '10px', color: '#666', fontStyle: 'italic', marginTop: '5px' }}>{dados.observacoes}</div>}
                        {romaneio && (
                          <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: 'bold', background: '#f0f0f0', padding: '5px', marginTop: '10px' }}>
                            ROMANEIO #{romaneio.id.slice(-6).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <DialogFooter className="gap-2 flex-wrap">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="outline" onClick={handlePrintPedido}>
            <FileText className="w-4 h-4 mr-2" />
            Imprimir Pedido
          </Button>
          <Button onClick={handlePrintEtiqueta} className="btn-gold">
            <Printer className="w-4 h-4 mr-2" />
            Imprimir Etiqueta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
