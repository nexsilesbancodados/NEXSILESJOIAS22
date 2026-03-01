import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { format, subDays, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Search, Plus, Users, TrendingUp, BarChart3, Target, Filter,
  ArrowRight, ArrowUpRight, ArrowDownRight, Eye, Edit, Trash2,
  Phone, Mail, Globe, Tag, Calendar, MessageSquare, CheckCircle,
  XCircle, Clock, Zap, DollarSign, Activity, Loader2, RefreshCw,
  Megaphone, UserPlus, ShoppingCart, Bot, Sparkles
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, FunnelChart, Funnel, LabelList } from 'recharts';

// Types
interface CRMLead {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  empresa: string | null;
  origem: string;
  status: string;
  valor_potencial: number;
  tags: string[];
  notas: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  plano_interesse: string | null;
  score: number;
  ultimo_contato_em: string | null;
  created_at: string;
  updated_at: string;
}

interface CRMAtividade {
  id: string;
  lead_id: string;
  tipo: string;
  titulo: string;
  descricao: string | null;
  realizado_por: string | null;
  created_at: string;
}

interface CRMConversao {
  id: string;
  lead_id: string | null;
  evento: string;
  valor: number;
  metadata: any;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  novo: { label: 'Novo', color: 'bg-blue-500/15 text-blue-500 border-blue-500/25', icon: UserPlus },
  contato: { label: 'Contato', color: 'bg-amber-500/15 text-amber-500 border-amber-500/25', icon: Phone },
  negociacao: { label: 'Negociação', color: 'bg-purple-500/15 text-purple-500 border-purple-500/25', icon: MessageSquare },
  qualificado: { label: 'Qualificado', color: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/25', icon: CheckCircle },
  convertido: { label: 'Convertido', color: 'bg-green-500/15 text-green-500 border-green-500/25', icon: DollarSign },
  perdido: { label: 'Perdido', color: 'bg-red-500/15 text-red-500 border-red-500/25', icon: XCircle },
};

const ORIGEM_LABELS: Record<string, { label: string; icon: any }> = {
  signup: { label: 'Cadastro', icon: UserPlus },
  landing_page: { label: 'Landing Page', icon: Globe },
  ecommerce: { label: 'E-commerce', icon: ShoppingCart },
  manual: { label: 'Manual', icon: Edit },
  whatsapp: { label: 'WhatsApp', icon: MessageSquare },
};

const PIE_COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

// ============= SUB-COMPONENTS =============

function CRMStatCard({ icon: Icon, label, value, change, color }: {
  icon: any; label: string; value: string | number; change?: { value: number; label: string }; color: string;
}) {
  const colorMap: Record<string, string> = {
    primary: 'from-primary/20 to-primary/5 border-primary/20',
    emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20',
    amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/20',
    blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/20',
    violet: 'from-violet-500/20 to-violet-500/5 border-violet-500/20',
    rose: 'from-rose-500/20 to-rose-500/5 border-rose-500/20',
  };
  const iconMap: Record<string, string> = {
    primary: 'text-primary', emerald: 'text-emerald-400', amber: 'text-amber-400',
    blue: 'text-blue-400', violet: 'text-violet-400', rose: 'text-rose-400',
  };

  return (
    <Card className={`bg-gradient-to-br ${colorMap[color]} border overflow-hidden`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {change && (
              <div className="flex items-center gap-1 text-xs">
                {change.value >= 0 ? (
                  <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 text-red-400" />
                )}
                <span className={change.value >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {Math.abs(change.value)}%
                </span>
                <span className="text-muted-foreground">{change.label}</span>
              </div>
            )}
          </div>
          <div className={`w-10 h-10 rounded-xl bg-background/50 flex items-center justify-center ${iconMap[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============= PIPELINE TAB =============
function PipelineTab({ leads, onEditLead, onViewLead, refetch }: {
  leads: CRMLead[]; onEditLead: (l: CRMLead) => void; onViewLead: (l: CRMLead) => void; refetch: () => void;
}) {
  const queryClient = useQueryClient();
  const stages = ['novo', 'contato', 'negociacao', 'qualificado', 'convertido', 'perdido'];

  const moveLeadMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('crm_leads' as any).update({ status } as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
      toast.success('Lead movido!');
    },
  });

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-[1200px]">
        {stages.map(stage => {
          const stageLeads = leads.filter(l => l.status === stage);
          const cfg = STATUS_CONFIG[stage];
          return (
            <div key={stage} className="flex-1 min-w-[200px]">
              <div className="flex items-center gap-2 mb-3 px-1">
                <cfg.icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">{cfg.label}</span>
                <Badge variant="secondary" className="text-xs ml-auto">{stageLeads.length}</Badge>
              </div>
              <div className="space-y-2 min-h-[200px] bg-muted/20 rounded-xl p-2">
                {stageLeads.map(lead => (
                  <Card key={lead.id} className="bg-card border-border/50 hover:border-primary/30 transition-colors cursor-pointer group">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-1">
                        <p className="text-sm font-medium text-foreground truncate">{lead.nome}</p>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => onViewLead(lead)} className="p-1 hover:bg-muted rounded"><Eye className="w-3 h-3" /></button>
                          <button onClick={() => onEditLead(lead)} className="p-1 hover:bg-muted rounded"><Edit className="w-3 h-3" /></button>
                        </div>
                      </div>
                      {lead.email && <p className="text-xs text-muted-foreground truncate">{lead.email}</p>}
                      <div className="flex items-center gap-2 mt-2">
                        {lead.origem && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {ORIGEM_LABELS[lead.origem]?.label || lead.origem}
                          </Badge>
                        )}
                        {lead.valor_potencial > 0 && (
                          <span className="text-[10px] text-emerald-400 font-medium">
                            R$ {lead.valor_potencial}
                          </span>
                        )}
                      </div>
                      {lead.score > 0 && (
                        <div className="mt-2 flex items-center gap-1">
                          <div className="h-1 flex-1 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(lead.score, 100)}%` }} />
                          </div>
                          <span className="text-[10px] text-muted-foreground">{lead.score}</span>
                        </div>
                      )}
                      {/* Quick move buttons */}
                      <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {stages.filter(s => s !== stage).slice(0, 3).map(s => (
                          <button
                            key={s}
                            onClick={(e) => { e.stopPropagation(); moveLeadMutation.mutate({ id: lead.id, status: s }); }}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-muted hover:bg-muted-foreground/10 text-muted-foreground"
                          >
                            → {STATUS_CONFIG[s].label}
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============= CONVERSIONS TAB =============
function ConversionsTab({ conversoes, leads }: { conversoes: CRMConversao[]; leads: CRMLead[] }) {
  const funnelData = useMemo(() => {
    const stages = [
      { name: 'Visitas Landing', value: conversoes.filter(c => c.evento === 'visita_landing').length || leads.length * 3 },
      { name: 'Cadastros', value: conversoes.filter(c => c.evento === 'cadastro').length || leads.filter(l => l.origem === 'signup').length },
      { name: 'Início Trial', value: conversoes.filter(c => c.evento === 'inicio_trial').length || leads.filter(l => l.status === 'qualificado' || l.status === 'convertido').length },
      { name: 'Pagamento', value: conversoes.filter(c => c.evento === 'pagamento').length || leads.filter(l => l.status === 'convertido').length },
    ];
    return stages;
  }, [conversoes, leads]);

  const conversionRates = useMemo(() => {
    const rates = [];
    for (let i = 1; i < funnelData.length; i++) {
      const prev = funnelData[i - 1].value;
      const curr = funnelData[i].value;
      rates.push({
        from: funnelData[i - 1].name,
        to: funnelData[i].name,
        rate: prev > 0 ? ((curr / prev) * 100).toFixed(1) : '0',
      });
    }
    return rates;
  }, [funnelData]);

  // Time series for conversions
  const timeSeriesData = useMemo(() => {
    const last30 = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayConversoes = conversoes.filter(c => c.created_at.startsWith(dateStr));
      const dayLeads = leads.filter(l => l.created_at.startsWith(dateStr));
      return {
        date: format(date, 'dd/MM'),
        leads: dayLeads.length || dayConversoes.filter(c => c.evento === 'cadastro').length,
        conversoes: dayConversoes.filter(c => c.evento === 'pagamento').length,
      };
    });
    return last30;
  }, [conversoes, leads]);

  // Source breakdown
  const sourceData = useMemo(() => {
    const map: Record<string, number> = {};
    leads.forEach(l => {
      const src = l.utm_source || l.origem || 'direto';
      map[src] = (map[src] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [leads]);

  const totalLeads = leads.length;
  const convertidos = leads.filter(l => l.status === 'convertido').length;
  const taxaGeral = totalLeads > 0 ? ((convertidos / totalLeads) * 100).toFixed(1) : '0';
  const valorTotal = leads.filter(l => l.status === 'convertido').reduce((s, l) => s + (l.valor_potencial || 0), 0);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <CRMStatCard icon={Users} label="Total Leads" value={totalLeads} color="blue" />
        <CRMStatCard icon={Target} label="Taxa Conversão" value={`${taxaGeral}%`} color="emerald" />
        <CRMStatCard icon={DollarSign} label="Receita Convertida" value={`R$ ${valorTotal.toLocaleString()}`} color="violet" />
        <CRMStatCard icon={TrendingUp} label="Convertidos" value={convertidos} color="amber" />
      </div>

      {/* Funnel */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Funil de Conversão</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {funnelData.map((stage, i) => {
              const maxVal = funnelData[0].value || 1;
              const pct = (stage.value / maxVal) * 100;
              return (
                <div key={stage.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-foreground">{stage.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">{stage.value}</span>
                      {i > 0 && conversionRates[i - 1] && (
                        <Badge variant="outline" className="text-[10px]">
                          {conversionRates[i - 1].rate}%
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="h-6 bg-muted rounded-lg overflow-hidden">
                    <div
                      className="h-full rounded-lg transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${PIE_COLORS[i]}, ${PIE_COLORS[i]}88)`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time series */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Leads vs Conversões (30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <RechartsTooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Area type="monotone" dataKey="leads" stackId="1" fill="#8b5cf6" stroke="#8b5cf6" fillOpacity={0.3} name="Leads" />
                  <Area type="monotone" dataKey="conversoes" stackId="2" fill="#10b981" stroke="#10b981" fillOpacity={0.3} name="Conversões" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Source breakdown */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Origem dos Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {sourceData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-2 justify-center">
              {sourceData.map((s, i) => (
                <div key={s.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-muted-foreground">{s.name} ({s.value})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion rates between stages */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Taxas entre Etapas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {conversionRates.map((cr) => (
              <div key={cr.from + cr.to} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                <span className="text-xs text-muted-foreground">{cr.from}</span>
                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{cr.to}</span>
                <Badge className="bg-primary/15 text-primary border-primary/25 text-xs">{cr.rate}%</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============= CONTACTS TAB =============
function ContactsTab({ leads, onEditLead, onViewLead }: {
  leads: CRMLead[]; onEditLead: (l: CRMLead) => void; onViewLead: (l: CRMLead) => void;
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [origemFilter, setOrigemFilter] = useState('todos');

  const filtered = useMemo(() => {
    return leads.filter(l => {
      const matchSearch = !search ||
        l.nome.toLowerCase().includes(search.toLowerCase()) ||
        l.email?.toLowerCase().includes(search.toLowerCase()) ||
        l.telefone?.includes(search);
      const matchStatus = statusFilter === 'todos' || l.status === statusFilter;
      const matchOrigem = origemFilter === 'todos' || l.origem === origemFilter;
      return matchSearch && matchStatus && matchOrigem;
    });
  }, [leads, search, statusFilter, origemFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar leads..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos Status</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={origemFilter} onValueChange={setOrigemFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas Origens</SelectItem>
            {Object.entries(ORIGEM_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {filtered.map(lead => {
          const cfg = STATUS_CONFIG[lead.status] || STATUS_CONFIG.novo;
          return (
            <Card key={lead.id} className="border-border/50 hover:border-primary/20 transition-colors">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">
                    {lead.nome.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{lead.nome}</p>
                    <Badge className={`${cfg.color} text-[10px]`}>{cfg.label}</Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {lead.email && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {lead.email}
                      </span>
                    )}
                    {lead.telefone && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {lead.telefone}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[10px]">
                      {ORIGEM_LABELS[lead.origem]?.label || lead.origem}
                    </Badge>
                    {lead.utm_campaign && (
                      <Badge variant="outline" className="text-[10px]">
                        <Megaphone className="w-2.5 h-2.5 mr-0.5" /> {lead.utm_campaign}
                      </Badge>
                    )}
                    {lead.plano_interesse && (
                      <Badge variant="outline" className="text-[10px]">
                        {lead.plano_interesse}
                      </Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {format(new Date(lead.created_at), "dd/MM/yy HH:mm")}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onViewLead(lead)}>
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEditLead(lead)}>
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhum lead encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============= CAMPAIGNS TAB =============
function CampaignsTab({ leads, conversoes }: { leads: CRMLead[]; conversoes: CRMConversao[] }) {
  const campaignData = useMemo(() => {
    const map: Record<string, { leads: number; conversoes: number; valor: number; source: string; medium: string }> = {};
    leads.forEach(l => {
      const campaign = l.utm_campaign || 'sem_campanha';
      if (!map[campaign]) map[campaign] = { leads: 0, conversoes: 0, valor: 0, source: l.utm_source || '-', medium: l.utm_medium || '-' };
      map[campaign].leads++;
      if (l.status === 'convertido') {
        map[campaign].conversoes++;
        map[campaign].valor += l.valor_potencial || 0;
      }
    });
    return Object.entries(map).map(([campaign, data]) => ({
      campaign,
      ...data,
      taxa: data.leads > 0 ? ((data.conversoes / data.leads) * 100).toFixed(1) : '0',
    })).sort((a, b) => b.leads - a.leads);
  }, [leads]);

  const sourceBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    leads.forEach(l => {
      const src = l.utm_source || 'direto';
      map[src] = (map[src] || 0) + 1;
    });
    return Object.entries(map).map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count);
  }, [leads]);

  const mediumBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    leads.forEach(l => {
      const m = l.utm_medium || 'direto';
      map[m] = (map[m] || 0) + 1;
    });
    return Object.entries(map).map(([medium, count]) => ({ medium, count })).sort((a, b) => b.count - a.count);
  }, [leads]);

  return (
    <div className="space-y-6">
      {/* Source & Medium breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="w-4 h-4" /> Por Origem (utm_source)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sourceBreakdown} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis dataKey="source" type="category" tick={{ fontSize: 10 }} width={80} stroke="hsl(var(--muted-foreground))" />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Megaphone className="w-4 h-4" /> Por Mídia (utm_medium)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mediumBreakdown} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis dataKey="medium" type="category" tick={{ fontSize: 10 }} width={80} stroke="hsl(var(--muted-foreground))" />
                  <Bar dataKey="count" fill="#ec4899" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Campanhas (utm_campaign)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Campanha</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Source</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Medium</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Leads</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Conversões</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Taxa</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Valor</th>
                </tr>
              </thead>
              <tbody>
                {campaignData.map(c => (
                  <tr key={c.campaign} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2 px-3 font-medium text-foreground">{c.campaign}</td>
                    <td className="py-2 px-3 text-muted-foreground">{c.source}</td>
                    <td className="py-2 px-3 text-muted-foreground">{c.medium}</td>
                    <td className="py-2 px-3 text-right text-foreground">{c.leads}</td>
                    <td className="py-2 px-3 text-right text-emerald-400">{c.conversoes}</td>
                    <td className="py-2 px-3 text-right">
                      <Badge variant="outline" className="text-[10px]">{c.taxa}%</Badge>
                    </td>
                    <td className="py-2 px-3 text-right text-foreground font-medium">R$ {c.valor.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============= MAIN CRM PAGE =============
export default function CRMPage() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('pipeline');
  const [editDialog, setEditDialog] = useState<CRMLead | null>(null);
  const [viewDialog, setViewDialog] = useState<CRMLead | null>(null);
  const [newLeadDialog, setNewLeadDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    nome: '', email: '', telefone: '', empresa: '', status: 'novo', origem: 'manual',
    valor_potencial: '0', notas: '', plano_interesse: '', tags: '',
    utm_source: '', utm_medium: '', utm_campaign: '',
  });

  const isSuperAdmin = profile?.is_super_admin === true;

  // All hooks must be above this guard


  // Fetch leads
  const { data: leads = [], isLoading: leadsLoading, refetch: refetchLeads } = useQuery({
    queryKey: ['crm-leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_leads' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as CRMLead[];
    },
    enabled: isSuperAdmin,
  });

  // Fetch conversoes
  const { data: conversoes = [] } = useQuery({
    queryKey: ['crm-conversoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_conversoes' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as CRMConversao[];
    },
    enabled: isSuperAdmin,
  });

  // Fetch activities for view dialog
  const { data: atividades = [] } = useQuery({
    queryKey: ['crm-atividades', viewDialog?.id],
    queryFn: async () => {
      if (!viewDialog?.id) return [];
      const { data, error } = await supabase
        .from('crm_atividades' as any)
        .select('*')
        .eq('lead_id', viewDialog.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as CRMAtividade[];
    },
    enabled: !!viewDialog?.id,
  });

  // Create/Update lead mutation
  const saveLead = useMutation({
    mutationFn: async (isNew: boolean) => {
      const payload = {
        nome: editForm.nome,
        email: editForm.email || null,
        telefone: editForm.telefone || null,
        empresa: editForm.empresa || null,
        status: editForm.status,
        origem: editForm.origem,
        valor_potencial: parseFloat(editForm.valor_potencial) || 0,
        notas: editForm.notas || null,
        plano_interesse: editForm.plano_interesse || null,
        tags: editForm.tags ? editForm.tags.split(',').map(t => t.trim()) : [],
        utm_source: editForm.utm_source || null,
        utm_medium: editForm.utm_medium || null,
        utm_campaign: editForm.utm_campaign || null,
      };

      if (isNew) {
        const { error } = await supabase.from('crm_leads' as any).insert(payload as any);
        if (error) throw error;
      } else if (editDialog) {
        const { error } = await supabase.from('crm_leads' as any).update(payload as any).eq('id', editDialog.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
      toast.success(editDialog ? 'Lead atualizado!' : 'Lead criado!');
      setEditDialog(null);
      setNewLeadDialog(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Add activity mutation
  const addActivity = useMutation({
    mutationFn: async ({ lead_id, titulo, tipo }: { lead_id: string; titulo: string; tipo: string }) => {
      const { error } = await supabase.from('crm_atividades' as any).insert({
        lead_id, titulo, tipo, realizado_por: profile?.nome || 'Admin',
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-atividades'] });
      toast.success('Atividade adicionada!');
    },
  });

  // Delete lead
  const deleteLead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('crm_leads' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
      toast.success('Lead excluído!');
      setViewDialog(null);
    },
  });

  const openNewLead = () => {
    setEditForm({
      nome: '', email: '', telefone: '', empresa: '', status: 'novo', origem: 'manual',
      valor_potencial: '0', notas: '', plano_interesse: '', tags: '',
      utm_source: '', utm_medium: '', utm_campaign: '',
    });
    setNewLeadDialog(true);
  };

  const openEditLead = (lead: CRMLead) => {
    setEditForm({
      nome: lead.nome, email: lead.email || '', telefone: lead.telefone || '',
      empresa: lead.empresa || '', status: lead.status, origem: lead.origem,
      valor_potencial: String(lead.valor_potencial), notas: lead.notas || '',
      plano_interesse: lead.plano_interesse || '', tags: lead.tags?.join(', ') || '',
      utm_source: lead.utm_source || '', utm_medium: lead.utm_medium || '',
      utm_campaign: lead.utm_campaign || '',
    });
    setEditDialog(lead);
  };

  // Stats
  const stats = useMemo(() => {
    const novos = leads.filter(l => l.status === 'novo').length;
    const emNegociacao = leads.filter(l => l.status === 'negociacao').length;
    const convertidos = leads.filter(l => l.status === 'convertido').length;
    const valorPipeline = leads.filter(l => !['convertido', 'perdido'].includes(l.status))
      .reduce((s, l) => s + (l.valor_potencial || 0), 0);
    return { total: leads.length, novos, emNegociacao, convertidos, valorPipeline };
  }, [leads]);
  const [noteText, setNoteText] = useState('');

  if (!isSuperAdmin) return <Navigate to="/" replace />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" /> CRM
          </h1>
          <p className="text-sm text-muted-foreground">Pipeline de leads, conversões e campanhas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetchLeads()} className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Atualizar
          </Button>
          <Button size="sm" onClick={openNewLead} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Novo Lead
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <CRMStatCard icon={Users} label="Total Leads" value={stats.total} color="blue" />
        <CRMStatCard icon={UserPlus} label="Novos" value={stats.novos} color="violet" />
        <CRMStatCard icon={MessageSquare} label="Negociação" value={stats.emNegociacao} color="amber" />
        <CRMStatCard icon={CheckCircle} label="Convertidos" value={stats.convertidos} color="emerald" />
        <CRMStatCard icon={DollarSign} label="Pipeline" value={`R$ ${stats.valorPipeline.toLocaleString()}`} color="rose" />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="pipeline" className="gap-1.5"><Activity className="w-3.5 h-3.5" /> Pipeline</TabsTrigger>
          <TabsTrigger value="conversoes" className="gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> Conversões</TabsTrigger>
          <TabsTrigger value="contatos" className="gap-1.5"><Users className="w-3.5 h-3.5" /> Contatos</TabsTrigger>
          <TabsTrigger value="campanhas" className="gap-1.5"><Megaphone className="w-3.5 h-3.5" /> Campanhas</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline">
          {leadsLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <PipelineTab leads={leads} onEditLead={openEditLead} onViewLead={setViewDialog} refetch={refetchLeads} />
          )}
        </TabsContent>

        <TabsContent value="conversoes">
          <ConversionsTab conversoes={conversoes} leads={leads} />
        </TabsContent>

        <TabsContent value="contatos">
          <ContactsTab leads={leads} onEditLead={openEditLead} onViewLead={setViewDialog} />
        </TabsContent>

        <TabsContent value="campanhas">
          <CampaignsTab leads={leads} conversoes={conversoes} />
        </TabsContent>
      </Tabs>

      {/* New/Edit Lead Dialog */}
      <Dialog open={newLeadDialog || !!editDialog} onOpenChange={(open) => { if (!open) { setNewLeadDialog(false); setEditDialog(null); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editDialog ? 'Editar Lead' : 'Novo Lead'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Nome *</Label>
                <Input value={editForm.nome} onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Telefone</Label>
                <Input value={editForm.telefone} onChange={(e) => setEditForm({ ...editForm, telefone: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Empresa</Label>
                <Input value={editForm.empresa} onChange={(e) => setEditForm({ ...editForm, empresa: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Origem</Label>
                <Select value={editForm.origem} onValueChange={(v) => setEditForm({ ...editForm, origem: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ORIGEM_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Valor Potencial (R$)</Label>
                <Input type="number" value={editForm.valor_potencial} onChange={(e) => setEditForm({ ...editForm, valor_potencial: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Plano de Interesse</Label>
                <Input value={editForm.plano_interesse} onChange={(e) => setEditForm({ ...editForm, plano_interesse: e.target.value })} placeholder="Ex: Nexsiles Ysis" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tags (separadas por vírgula)</Label>
              <Input value={editForm.tags} onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })} placeholder="meta-ads, semijoias, sp" />
            </div>
            <Separator />
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">utm_source</Label>
                <Input value={editForm.utm_source} onChange={(e) => setEditForm({ ...editForm, utm_source: e.target.value })} placeholder="facebook" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">utm_medium</Label>
                <Input value={editForm.utm_medium} onChange={(e) => setEditForm({ ...editForm, utm_medium: e.target.value })} placeholder="cpc" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">utm_campaign</Label>
                <Input value={editForm.utm_campaign} onChange={(e) => setEditForm({ ...editForm, utm_campaign: e.target.value })} placeholder="lancamento_marco" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Notas</Label>
              <Textarea value={editForm.notas} onChange={(e) => setEditForm({ ...editForm, notas: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setNewLeadDialog(false); setEditDialog(null); }}>Cancelar</Button>
            <Button onClick={() => saveLead.mutate(!editDialog)} disabled={!editForm.nome || saveLead.isPending}>
              {saveLead.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              {editDialog ? 'Salvar' : 'Criar Lead'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Lead Dialog */}
      <Dialog open={!!viewDialog} onOpenChange={(open) => { if (!open) setViewDialog(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {viewDialog && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {viewDialog.nome}
                  <Badge className={STATUS_CONFIG[viewDialog.status]?.color || ''}>
                    {STATUS_CONFIG[viewDialog.status]?.label || viewDialog.status}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {viewDialog.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-3.5 h-3.5" /> {viewDialog.email}
                    </div>
                  )}
                  {viewDialog.telefone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-3.5 h-3.5" /> {viewDialog.telefone}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Globe className="w-3.5 h-3.5" /> {ORIGEN_LABELS_SAFE(viewDialog.origem)}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" /> {format(new Date(viewDialog.created_at), "dd/MM/yyyy")}
                  </div>
                  {viewDialog.valor_potencial > 0 && (
                    <div className="flex items-center gap-2 text-emerald-400 font-medium">
                      <DollarSign className="w-3.5 h-3.5" /> R$ {viewDialog.valor_potencial}
                    </div>
                  )}
                  {viewDialog.utm_campaign && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Megaphone className="w-3.5 h-3.5" /> {viewDialog.utm_campaign}
                    </div>
                  )}
                </div>

                {viewDialog.tags && viewDialog.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {viewDialog.tags.map(t => (
                      <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                    ))}
                  </div>
                )}

                {viewDialog.notas && (
                  <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
                    {viewDialog.notas}
                  </div>
                )}

                <Separator />

                {/* Activities */}
                <div>
                  <h4 className="text-sm font-semibold mb-3">Atividades</h4>
                  <div className="flex gap-2 mb-3">
                    <Input 
                      placeholder="Adicionar nota..." 
                      value={noteText} 
                      onChange={(e) => setNoteText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && noteText.trim()) {
                          addActivity.mutate({ lead_id: viewDialog.id, titulo: noteText, tipo: 'nota' });
                          setNoteText('');
                        }
                      }}
                    />
                    <Button size="sm" variant="secondary" onClick={() => {
                      if (noteText.trim()) {
                        addActivity.mutate({ lead_id: viewDialog.id, titulo: noteText, tipo: 'nota' });
                        setNoteText('');
                      }
                    }}>
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {atividades.map(a => (
                      <div key={a.id} className="flex items-start gap-2 text-xs">
                        <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                          <MessageSquare className="w-2.5 h-2.5" />
                        </div>
                        <div>
                          <p className="text-foreground">{a.titulo}</p>
                          <p className="text-muted-foreground">{a.realizado_por} · {format(new Date(a.created_at), "dd/MM HH:mm")}</p>
                        </div>
                      </div>
                    ))}
                    {atividades.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">Nenhuma atividade registrada</p>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="destructive" size="sm" onClick={() => deleteLead.mutate(viewDialog.id)}>
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Excluir
                </Button>
                <Button size="sm" onClick={() => { openEditLead(viewDialog); setViewDialog(null); }}>
                  <Edit className="w-3.5 h-3.5 mr-1" /> Editar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ORIGEN_LABELS_SAFE(origem: string): string {
  return ORIGEM_LABELS[origem]?.label || origem;
}
