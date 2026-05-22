import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Trophy, Loader2, Target, Edit2, Medal } from 'lucide-react';
import { toast } from 'sonner';

interface Ranking {
  revendedora_id: string;
  nome: string;
  total_vendido: number;
  total_pecas: number;
  meta_valor: number;
  percentual_meta: number;
  badge: 'ouro' | 'prata' | 'bronze' | 'sem_meta';
  posicao: number;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const BADGE_STYLES: Record<string, { label: string; cls: string; icon: string }> = {
  ouro: { label: 'Ouro', cls: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300', icon: '🥇' },
  prata: { label: 'Prata', cls: 'bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200', icon: '🥈' },
  bronze: { label: 'Bronze', cls: 'bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-950/40 dark:text-orange-300', icon: '🥉' },
  sem_meta: { label: 'Sem meta', cls: 'bg-muted text-muted-foreground', icon: '·' },
};

export function MetasRankingWidget() {
  const { organizationId } = useOrganization();
  const qc = useQueryClient();
  const now = new Date();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [ano, setAno] = useState(now.getFullYear());
  const [editing, setEditing] = useState<Ranking | null>(null);
  const [metaInput, setMetaInput] = useState('');
  const [saving, setSaving] = useState(false);

  const { data = [], isLoading } = useQuery({
    queryKey: ['ranking-revendedoras', organizationId, mes, ano],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase.rpc('ranking_revendedoras_mes' as any, {
        p_organization_id: organizationId, p_mes: mes, p_ano: ano,
      });
      if (error) throw error;
      return (data ?? []) as unknown as Ranking[];
    },
    enabled: !!organizationId,
  });

  const salvarMeta = async () => {
    if (!editing || !organizationId) return;
    const v = Number(metaInput.replace(',', '.'));
    if (isNaN(v) || v < 0) { toast.error('Valor inválido'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('revendedora_metas' as any).upsert({
        organization_id: organizationId,
        revendedora_id: editing.revendedora_id,
        mes, ano, meta_valor: v,
      }, { onConflict: 'revendedora_id,mes,ano' });
      if (error) throw error;
      toast.success('Meta salva');
      setEditing(null); setMetaInput('');
      qc.invalidateQueries({ queryKey: ['ranking-revendedoras'] });
    } catch (e: any) {
      toast.error(e?.message ?? 'Erro');
    } finally {
      setSaving(false);
    }
  };

  const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="w-5 h-5 text-amber-500" />
              Ranking & metas
            </CardTitle>
            <div className="flex gap-2">
              <select value={mes} onChange={(e) => setMes(Number(e.target.value))}
                className="h-9 rounded-md border border-input bg-background px-2 text-sm">
                {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <select value={ano} onChange={(e) => setAno(Number(e.target.value))}
                className="h-9 rounded-md border border-input bg-background px-2 text-sm">
                {[ano - 1, ano, ano + 1].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : data.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Sem revendedoras.</p>
          ) : (
            data.map((r) => {
              const badge = BADGE_STYLES[r.badge];
              return (
                <div key={r.revendedora_id} className="rounded-lg border bg-card p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                      {r.posicao}
                    </div>
                    <span className="font-medium flex-1 truncate">{r.nome}</span>
                    <Badge variant="outline" className={badge.cls}>
                      {badge.icon} {badge.label}
                    </Badge>
                    <Button size="icon" variant="ghost" className="h-7 w-7"
                      onClick={() => { setEditing(r); setMetaInput(String(r.meta_valor || '')); }}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatCurrency(r.total_vendido)} de {formatCurrency(r.meta_valor || 0)}</span>
                    <span>{r.total_pecas} peça(s) · {r.percentual_meta}%</span>
                  </div>
                  <Progress value={Math.min(100, r.percentual_meta)} className="h-1.5" />
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Meta de {editing?.nome}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-xs">Meta para {MESES[mes - 1]}/{ano} (R$)</Label>
            <Input type="text" inputMode="decimal" value={metaInput}
              onChange={(e) => setMetaInput(e.target.value)} placeholder="0,00" autoFocus />
            <p className="text-xs text-muted-foreground">
              Badges: 🥉 40% · 🥈 70% · 🥇 100% da meta
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={salvarMeta} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Medal className="w-4 h-4 mr-2" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
