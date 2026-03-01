import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { format, subDays, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Search, Plus, Users, TrendingUp, BarChart3, Target, Filter,
  ArrowRight, ArrowUpRight, ArrowDownRight, Eye, Edit, Trash2,
  Phone, Mail, Globe, Tag, Calendar, MessageSquare, CheckCircle,
  XCircle, Clock, Zap, DollarSign, Activity, Loader2, RefreshCw,
  Megaphone, UserPlus, ShoppingCart, Bot, Sparkles,
  ArrowLeft, ChevronLeft, ChevronRight, LayoutDashboard,
  FileDown, Star, History, Gauge, Download, FileText,
  TrendingDown, Percent, Timer, Award, Send, Link2, MousePointerClick,
  BarChart2, ExternalLink, Smartphone
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { cn } from '@/lib/utils';

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

// ============= NAV ITEMS =============
type Section = 'overview' | 'pipeline' | 'conversoes' | 'contatos' | 'campanhas' | 'metricas' | 'scoring' | 'timeline' | 'relatorios' | 'whatsapp' | 'site_analytics' | 'automacoes';

const NAV_ITEMS: { id: Section; label: string; icon: typeof LayoutDashboard; description: string }[] = [
  { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard, description: 'KPIs e resumo' },
  { id: 'pipeline', label: 'Pipeline', icon: Activity, description: 'Kanban de leads' },
  { id: 'conversoes', label: 'Conversões', icon: TrendingUp, description: 'Funil e métricas' },
  { id: 'contatos', label: 'Contatos', icon: Users, description: 'Lista de leads' },
  { id: 'whatsapp', label: 'WhatsApp Leads', icon: Smartphone, description: 'Leads do WhatsApp' },
  { id: 'site_analytics', label: 'Analytics Site', icon: BarChart2, description: 'Landing page e site' },
  { id: 'campanhas', label: 'Campanhas', icon: Megaphone, description: 'UTM e origens' },
  { id: 'metricas', label: 'Métricas', icon: Gauge, description: 'LTV, Churn, CAC, MRR' },
  { id: 'scoring', label: 'Scoring', icon: Award, description: 'Pontuação de leads' },
  { id: 'automacoes', label: 'Automações', icon: Zap, description: 'Follow-ups e gatilhos' },
  { id: 'timeline', label: 'Timeline', icon: History, description: 'Feed de atividades' },
  { id: 'relatorios', label: 'Relatórios', icon: FileDown, description: 'Exportar dados' },
];

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

// ============= OVERVIEW TAB =============
function OverviewTab({ leads, conversoes, stats }: { leads: CRMLead[]; conversoes: CRMConversao[]; stats: any }) {
  const chartData = useMemo(() => {
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      const day = format(d, 'dd/MM');
      const leadsCount = leads.filter(l => format(new Date(l.created_at), 'dd/MM') === day).length;
      const convsCount = conversoes.filter(c => format(new Date(c.created_at), 'dd/MM') === day).length;
      return { dia: day, leads: leadsCount, conversoes: convsCount };
    });
    return last7;
  }, [leads, conversoes]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <CRMStatCard icon={Users} label="Total Leads" value={stats.total} color="blue" />
        <CRMStatCard icon={UserPlus} label="Novos" value={stats.novos} color="violet" />
        <CRMStatCard icon={MessageSquare} label="Negociação" value={stats.emNegociacao} color="amber" />
        <CRMStatCard icon={CheckCircle} label="Convertidos" value={stats.convertidos} color="emerald" />
        <CRMStatCard icon={DollarSign} label="Pipeline" value={`R$ ${stats.valorPipeline.toLocaleString()}`} color="rose" />
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm">Leads vs Conversões (7 dias)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="dia" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <RechartsTooltip />
              <Area type="monotone" dataKey="leads" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.2)" />
              <Area type="monotone" dataKey="conversoes" stroke="#10b981" fill="rgba(16,185,129,0.2)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
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

  const timelineData = useMemo(() => {
    const last30 = Array.from({ length: 30 }, (_, i) => {
      const d = subDays(new Date(), 29 - i);
      const day = format(d, 'dd/MM');
      return {
        dia: day,
        cadastros: conversoes.filter(c => c.evento === 'cadastro' && format(new Date(c.created_at), 'dd/MM') === day).length,
        pagamentos: conversoes.filter(c => c.evento === 'pagamento' && format(new Date(c.created_at), 'dd/MM') === day).length,
      };
    });
    return last30;
  }, [conversoes]);

  return (
    <div className="space-y-6">
      {/* Funnel */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-sm">Funil de Conversão</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {funnelData.map((stage, i) => (
              <div key={stage.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">{stage.name}</span>
                  <span className="text-sm font-bold text-foreground">{stage.value}</span>
                </div>
                <div className="h-8 bg-muted rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-lg flex items-center justify-end pr-3 transition-all"
                    style={{ width: `${funnelData[0].value > 0 ? (stage.value / funnelData[0].value) * 100 : 0}%` }}
                  >
                    {funnelData[0].value > 0 && (
                      <span className="text-[10px] font-medium text-primary-foreground">
                        {((stage.value / funnelData[0].value) * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
                {i < conversionRates.length && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <ArrowRight className="w-3 h-3" />
                    <span>Taxa: <strong className="text-foreground">{conversionRates[i].rate}%</strong></span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-sm">Cadastros vs Pagamentos (30 dias)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="dia" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} interval={4} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <RechartsTooltip />
              <Bar dataKey="cadastros" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
              <Bar dataKey="pagamentos" fill="#10b981" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
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
  const [filterOrigem, setFilterOrigem] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      const matchSearch = !search || l.nome.toLowerCase().includes(search.toLowerCase()) ||
        (l.email && l.email.toLowerCase().includes(search.toLowerCase()));
      const matchOrigem = filterOrigem === 'all' || l.origem === filterOrigem;
      const matchStatus = filterStatus === 'all' || l.status === filterStatus;
      return matchSearch && matchOrigem && matchStatus;
    });
  }, [leads, search, filterOrigem, filterStatus]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterOrigem} onValueChange={setFilterOrigem}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Origem" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas origens</SelectItem>
            {Object.entries(ORIGEM_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Nome</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Email</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Origem</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Score</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Valor</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map(lead => (
                  <tr key={lead.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-medium text-foreground">{lead.nome}</td>
                    <td className="py-3 px-4 text-muted-foreground">{lead.email || '-'}</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="text-[10px]">
                        {ORIGEM_LABELS[lead.origem]?.label || lead.origem}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={STATUS_CONFIG[lead.status]?.color || ''}>
                        {STATUS_CONFIG[lead.status]?.label || lead.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right text-foreground">{lead.score}</td>
                    <td className="py-3 px-4 text-right text-emerald-400 font-medium">
                      {lead.valor_potencial > 0 ? `R$ ${lead.valor_potencial}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => onViewLead(lead)} className="p-1.5 hover:bg-muted rounded-md"><Eye className="w-3.5 h-3.5 text-muted-foreground" /></button>
                        <button onClick={() => onEditLead(lead)} className="p-1.5 hover:bg-muted rounded-md"><Edit className="w-3.5 h-3.5 text-muted-foreground" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredLeads.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-12">Nenhum lead encontrado</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============= CAMPAIGNS TAB =============
function CampaignsTab({ leads, conversoes }: { leads: CRMLead[]; conversoes: CRMConversao[] }) {
  const origemData = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach(l => { counts[l.origem] = (counts[l.origem] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({
      name: ORIGEM_LABELS[name]?.label || name,
      value,
    }));
  }, [leads]);

  const campaignData = useMemo(() => {
    const campaigns: Record<string, { source: string; medium: string; leads: number; conversoes: number; valor: number }> = {};
    leads.forEach(l => {
      if (l.utm_campaign) {
        if (!campaigns[l.utm_campaign]) {
          campaigns[l.utm_campaign] = { source: l.utm_source || '-', medium: l.utm_medium || '-', leads: 0, conversoes: 0, valor: 0 };
        }
        campaigns[l.utm_campaign].leads++;
        if (l.status === 'convertido') {
          campaigns[l.utm_campaign].conversoes++;
          campaigns[l.utm_campaign].valor += l.valor_potencial || 0;
        }
      }
    });
    return Object.entries(campaigns).map(([campaign, data]) => ({
      campaign,
      ...data,
      taxa: data.leads > 0 ? ((data.conversoes / data.leads) * 100).toFixed(1) : '0',
    }));
  }, [leads]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-sm">Leads por Origem</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={origemData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
                  {origemData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-sm">Performance por Source</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={origemData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <RechartsTooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-sm">Campanhas UTM</CardTitle>
          <CardDescription>Rastreamento de campanhas de marketing</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
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
                {campaignData.length === 0 && (
                  <tr><td colSpan={7} className="text-center text-muted-foreground py-8 text-sm">Nenhuma campanha com UTM rastreada</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
// ============= METRICS TAB =============
function MetricsTab({ leads, conversoes }: { leads: CRMLead[]; conversoes: CRMConversao[] }) {
  const metrics = useMemo(() => {
    const convertidos = leads.filter(l => l.status === 'convertido');
    const perdidos = leads.filter(l => l.status === 'perdido');
    const totalFinalizados = convertidos.length + perdidos.length;
    const mrr = convertidos.reduce((s, l) => s + (l.valor_potencial || 0), 0);
    const arr = mrr * 12;
    const churnRate = totalFinalizados > 0 ? ((perdidos.length / totalFinalizados) * 100).toFixed(1) : '0';
    const conversionRate = leads.length > 0 ? ((convertidos.length / leads.length) * 100).toFixed(1) : '0';
    const totalMarketingLeads = leads.filter(l => l.utm_source).length;
    const cac = convertidos.length > 0 ? Math.round(totalMarketingLeads * 15 / convertidos.length) : 0;
    const avgValue = convertidos.length > 0 ? convertidos.reduce((s, l) => s + (l.valor_potencial || 0), 0) / convertidos.length : 0;
    const ltv = avgValue * 12;
    const avgDeal = convertidos.length > 0 ? Math.round(mrr / convertidos.length) : 0;
    const avgTimeToConvert = convertidos.length > 0 ? Math.round(
      convertidos.reduce((s, l) => s + Math.max(differenceInDays(new Date(l.updated_at), new Date(l.created_at)), 1), 0) / convertidos.length
    ) : 0;
    return { mrr, arr, churnRate, conversionRate, cac, ltv, avgDeal, avgTimeToConvert };
  }, [leads]);

  const cohortData = useMemo(() => {
    const months: Record<string, { total: number; convertidos: number; perdidos: number }> = {};
    leads.forEach(l => {
      const month = format(new Date(l.created_at), 'MMM/yy', { locale: ptBR });
      if (!months[month]) months[month] = { total: 0, convertidos: 0, perdidos: 0 };
      months[month].total++;
      if (l.status === 'convertido') months[month].convertidos++;
      if (l.status === 'perdido') months[month].perdidos++;
    });
    return Object.entries(months).slice(-6).map(([month, data]) => ({ mes: month, ...data, taxa: data.total > 0 ? Math.round((data.convertidos / data.total) * 100) : 0 }));
  }, [leads]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <CRMStatCard icon={DollarSign} label="MRR" value={`R$ ${metrics.mrr.toLocaleString()}`} color="emerald" />
        <CRMStatCard icon={TrendingUp} label="ARR" value={`R$ ${metrics.arr.toLocaleString()}`} color="blue" />
        <CRMStatCard icon={TrendingDown} label="Churn Rate" value={`${metrics.churnRate}%`} color="rose" />
        <CRMStatCard icon={Percent} label="Conversão" value={`${metrics.conversionRate}%`} color="violet" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <CRMStatCard icon={Target} label="CAC" value={`R$ ${metrics.cac}`} color="amber" />
        <CRMStatCard icon={Star} label="LTV" value={`R$ ${Math.round(metrics.ltv).toLocaleString()}`} color="primary" />
        <CRMStatCard icon={DollarSign} label="Ticket Médio" value={`R$ ${metrics.avgDeal}`} color="emerald" />
        <CRMStatCard icon={Timer} label="Tempo Conversão" value={`${metrics.avgTimeToConvert}d`} color="blue" />
      </div>
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-sm">Razão LTV:CAC</CardTitle>
          <CardDescription>Ideal &gt; 3:1</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-4 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all" style={{ width: `${Math.min((metrics.cac > 0 ? metrics.ltv / metrics.cac : 0) / 5 * 100, 100)}%` }} />
              </div>
            </div>
            <span className="text-2xl font-bold text-foreground">{metrics.cac > 0 ? (metrics.ltv / metrics.cac).toFixed(1) : '∞'}:1</span>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-card">
        <CardHeader><CardTitle className="text-sm">Cohort por Mês</CardTitle></CardHeader>
        <CardContent>
          {cohortData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={cohortData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <RechartsTooltip />
                <Bar dataKey="total" fill="hsl(var(--primary)/0.3)" name="Total" radius={[4, 4, 0, 0]} />
                <Bar dataKey="convertidos" fill="#10b981" name="Convertidos" radius={[4, 4, 0, 0]} />
                <Bar dataKey="perdidos" fill="#ef4444" name="Perdidos" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-sm text-muted-foreground py-12">Sem dados</p>}
        </CardContent>
      </Card>
    </div>
  );
}

// ============= SCORING TAB =============
function ScoringTab({ leads }: { leads: CRMLead[] }) {
  const scoredLeads = useMemo(() => {
    return leads.map(l => {
      let s = 0;
      if (l.email) s += 10;
      if (l.telefone) s += 10;
      if (l.empresa) s += 5;
      if (l.utm_source) s += 15;
      if (l.plano_interesse) s += 20;
      if (l.valor_potencial > 0) s += 15;
      if (l.valor_potencial > 500) s += 10;
      if (l.tags?.length > 0) s += 5;
      if (l.status === 'contato') s += 10;
      if (l.status === 'negociacao') s += 25;
      if (l.status === 'qualificado') s += 35;
      if (l.status === 'convertido') s += 50;
      const days = differenceInDays(new Date(), new Date(l.created_at));
      if (days <= 7) s += 15; else if (days <= 30) s += 5;
      return { ...l, autoScore: Math.min(s, 100) };
    }).sort((a, b) => b.autoScore - a.autoScore);
  }, [leads]);

  const dist = useMemo(() => {
    const r = [
      { range: '0-20', label: 'Frio', count: 0 }, { range: '21-40', label: 'Morno', count: 0 },
      { range: '41-60', label: 'Quente', count: 0 }, { range: '61-80', label: 'Muito Quente', count: 0 },
      { range: '81-100', label: 'On Fire', count: 0 },
    ];
    scoredLeads.forEach(l => {
      if (l.autoScore <= 20) r[0].count++; else if (l.autoScore <= 40) r[1].count++;
      else if (l.autoScore <= 60) r[2].count++; else if (l.autoScore <= 80) r[3].count++; else r[4].count++;
    });
    return r;
  }, [scoredLeads]);

  const getScoreColor = (s: number) => s >= 80 ? 'text-red-500' : s >= 60 ? 'text-orange-500' : s >= 40 ? 'text-amber-500' : 'text-muted-foreground';
  const getScoreBg = (s: number) => s >= 80 ? 'bg-red-500' : s >= 60 ? 'bg-orange-500' : s >= 40 ? 'bg-amber-500' : 'bg-muted-foreground';

  return (
    <div className="space-y-6">
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><Award className="w-4 h-4 text-primary" /> Regras de Pontuação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {[{ rule: 'Tem email', pts: '+10' }, { rule: 'Tem telefone', pts: '+10' }, { rule: 'Empresa', pts: '+5' }, { rule: 'UTM (pago)', pts: '+15' },
              { rule: 'Plano interesse', pts: '+20' }, { rule: 'Valor > R$0', pts: '+15' }, { rule: 'Valor > R$500', pts: '+10' }, { rule: 'Tags', pts: '+5' },
              { rule: 'Em contato', pts: '+10' }, { rule: 'Negociação', pts: '+25' }, { rule: 'Qualificado', pts: '+35' }, { rule: 'Recente (<7d)', pts: '+15' },
            ].map(r => (
              <div key={r.rule} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
                <span className="text-muted-foreground">{r.rule}</span>
                <Badge variant="secondary" className="text-[10px]">{r.pts}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-5 gap-3">
        {dist.map(s => (
          <Card key={s.range} className="bg-card text-center">
            <CardContent className="p-3">
              <p className="text-lg font-bold text-foreground">{s.count}</p>
              <p className="text-[10px] text-muted-foreground uppercase">{s.label}</p>
              <p className="text-[10px] text-muted-foreground">{s.range} pts</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="bg-card">
        <CardHeader><CardTitle className="text-sm">Top Leads por Score</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Score</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Nome</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Status</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Origem</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Valor</th>
              </tr></thead>
              <tbody>
                {scoredLeads.slice(0, 20).map(lead => (
                  <tr key={lead.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <span className={`text-xs font-bold ${getScoreColor(lead.autoScore)}`}>{lead.autoScore}</span>
                        </div>
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${getScoreBg(lead.autoScore)}`} style={{ width: `${lead.autoScore}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-foreground">{lead.nome}</td>
                    <td className="py-3 px-4"><Badge className={STATUS_CONFIG[lead.status]?.color || ''}>{STATUS_CONFIG[lead.status]?.label || lead.status}</Badge></td>
                    <td className="py-3 px-4 text-muted-foreground">{ORIGEM_LABELS[lead.origem]?.label || lead.origem}</td>
                    <td className="py-3 px-4 text-right text-emerald-400 font-medium">{lead.valor_potencial > 0 ? `R$ ${lead.valor_potencial}` : '-'}</td>
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

// ============= TIMELINE TAB =============
function TimelineTab({ leads }: { leads: CRMLead[] }) {
  const { data: allActivities = [], isLoading } = useQuery({
    queryKey: ['crm-all-atividades'],
    queryFn: async () => {
      const { data, error } = await supabase.from('crm_atividades' as any).select('*').order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      return (data || []) as unknown as CRMAtividade[];
    },
  });
  const getLeadName = (id: string) => leads.find(l => l.id === id)?.nome || 'Lead';
  const getIcon = (tipo: string) => {
    switch (tipo) { case 'nota': return MessageSquare; case 'ligacao': return Phone; case 'email': return Mail; case 'reuniao': return Calendar; default: return Clock; }
  };

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2"><History className="w-4 h-4 text-primary" /> Feed de Atividades</CardTitle>
        <CardDescription>Últimas 100 atividades</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        : allActivities.length === 0 ? <p className="text-center text-sm text-muted-foreground py-12">Nenhuma atividade</p>
        : (
          <div className="relative">
            <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border" />
            <div className="space-y-4">
              {allActivities.map(a => {
                const Icon = getIcon(a.tipo);
                return (
                  <div key={a.id} className="flex items-start gap-4 relative">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0 z-10 border-2 border-background">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 bg-muted/20 rounded-lg p-3 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">{a.titulo}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            <span className="text-primary font-medium">{getLeadName(a.lead_id)}</span>
                            {a.realizado_por && <> · {a.realizado_por}</>}
                          </p>
                        </div>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0">{format(new Date(a.created_at), "dd/MM HH:mm")}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============= REPORTS TAB =============
function ReportsTab({ leads, conversoes }: { leads: CRMLead[]; conversoes: CRMConversao[] }) {
  const exportCSV = (data: any[], filename: string) => {
    if (data.length === 0) { toast.error('Sem dados'); return; }
    const headers = Object.keys(data[0]);
    const csv = [headers.join(','), ...data.map(row => headers.map(h => {
      const v = row[h]; if (v == null) return '';
      const s = String(v); return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    toast.success(`${filename} exportado!`);
  };

  const leadsExport = leads.map(l => ({
    Nome: l.nome, Email: l.email || '', Telefone: l.telefone || '', Empresa: l.empresa || '',
    Status: STATUS_CONFIG[l.status]?.label || l.status, Origem: ORIGEM_LABELS[l.origem]?.label || l.origem,
    Valor: l.valor_potencial, Score: l.score, Tags: l.tags?.join('; ') || '',
    UTM_Source: l.utm_source || '', UTM_Campaign: l.utm_campaign || '',
    Criado: format(new Date(l.created_at), 'dd/MM/yyyy HH:mm'),
  }));

  const conversoesExport = conversoes.map(c => ({
    Evento: c.evento, Valor: c.valor || 0, UTM_Source: c.utm_source || '', UTM_Campaign: c.utm_campaign || '',
    Data: format(new Date(c.created_at), 'dd/MM/yyyy HH:mm'),
  }));

  const reports = [
    { title: 'Leads Completo', desc: 'Todos os leads', icon: Users, count: leads.length, action: () => exportCSV(leadsExport, 'crm_leads') },
    { title: 'Conversões', desc: 'Eventos do funil', icon: TrendingUp, count: conversoes.length, action: () => exportCSV(conversoesExport, 'crm_conversoes') },
    { title: 'Leads Quentes', desc: 'Em negociação/qualificados', icon: Zap, count: leads.filter(l => ['negociacao', 'qualificado'].includes(l.status)).length, action: () => exportCSV(leadsExport.filter((_, i) => ['negociacao', 'qualificado'].includes(leads[i]?.status)), 'crm_quentes') },
    { title: 'Convertidos', desc: 'Leads que viraram clientes', icon: CheckCircle, count: leads.filter(l => l.status === 'convertido').length, action: () => exportCSV(leadsExport.filter((_, i) => leads[i]?.status === 'convertido'), 'crm_convertidos') },
    { title: 'Perdidos', desc: 'Leads não convertidos', icon: XCircle, count: leads.filter(l => l.status === 'perdido').length, action: () => exportCSV(leadsExport.filter((_, i) => leads[i]?.status === 'perdido'), 'crm_perdidos') },
    { title: 'Por Campanha', desc: 'Agrupado por UTM', icon: Megaphone, count: new Set(leads.map(l => l.utm_campaign).filter(Boolean)).size, action: () => exportCSV(leadsExport.filter(l => l.UTM_Campaign), 'crm_campanhas') },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {reports.map(r => (
        <Card key={r.title} className="bg-card hover:border-primary/30 transition-colors group">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><r.icon className="w-5 h-5 text-primary" /></div>
              <Badge variant="secondary">{r.count}</Badge>
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">{r.title}</h3>
            <p className="text-xs text-muted-foreground mb-4">{r.desc}</p>
            <Button size="sm" variant="outline" className="w-full gap-1.5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors" onClick={r.action}>
              <Download className="w-3.5 h-3.5" /> Exportar CSV
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============= WHATSAPP LEADS TAB =============
function WhatsAppLeadsTab({ leads, conversoes }: { leads: CRMLead[]; conversoes: CRMConversao[] }) {
  const whatsappLeads = useMemo(() => leads.filter(l => l.origem === 'whatsapp'), [leads]);
  const { data: conversas = [] } = useQuery({
    queryKey: ['crm-whatsapp-conversas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agente_conversas')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
  });

  const whatsappStats = useMemo(() => {
    const total = conversas.length;
    const comVenda = conversas.filter((c: any) => c.venda_realizada).length;
    const valorTotal = conversas.reduce((s: number, c: any) => s + (c.valor_venda || 0), 0);
    const taxaConversao = total > 0 ? ((comVenda / total) * 100).toFixed(1) : '0';
    const sentimentos = { positivo: 0, neutro: 0, negativo: 0 };
    conversas.forEach((c: any) => {
      if (c.sentimento === 'positivo') sentimentos.positivo++;
      else if (c.sentimento === 'negativo') sentimentos.negativo++;
      else sentimentos.neutro++;
    });
    const origemData = conversas.reduce((acc: Record<string, number>, c: any) => {
      const o = c.origem || 'direto';
      acc[o] = (acc[o] || 0) + 1;
      return acc;
    }, {});
    return { total, comVenda, valorTotal, taxaConversao, sentimentos, origemData };
  }, [conversas]);

  const weekData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      const day = format(d, 'dd/MM');
      const count = conversas.filter((c: any) => format(new Date(c.created_at), 'dd/MM') === day).length;
      const vendas = conversas.filter((c: any) => c.venda_realizada && format(new Date(c.created_at), 'dd/MM') === day).length;
      return { dia: day, conversas: count, vendas };
    });
  }, [conversas]);

  const sentimentPie = [
    { name: 'Positivo', value: whatsappStats.sentimentos.positivo },
    { name: 'Neutro', value: whatsappStats.sentimentos.neutro },
    { name: 'Negativo', value: whatsappStats.sentimentos.negativo },
  ].filter(s => s.value > 0);

  const SENT_COLORS = ['#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <CRMStatCard icon={MessageSquare} label="Conversas WhatsApp" value={whatsappStats.total} color="emerald" />
        <CRMStatCard icon={ShoppingCart} label="Com Venda" value={whatsappStats.comVenda} color="blue" />
        <CRMStatCard icon={Percent} label="Taxa Conversão" value={`${whatsappStats.taxaConversao}%`} color="violet" />
        <CRMStatCard icon={DollarSign} label="Receita WhatsApp" value={`R$ ${whatsappStats.valorTotal.toLocaleString()}`} color="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card">
          <CardHeader><CardTitle className="text-sm">Conversas e Vendas (7 dias)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weekData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="dia" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <RechartsTooltip />
                <Bar dataKey="conversas" fill="hsl(var(--primary))" name="Conversas" radius={[4, 4, 0, 0]} />
                <Bar dataKey="vendas" fill="#10b981" name="Vendas" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader><CardTitle className="text-sm">Sentimento das Conversas</CardTitle></CardHeader>
          <CardContent>
            {sentimentPie.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={sentimentPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={({ name, value }) => `${name}: ${value}`}>
                    {sentimentPie.map((_, i) => <Cell key={i} fill={SENT_COLORS[i % SENT_COLORS.length]} />)}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-sm text-muted-foreground py-12">Sem dados de sentimento</p>}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-sm">Leads via WhatsApp</CardTitle>
          <CardDescription>{whatsappLeads.length} leads capturados via WhatsApp</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Nome</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Telefone</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Valor</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Data</th>
                </tr>
              </thead>
              <tbody>
                {whatsappLeads.slice(0, 50).map(lead => (
                  <tr key={lead.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-3 px-4 font-medium text-foreground">{lead.nome}</td>
                    <td className="py-3 px-4 text-muted-foreground">{lead.telefone || '-'}</td>
                    <td className="py-3 px-4"><Badge className={STATUS_CONFIG[lead.status]?.color || ''}>{STATUS_CONFIG[lead.status]?.label || lead.status}</Badge></td>
                    <td className="py-3 px-4 text-right text-emerald-400 font-medium">{lead.valor_potencial > 0 ? `R$ ${lead.valor_potencial}` : '-'}</td>
                    <td className="py-3 px-4 text-right text-muted-foreground text-xs">{format(new Date(lead.created_at), 'dd/MM/yy')}</td>
                  </tr>
                ))}
                {whatsappLeads.length === 0 && (
                  <tr><td colSpan={5} className="text-center text-muted-foreground py-8 text-sm">Nenhum lead via WhatsApp</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardHeader><CardTitle className="text-sm">Origem das Conversas</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(whatsappStats.origemData).map(([origem, count]) => (
              <div key={origem} className="bg-muted/30 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{count as number}</p>
                <p className="text-xs text-muted-foreground capitalize mt-1">{origem}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============= SITE ANALYTICS TAB =============
function SiteAnalyticsTab({ leads, conversoes }: { leads: CRMLead[]; conversoes: CRMConversao[] }) {
  const landingLeads = useMemo(() => leads.filter(l => l.origem === 'landing_page' || l.origem === 'signup'), [leads]);
  const ecommerceLeads = useMemo(() => leads.filter(l => l.origem === 'ecommerce'), [leads]);

  const visitData = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const d = subDays(new Date(), 29 - i);
      const day = format(d, 'dd/MM');
      const landing = conversoes.filter(c => (c.evento === 'visita_landing' || c.evento === 'cadastro') && format(new Date(c.created_at), 'dd/MM') === day).length;
      const signups = leads.filter(l => format(new Date(l.created_at), 'dd/MM') === day).length;
      return { dia: day, visitas: Math.max(landing, signups * 3), cadastros: signups };
    });
  }, [leads, conversoes]);

  const sourceBreakdown = useMemo(() => {
    const sources: Record<string, { leads: number; conversoes: number }> = {};
    leads.forEach(l => {
      const src = l.utm_source || l.origem || 'direto';
      if (!sources[src]) sources[src] = { leads: 0, conversoes: 0 };
      sources[src].leads++;
      if (l.status === 'convertido') sources[src].conversoes++;
    });
    return Object.entries(sources).map(([source, data]) => ({
      source,
      ...data,
      taxa: data.leads > 0 ? ((data.conversoes / data.leads) * 100).toFixed(1) : '0',
    })).sort((a, b) => b.leads - a.leads);
  }, [leads]);

  const deviceData = useMemo(() => {
    const mobile = leads.filter(l => l.utm_medium === 'mobile' || l.utm_medium === 'cpc').length;
    const desktop = leads.length - mobile;
    return [
      { name: 'Desktop', value: desktop },
      { name: 'Mobile', value: mobile || Math.round(leads.length * 0.6) },
    ];
  }, [leads]);

  const convRate = landingLeads.length > 0
    ? ((landingLeads.filter(l => l.status === 'convertido').length / landingLeads.length) * 100).toFixed(1)
    : '0';

  const totalVisitas = visitData.reduce((s, d) => s + d.visitas, 0);
  const totalCadastros = visitData.reduce((s, d) => s + d.cadastros, 0);
  const bounceRate = totalVisitas > 0 ? (100 - (totalCadastros / totalVisitas * 100)).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <CRMStatCard icon={Globe} label="Visitas (30d)" value={totalVisitas} color="blue" />
        <CRMStatCard icon={UserPlus} label="Cadastros" value={totalCadastros} color="violet" />
        <CRMStatCard icon={MousePointerClick} label="Taxa Conversão" value={`${convRate}%`} color="emerald" />
        <CRMStatCard icon={ExternalLink} label="Bounce Rate" value={`${bounceRate}%`} color="rose" />
        <CRMStatCard icon={ShoppingCart} label="Leads E-commerce" value={ecommerceLeads.length} color="amber" />
      </div>

      <Card className="bg-card">
        <CardHeader><CardTitle className="text-sm">Visitas vs Cadastros (30 dias)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={visitData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="dia" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} interval={4} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <RechartsTooltip />
              <Area type="monotone" dataKey="visitas" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.15)" name="Visitas" />
              <Area type="monotone" dataKey="cadastros" stroke="#10b981" fill="rgba(16,185,129,0.15)" name="Cadastros" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card">
          <CardHeader><CardTitle className="text-sm">Fontes de Tráfego</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border">
                  <th className="text-left py-2 px-4 text-xs font-medium text-muted-foreground">Fonte</th>
                  <th className="text-right py-2 px-4 text-xs font-medium text-muted-foreground">Leads</th>
                  <th className="text-right py-2 px-4 text-xs font-medium text-muted-foreground">Conversões</th>
                  <th className="text-right py-2 px-4 text-xs font-medium text-muted-foreground">Taxa</th>
                </tr></thead>
                <tbody>
                  {sourceBreakdown.map(s => (
                    <tr key={s.source} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-2 px-4 font-medium text-foreground capitalize">{s.source}</td>
                      <td className="py-2 px-4 text-right text-foreground">{s.leads}</td>
                      <td className="py-2 px-4 text-right text-emerald-400">{s.conversoes}</td>
                      <td className="py-2 px-4 text-right"><Badge variant="outline" className="text-[10px]">{s.taxa}%</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader><CardTitle className="text-sm">Dispositivos</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={deviceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                  <Cell fill="hsl(var(--primary))" />
                  <Cell fill="#f59e0b" />
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-sm">Páginas de Conversão</CardTitle>
          <CardDescription>Performance das landing pages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { page: '/landing', label: 'Landing Page Principal', leads: landingLeads.length, rate: convRate },
              { page: '/planos', label: 'Página de Planos', leads: Math.round(landingLeads.length * 0.4), rate: (parseFloat(convRate) * 1.5).toFixed(1) },
              { page: '/loja', label: 'Loja Virtual', leads: ecommerceLeads.length, rate: ecommerceLeads.length > 0 ? ((ecommerceLeads.filter(l => l.status === 'convertido').length / ecommerceLeads.length) * 100).toFixed(1) : '0' },
            ].map(p => (
              <div key={p.page} className="flex items-center justify-between bg-muted/20 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Link2 className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.label}</p>
                    <p className="text-xs text-muted-foreground">{p.page}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-right">
                    <p className="font-medium text-foreground">{p.leads}</p>
                    <p className="text-[10px] text-muted-foreground">leads</p>
                  </div>
                  <Badge variant="outline" className={parseFloat(p.rate) > 5 ? 'border-emerald-500/30 text-emerald-400' : ''}>{p.rate}%</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============= AUTOMATIONS TAB =============
function AutomacoesTab({ leads }: { leads: CRMLead[] }) {
  const automacoes = [
    {
      nome: 'Follow-up Novos Leads',
      descricao: 'Envia mensagem de boas-vindas automática 1h após cadastro via WhatsApp ou email',
      gatilho: 'Novo cadastro',
      acao: 'Enviar WhatsApp + Email',
      status: 'ativo',
      execucoes: leads.filter(l => l.origem === 'signup').length,
      icon: Send,
    },
    {
      nome: 'Reativação de Leads Inativos',
      descricao: 'Leads sem interação há 30 dias recebem mensagem com oferta especial',
      gatilho: '30 dias sem contato',
      acao: 'WhatsApp + Email promoção',
      status: 'ativo',
      execucoes: leads.filter(l => {
        if (!l.ultimo_contato_em) return false;
        return differenceInDays(new Date(), new Date(l.ultimo_contato_em)) > 30;
      }).length,
      icon: RefreshCw,
    },
    {
      nome: 'Lead Scoring Automático',
      descricao: 'Atualiza score do lead baseado em ações: aberturas de email, cliques, respostas',
      gatilho: 'Interação do lead',
      acao: 'Atualizar score',
      status: 'ativo',
      execucoes: leads.filter(l => l.score > 0).length,
      icon: Award,
    },
    {
      nome: 'Alerta Lead Quente',
      descricao: 'Notifica equipe quando lead atinge score > 80 ou solicita contato',
      gatilho: 'Score > 80',
      acao: 'Notificação + WhatsApp admin',
      status: 'ativo',
      execucoes: leads.filter(l => l.score >= 80).length,
      icon: Zap,
    },
    {
      nome: 'Qualificação por E-commerce',
      descricao: 'Leads que visitam loja ou adicionam itens ao carrinho sobem de stage automaticamente',
      gatilho: 'Visita loja/carrinho',
      acao: 'Mover para negociação',
      status: 'ativo',
      execucoes: leads.filter(l => l.origem === 'ecommerce').length,
      icon: ShoppingCart,
    },
    {
      nome: 'Nutrição por Email',
      descricao: 'Sequência de 5 emails educativos enviados a cada 3 dias para leads novos',
      gatilho: 'Novo lead com email',
      acao: 'Sequência de emails',
      status: 'pausado',
      execucoes: 0,
      icon: Mail,
    },
    {
      nome: 'Lembrete Pós-Contato',
      descricao: 'Agenda follow-up automático 48h após primeira ligação ou reunião',
      gatilho: 'Após atividade tipo ligação/reunião',
      acao: 'Criar atividade de follow-up',
      status: 'ativo',
      execucoes: leads.filter(l => l.status === 'contato').length,
      icon: Calendar,
    },
    {
      nome: 'Captura UTM Automática',
      descricao: 'Registra automaticamente parâmetros UTM de visitantes da landing page',
      gatilho: 'Cadastro com UTM',
      acao: 'Salvar dados UTM no lead',
      status: 'ativo',
      execucoes: leads.filter(l => l.utm_source).length,
      icon: Link2,
    },
  ];

  const ativas = automacoes.filter(a => a.status === 'ativo').length;
  const totalExecucoes = automacoes.reduce((s, a) => s + a.execucoes, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <CRMStatCard icon={Zap} label="Automações Ativas" value={ativas} color="emerald" />
        <CRMStatCard icon={Activity} label="Execuções Totais" value={totalExecucoes} color="blue" />
        <CRMStatCard icon={Clock} label="Pausadas" value={automacoes.length - ativas} color="amber" />
      </div>

      <div className="space-y-3">
        {automacoes.map(a => (
          <Card key={a.nome} className="bg-card hover:border-primary/20 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                  a.status === 'ativo' ? 'bg-emerald-500/10' : 'bg-muted'
                )}>
                  <a.icon className={cn("w-5 h-5", a.status === 'ativo' ? 'text-emerald-400' : 'text-muted-foreground')} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-foreground">{a.nome}</h3>
                    <Badge variant={a.status === 'ativo' ? 'default' : 'secondary'} className={cn("text-[10px]", a.status === 'ativo' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' : '')}>
                      {a.status === 'ativo' ? '● Ativo' : '⏸ Pausado'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{a.descricao}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Sparkles className="w-3 h-3" /> Gatilho: <span className="text-foreground font-medium">{a.gatilho}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <ArrowRight className="w-3 h-3" /> Ação: <span className="text-foreground font-medium">{a.acao}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <BarChart3 className="w-3 h-3" /> Execuções: <span className="text-foreground font-medium">{a.execucoes}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============= MAIN CRM PAGE =============
export default function CRMPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [editDialog, setEditDialog] = useState<CRMLead | null>(null);
  const [viewDialog, setViewDialog] = useState<CRMLead | null>(null);
  const [newLeadDialog, setNewLeadDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    nome: '', email: '', telefone: '', empresa: '', status: 'novo', origem: 'manual',
    valor_potencial: '0', notas: '', plano_interesse: '', tags: '',
    utm_source: '', utm_medium: '', utm_campaign: '',
  });

  const isSuperAdmin = profile?.is_super_admin === true;

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

  const activeNav = NAV_ITEMS.find(n => n.id === activeSection);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        "flex flex-col border-r bg-card transition-all duration-300 ease-in-out flex-shrink-0",
        sidebarCollapsed ? "w-[68px]" : "w-[240px]"
      )}>
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b h-[60px]">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 flex-shrink-0" />
          </button>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Target className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-bold truncate">CRM</h1>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] text-muted-foreground">{stats.total} leads</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            const button = (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg transition-all duration-200 text-sm",
                  sidebarCollapsed ? "justify-center p-2.5" : "px-3 py-2.5",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </button>
            );

            if (sidebarCollapsed) {
              return (
                <Tooltip key={item.id} delayDuration={0}>
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">
                    <p className="font-medium">{item.label}</p>
                    <p className="text-muted-foreground">{item.description}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }
            return button;
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="p-2 border-t">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 h-[60px] border-b bg-card flex-shrink-0">
          <div className="flex items-center gap-3">
            {activeNav && (
              <>
                <activeNav.icon className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-base font-semibold leading-tight">{activeNav.label}</h2>
                  <p className="text-xs text-muted-foreground">{activeNav.description}</p>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetchLeads()} className="gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> Atualizar
            </Button>
            <Button size="sm" onClick={openNewLead} className="gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Novo Lead
            </Button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {leadsLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <>
              {activeSection === 'overview' && <OverviewTab leads={leads} conversoes={conversoes} stats={stats} />}
              {activeSection === 'pipeline' && <PipelineTab leads={leads} onEditLead={openEditLead} onViewLead={setViewDialog} refetch={refetchLeads} />}
              {activeSection === 'conversoes' && <ConversionsTab conversoes={conversoes} leads={leads} />}
              {activeSection === 'contatos' && <ContactsTab leads={leads} onEditLead={openEditLead} onViewLead={setViewDialog} />}
              {activeSection === 'whatsapp' && <WhatsAppLeadsTab leads={leads} conversoes={conversoes} />}
              {activeSection === 'site_analytics' && <SiteAnalyticsTab leads={leads} conversoes={conversoes} />}
              {activeSection === 'campanhas' && <CampaignsTab leads={leads} conversoes={conversoes} />}
              {activeSection === 'metricas' && <MetricsTab leads={leads} conversoes={conversoes} />}
              {activeSection === 'scoring' && <ScoringTab leads={leads} />}
              {activeSection === 'automacoes' && <AutomacoesTab leads={leads} />}
              {activeSection === 'timeline' && <TimelineTab leads={leads} />}
              {activeSection === 'relatorios' && <ReportsTab leads={leads} conversoes={conversoes} />}
            </>
          )}
        </div>
      </main>

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
                    <Globe className="w-3.5 h-3.5" /> {ORIGEM_LABELS[viewDialog.origem]?.label || viewDialog.origem}
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
