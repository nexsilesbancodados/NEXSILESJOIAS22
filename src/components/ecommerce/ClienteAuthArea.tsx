import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-db';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { User, LogOut, Loader2, Package, ChevronDown, ChevronRight, Eye } from 'lucide-react';

interface ClienteSession {
  id: string;
  nome: string;
  email: string;
}

interface Pedido {
  id: string;
  numero_pedido: number;
  status: string;
  valor_total: number;
  valor_frete: number;
  created_at: string;
  metodo_pagamento: string | null;
}

interface PedidoItem {
  id: string;
  quantidade: number;
  preco_unitario: number;
  peca_nome: string;
  peca_codigo: string;
  peca_imagem_url: string | null;
}

interface ClienteAuthAreaProps {
  organizationId: string;
  roseGold: string;
  roseGoldLight: string;
  textDark: string;
  textMuted: string;
  warmWhite: string;
}

export function ClienteAuthArea({ organizationId, roseGold, roseGoldLight, textDark, textMuted, warmWhite }: ClienteAuthAreaProps) {
  const [session, setSession] = useState<ClienteSession | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [meusPedidosOpen, setMeusPedidosOpen] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  // Auth form
  const [form, setForm] = useState({ nome: '', email: '', senha: '', telefone: '' });

  // Orders
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loadingPedidos, setLoadingPedidos] = useState(false);
  const [expandedPedido, setExpandedPedido] = useState<string | null>(null);
  const [pedidoItens, setPedidoItens] = useState<Record<string, PedidoItem[]>>({});

  // Persist session in localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`cliente_session_${organizationId}`);
    if (saved) {
      try { setSession(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, [organizationId]);

  const handleLogin = async () => {
    if (!form.email.trim() || !form.senha.trim()) { toast.error('Preencha email e senha'); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('verify_cliente_login', {
        p_email: form.email,
        p_password: form.senha,
        p_organization_id: organizationId,
      });
      if (error) throw error;
      if (!data || data.length === 0) { toast.error('Email ou senha inválidos'); setLoading(false); return; }
      const s: ClienteSession = { id: data[0].cliente_id, nome: data[0].cliente_nome, email: form.email.toLowerCase().trim() };
      setSession(s);
      localStorage.setItem(`cliente_session_${organizationId}`, JSON.stringify(s));
      setAuthOpen(false);
      setForm({ nome: '', email: '', senha: '', telefone: '' });
      toast.success(`Bem-vinda, ${s.nome}! ✨`);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!form.nome.trim() || !form.email.trim() || !form.senha.trim()) {
      toast.error('Preencha todos os campos obrigatórios'); return;
    }
    if (form.senha.length < 6) { toast.error('Senha deve ter no mínimo 6 caracteres'); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('registrar_cliente_loja', {
        p_nome: form.nome,
        p_email: form.email,
        p_senha: form.senha,
        p_telefone: form.telefone || null,
        p_organization_id: organizationId,
      });
      if (error) throw error;
      const s: ClienteSession = { id: data, nome: form.nome, email: form.email.toLowerCase().trim() };
      setSession(s);
      localStorage.setItem(`cliente_session_${organizationId}`, JSON.stringify(s));
      setAuthOpen(false);
      setForm({ nome: '', email: '', senha: '', telefone: '' });
      toast.success('Conta criada com sucesso! ✨');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setSession(null);
    localStorage.removeItem(`cliente_session_${organizationId}`);
    setPedidos([]);
    toast.success('Sessão encerrada');
  };

  const loadPedidos = async () => {
    if (!session) return;
    setLoadingPedidos(true);
    try {
      const { data, error } = await supabase.rpc('fetch_cliente_pedidos', {
        p_cliente_email: session.email,
        p_organization_id: organizationId,
      });
      if (error) throw error;
      setPedidos((data || []) as Pedido[]);
    } catch { toast.error('Erro ao carregar pedidos'); }
    finally { setLoadingPedidos(false); }
  };

  const loadPedidoItens = async (pedidoId: string) => {
    if (pedidoItens[pedidoId]) return;
    try {
      const { data, error } = await supabase.rpc('fetch_cliente_pedido_itens', { p_pedido_id: pedidoId });
      if (error) throw error;
      setPedidoItens(prev => ({ ...prev, [pedidoId]: (data || []) as PedidoItem[] }));
    } catch { /* ignore */ }
  };

  const togglePedido = (pedidoId: string) => {
    if (expandedPedido === pedidoId) {
      setExpandedPedido(null);
    } else {
      setExpandedPedido(pedidoId);
      loadPedidoItens(pedidoId);
    }
  };

  const openMeusPedidos = () => {
    setMeusPedidosOpen(true);
    loadPedidos();
  };

  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const statusColor = (s: string) => {
    switch (s) {
      case 'pago': case 'aprovado': case 'entregue': return { bg: '#E8F5E9', text: '#2E7D32' };
      case 'pendente': return { bg: '#FFF3E0', text: '#E65100' };
      case 'cancelado': return { bg: '#FFEBEE', text: '#C62828' };
      case 'enviado': return { bg: '#E3F2FD', text: '#1565C0' };
      default: return { bg: '#F5F5F5', text: '#616161' };
    }
  };

  const statusLabel = (s: string) => {
    const labels: Record<string, string> = {
      pendente: 'Pendente', pago: 'Pago', aprovado: 'Aprovado',
      enviado: 'Enviado', entregue: 'Entregue', cancelado: 'Cancelado',
    };
    return labels[s] || s;
  };

  return (
    <>
      {/* Header Button */}
      {session ? (
        <div className="flex items-center gap-2">
          <button
            onClick={openMeusPedidos}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase tracking-wider transition-opacity hover:opacity-70"
            style={{ color: textDark, fontFamily: "'Inter', sans-serif" }}
          >
            <Package className="w-4 h-4" />
            <span className="hidden sm:inline">Meus Pedidos</span>
          </button>
          <button
            onClick={logout}
            className="p-1.5 transition-opacity hover:opacity-70"
            title="Sair"
          >
            <LogOut className="w-4 h-4" style={{ color: textMuted }} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAuthOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase tracking-wider transition-opacity hover:opacity-70"
          style={{ color: textDark, fontFamily: "'Inter', sans-serif" }}
        >
          <User className="w-4 h-4" />
          <span className="hidden sm:inline">Entrar</span>
        </button>
      )}

      {/* Auth Dialog */}
      <Dialog open={authOpen} onOpenChange={setAuthOpen}>
        <DialogContent className="sm:max-w-md" style={{ backgroundColor: warmWhite }}>
          <DialogHeader>
            <DialogTitle className="text-xl tracking-wide uppercase text-center" style={{ color: textDark, fontFamily: "'Cormorant Garamond', serif" }}>
              {isLogin ? 'Entrar na sua conta' : 'Criar conta'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2" style={{ fontFamily: "'Inter', sans-serif" }}>
            {!isLogin && (
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider" style={{ color: textMuted }}>Nome *</Label>
                <Input
                  value={form.nome}
                  onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
                  placeholder="Seu nome completo"
                  className="rounded-none border-b border-t-0 border-x-0 bg-transparent focus-visible:ring-0 px-0"
                  style={{ borderColor: '#E0D5CF' }}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider" style={{ color: textMuted }}>Email *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="seu@email.com"
                className="rounded-none border-b border-t-0 border-x-0 bg-transparent focus-visible:ring-0 px-0"
                style={{ borderColor: '#E0D5CF' }}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider" style={{ color: textMuted }}>Senha *</Label>
              <Input
                type="password"
                value={form.senha}
                onChange={e => setForm(p => ({ ...p, senha: e.target.value }))}
                placeholder="Mínimo 6 caracteres"
                className="rounded-none border-b border-t-0 border-x-0 bg-transparent focus-visible:ring-0 px-0"
                style={{ borderColor: '#E0D5CF' }}
                onKeyDown={e => e.key === 'Enter' && (isLogin ? handleLogin() : handleRegister())}
              />
            </div>
            {!isLogin && (
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider" style={{ color: textMuted }}>Telefone</Label>
                <Input
                  value={form.telefone}
                  onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))}
                  placeholder="(00) 00000-0000"
                  className="rounded-none border-b border-t-0 border-x-0 bg-transparent focus-visible:ring-0 px-0"
                  style={{ borderColor: '#E0D5CF' }}
                />
              </div>
            )}
            <button
              onClick={isLogin ? handleLogin : handleRegister}
              disabled={loading}
              className="w-full py-3 text-white text-sm uppercase tracking-[0.15em] transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: roseGold }}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLogin ? 'Entrar' : 'Criar Conta'}
            </button>
            <p className="text-center text-xs" style={{ color: textMuted }}>
              {isLogin ? 'Não tem conta?' : 'Já tem conta?'}{' '}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="underline transition-opacity hover:opacity-70"
                style={{ color: roseGold }}
              >
                {isLogin ? 'Criar conta' : 'Fazer login'}
              </button>
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Meus Pedidos Dialog */}
      <Dialog open={meusPedidosOpen} onOpenChange={setMeusPedidosOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto" style={{ backgroundColor: warmWhite }}>
          <DialogHeader>
            <DialogTitle className="text-xl tracking-wide uppercase flex items-center gap-2" style={{ color: textDark, fontFamily: "'Cormorant Garamond', serif" }}>
              <Package className="w-5 h-5" style={{ color: roseGold }} />
              Meus Pedidos
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4 space-y-3" style={{ fontFamily: "'Inter', sans-serif" }}>
            {loadingPedidos ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: roseGold }} />
              </div>
            ) : pedidos.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 mx-auto mb-3" style={{ color: roseGoldLight }} />
                <p className="text-sm" style={{ color: textMuted }}>Você ainda não tem pedidos</p>
                <p className="text-xs mt-1" style={{ color: textMuted }}>Faça sua primeira compra! ✨</p>
              </div>
            ) : (
              pedidos.map(pedido => {
                const sc = statusColor(pedido.status);
                const isExpanded = expandedPedido === pedido.id;
                const itens = pedidoItens[pedido.id];

                return (
                  <div key={pedido.id} className="border" style={{ borderColor: '#F0E6E0' }}>
                    <button
                      onClick={() => togglePedido(pedido.id)}
                      className="w-full p-4 flex items-center gap-3 text-left hover:bg-black/[0.02] transition-colors"
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: textMuted }} /> : <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: textMuted }} />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold" style={{ color: textDark }}>
                            Pedido #{pedido.numero_pedido}
                          </span>
                          <span
                            className="text-[10px] px-2 py-0.5 uppercase tracking-wider font-medium"
                            style={{ backgroundColor: sc.bg, color: sc.text }}
                          >
                            {statusLabel(pedido.status)}
                          </span>
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: textMuted }}>
                          {formatDate(pedido.created_at)}
                        </p>
                      </div>
                      <span className="text-sm font-semibold whitespace-nowrap" style={{ color: roseGold }}>
                        {formatCurrency(pedido.valor_total)}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="border-t px-4 py-3 space-y-3" style={{ borderColor: '#F0E6E0', backgroundColor: '#FDFBF9' }}>
                        {!itens ? (
                          <div className="flex justify-center py-3">
                            <Loader2 className="w-4 h-4 animate-spin" style={{ color: roseGold }} />
                          </div>
                        ) : (
                          <>
                            {itens.map(item => (
                              <div key={item.id} className="flex items-center gap-3">
                                <div className="w-12 h-12 flex-shrink-0 overflow-hidden" style={{ backgroundColor: '#F5EEEA' }}>
                                  {item.peca_imagem_url ? (
                                    <img src={item.peca_imagem_url} alt={item.peca_nome} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Package className="w-4 h-4" style={{ color: roseGoldLight }} />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate" style={{ color: textDark }}>{item.peca_nome}</p>
                                  <p className="text-[10px]" style={{ color: textMuted }}>{item.peca_codigo} • Qtd: {item.quantidade}</p>
                                </div>
                                <span className="text-xs font-medium" style={{ color: textDark }}>
                                  {formatCurrency(item.preco_unitario * item.quantidade)}
                                </span>
                              </div>
                            ))}
                            <Separator style={{ backgroundColor: '#F0E6E0' }} />
                            <div className="flex justify-between text-xs">
                              <span style={{ color: textMuted }}>Frete</span>
                              <span style={{ color: textDark }}>{pedido.valor_frete === 0 ? 'Grátis' : formatCurrency(pedido.valor_frete)}</span>
                            </div>
                            <div className="flex justify-between text-sm font-semibold">
                              <span style={{ color: textDark }}>Total</span>
                              <span style={{ color: roseGold }}>{formatCurrency(pedido.valor_total)}</span>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
