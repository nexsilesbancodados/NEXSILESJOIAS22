import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Send, 
  Loader2, 
  Users, 
  Flame, 
  Thermometer, 
  Snowflake, 
  ShoppingCart,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Megaphone,
  Plus,
  X
} from 'lucide-react';
import { useOrganization } from '@/hooks/useOrganization';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const FILTROS = [
  { value: 'todos', label: 'Todos os contatos', icon: Users, color: 'text-blue-500' },
  { value: 'quente', label: 'Leads quentes', icon: Flame, color: 'text-red-500' },
  { value: 'morno', label: 'Leads mornos', icon: Thermometer, color: 'text-orange-500' },
  { value: 'frio', label: 'Leads frios', icon: Snowflake, color: 'text-cyan-500' },
  { value: 'sem_venda', label: 'Sem venda (oportunidade)', icon: ShoppingCart, color: 'text-amber-500' },
  { value: 'com_venda', label: 'Já compraram (recompra)', icon: CheckCircle2, color: 'text-green-500' },
  { value: 'manual', label: 'Números manuais', icon: Plus, color: 'text-purple-500' },
];

const TEMPLATES = [
  {
    nome: '🔥 Promoção Flash',
    texto: '🔥 *PROMOÇÃO RELÂMPAGO!* 🔥\n\nOlá! Temos peças incríveis com condições especiais por tempo limitado!\n\n💎 Desconto exclusivo para você\n⏰ Válido apenas hoje\n\nQuer ver as novidades? Me chame! 😍'
  },
  {
    nome: '✨ Novidades',
    texto: '✨ *NOVIDADES CHEGARAM!* ✨\n\nOlá! Acabamos de receber peças lindas e exclusivas!\n\n💍 Coleção nova disponível\n📸 Quer ver fotos?\n\nÉ só me chamar que mostro tudo! 😊'
  },
  {
    nome: '🎁 Recompra',
    texto: '💖 Olá! Como está suas peças? Espero que esteja amando!\n\nTemos novidades que combinam perfeitamente com o que você já tem! 🎁\n\nQuer dar uma olhadinha? Me chame! 😘'
  },
  {
    nome: '📢 Personalizado',
    texto: ''
  }
];

export function BroadcastPanel() {
  const { organizationId } = useOrganization();
  const [filtro, setFiltro] = useState('quente');
  const [mensagem, setMensagem] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ total: number; enviados: number; erros: number } | null>(null);
  const [contatosManuais, setContatosManuais] = useState<string[]>([]);
  const [novoContato, setNovoContato] = useState('');

  // Fetch contact counts per filter
  const { data: conversas = [] } = useQuery({
    queryKey: ['broadcast-contacts', organizationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('agente_conversas')
        .select('cliente_telefone, lead_score, venda_realizada')
        .eq('organization_id', organizationId!)
        .not('cliente_telefone', 'is', null);
      return data || [];
    },
    enabled: !!organizationId,
  });

  const contagemPorFiltro = useMemo(() => {
    const phones = new Map<string, typeof conversas[0]>();
    conversas.forEach(c => {
      if (c.cliente_telefone) {
        const clean = c.cliente_telefone.replace(/\D/g, '');
        if (clean.length >= 10 && !phones.has(clean)) {
          phones.set(clean, c);
        }
      }
    });

    const unique = Array.from(phones.values());
    return {
      todos: unique.length,
      quente: unique.filter(c => c.lead_score === 'quente').length,
      morno: unique.filter(c => c.lead_score === 'morno').length,
      frio: unique.filter(c => c.lead_score === 'frio').length,
      sem_venda: unique.filter(c => !c.venda_realizada).length,
      com_venda: unique.filter(c => c.venda_realizada).length,
      manual: contatosManuais.length,
    };
  }, [conversas, contatosManuais]);

  const contatosAlvo = filtro === 'manual' ? contatosManuais.length : (contagemPorFiltro[filtro as keyof typeof contagemPorFiltro] || 0);

  const handleAddContato = () => {
    const clean = novoContato.replace(/\D/g, '');
    if (clean.length >= 10 && !contatosManuais.includes(clean)) {
      setContatosManuais(prev => [...prev, clean]);
      setNovoContato('');
    } else {
      toast.error('Número inválido ou já adicionado');
    }
  };

  const handleRemoveContato = (tel: string) => {
    setContatosManuais(prev => prev.filter(t => t !== tel));
  };

  const handleSend = async () => {
    if (!mensagem.trim()) {
      toast.error('Digite uma mensagem');
      return;
    }
    if (contatosAlvo === 0) {
      toast.error('Nenhum contato para enviar');
      return;
    }

    setSending(true);
    setResult(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL || 'https://ljofnwcvpzqlhagejgbk.supabase.co'}/functions/v1/broadcast-whatsapp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            mensagem: mensagem.trim(),
            filtro,
            contatos_manuais: filtro === 'manual' ? contatosManuais : undefined,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar broadcast');
      }

      setResult({ total: data.total, enviados: data.enviados, erros: data.erros });
      toast.success(`Broadcast enviado! ${data.enviados} de ${data.total} mensagens`);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar broadcast');
    } finally {
      setSending(false);
    }
  };

  const filtroAtual = FILTROS.find(f => f.value === filtro);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Megaphone className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Broadcast em Massa</h2>
          <p className="text-sm text-muted-foreground">Envie promoções para múltiplos leads via WhatsApp</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Config */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filter selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Público-alvo</CardTitle>
              <CardDescription>Selecione quem receberá a mensagem</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={filtro} onValueChange={setFiltro}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FILTROS.map(f => {
                    const Icon = f.icon;
                    const count = contagemPorFiltro[f.value as keyof typeof contagemPorFiltro] || 0;
                    return (
                      <SelectItem key={f.value} value={f.value}>
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${f.color}`} />
                          <span>{f.label}</span>
                          <Badge variant="secondary" className="ml-1 text-[10px]">{count}</Badge>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              {/* Manual contacts */}
              {filtro === 'manual' && (
                <div className="space-y-2">
                  <Label className="text-xs">Adicionar números</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="(11) 99999-9999"
                      value={novoContato}
                      onChange={(e) => setNovoContato(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddContato()}
                    />
                    <Button size="sm" variant="outline" onClick={handleAddContato}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {contatosManuais.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {contatosManuais.map(tel => (
                        <Badge key={tel} variant="secondary" className="gap-1 pr-1">
                          {tel}
                          <button onClick={() => handleRemoveContato(tel)} className="ml-1 hover:text-destructive">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 text-sm">
                {filtroAtual && <filtroAtual.icon className={`h-4 w-4 ${filtroAtual.color}`} />}
                <span className="text-muted-foreground">
                  <strong className="text-foreground">{contatosAlvo}</strong> contatos serão notificados
                </span>
                {contatosAlvo > 200 && (
                  <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">
                    Máx 200 por envio
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Message */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Mensagem</CardTitle>
              <CardDescription>Use *texto* para negrito no WhatsApp</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Quick templates */}
              <div className="flex flex-wrap gap-2">
                {TEMPLATES.map(t => (
                  <Button
                    key={t.nome}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => t.texto && setMensagem(t.texto)}
                  >
                    {t.nome}
                  </Button>
                ))}
              </div>

              <Textarea
                placeholder="Digite sua mensagem de broadcast..."
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                rows={8}
                className="resize-none"
              />

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{mensagem.length} caracteres</span>
                <Button 
                  onClick={handleSend} 
                  disabled={sending || !mensagem.trim() || contatosAlvo === 0}
                  className="gap-2"
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Enviar para {Math.min(contatosAlvo, 200)} contatos
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Stats & Result */}
        <div className="space-y-4">
          {/* Contact breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Contatos por Segmento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {FILTROS.filter(f => f.value !== 'manual').map(f => {
                const Icon = f.icon;
                const count = contagemPorFiltro[f.value as keyof typeof contagemPorFiltro] || 0;
                const total = contagemPorFiltro.todos || 1;
                const pct = total > 0 ? (count / total) * 100 : 0;

                return (
                  <div key={f.value} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-3.5 w-3.5 ${f.color}`} />
                        <span className="text-xs">{f.label}</span>
                      </div>
                      <span className="text-xs font-medium">{count}</span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Result */}
          {result && (
            <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Resultado do Broadcast
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold">{result.total}</p>
                    <p className="text-[10px] text-muted-foreground">Total</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-green-600">{result.enviados}</p>
                    <p className="text-[10px] text-muted-foreground">Enviados</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-red-500">{result.erros}</p>
                    <p className="text-[10px] text-muted-foreground">Erros</p>
                  </div>
                </div>
                <Progress 
                  value={(result.enviados / result.total) * 100} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground text-center">
                  {((result.enviados / result.total) * 100).toFixed(0)}% de sucesso
                </p>
              </CardContent>
            </Card>
          )}

          {/* Tips */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Dicas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li>• Máximo de 200 contatos por envio</li>
                <li>• Delay de 1.5s entre mensagens</li>
                <li>• Use *texto* para negrito</li>
                <li>• Leads quentes têm maior taxa de conversão</li>
                <li>• Evite envios frequentes para não ser bloqueado</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
