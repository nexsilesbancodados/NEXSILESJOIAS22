import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, Loader2, Trash2 } from 'lucide-react';
import { useMetas, useAddMeta, useDeleteMeta } from '@/hooks/useMetas';
import { ReadOnlyGuard } from '@/components/subscription/ReadOnlyGuard';

const meses = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function MetasConfig() {
  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth();
  
  const [mesSelecionado, setMesSelecionado] = useState(mesAtual.toString());
  const [anoSelecionado, setAnoSelecionado] = useState(anoAtual.toString());
  const [valorMeta, setValorMeta] = useState('');
  
  const { data: metas = [], isLoading } = useMetas();
  const addMeta = useAddMeta();
  const deleteMeta = useDeleteMeta();

  const handleSaveMeta = () => {
    if (!valorMeta || !mesSelecionado) return;
    
    const mesIndex = parseInt(mesSelecionado);
    const ano = parseInt(anoSelecionado);
    
    // Calculate start and end dates for the selected month
    const dataInicio = new Date(ano, mesIndex, 1).toISOString().split('T')[0];
    const dataFim = new Date(ano, mesIndex + 1, 0).toISOString().split('T')[0];
    
    addMeta.mutate({
      titulo: `Meta ${meses[mesIndex]} ${ano}`,
      descricao: `Meta de faturamento para ${meses[mesIndex]} de ${ano}`,
      tipo: 'faturamento',
      valor_meta: parseFloat(valorMeta),
      valor_atual: 0,
      data_inicio: dataInicio,
      data_fim: dataFim,
      atingida: false,
    });
    
    setValorMeta('');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getMonthFromMeta = (meta: { data_inicio?: string | null; titulo: string }) => {
    if (meta.data_inicio) {
      const date = new Date(meta.data_inicio);
      return meses[date.getMonth()];
    }
    // Fallback: try to extract from title
    for (const mes of meses) {
      if (meta.titulo.includes(mes)) {
        return mes;
      }
    }
    return meta.titulo;
  };

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <CardTitle className="font-display">Definir Meta de Faturamento</CardTitle>
          </div>
          <CardDescription>Configure as metas mensais de vendas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ano">Ano</Label>
              <Select value={anoSelecionado} onValueChange={setAnoSelecionado}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[anoAtual - 1, anoAtual, anoAtual + 1].map((a) => (
                    <SelectItem key={a} value={a.toString()}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mes">Mês</Label>
              <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {meses.map((mes, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {mes}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor">Valor da Meta (R$)</Label>
              <Input
                id="valor"
                type="number"
                placeholder="10000"
                value={valorMeta}
                onChange={(e) => setValorMeta(e.target.value)}
              />
            </div>
          </div>
          <ReadOnlyGuard>
            <Button 
              onClick={handleSaveMeta} 
              disabled={!valorMeta || addMeta.isPending}
              className="btn-gold"
            >
              {addMeta.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Meta'
              )}
            </Button>
          </ReadOnlyGuard>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-display">Metas Configuradas</CardTitle>
          <CardDescription>Todas as metas de faturamento</CardDescription>
        </CardHeader>
        <CardContent>
          {metas.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhuma meta configurada.</p>
          ) : (
            <div className="space-y-2">
              {metas.map((meta) => (
                <div 
                  key={meta.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{meta.titulo}</p>
                    <p className="text-sm text-muted-foreground">
                      Meta: {formatCurrency(meta.valor_meta)}
                      {meta.valor_atual ? ` | Atual: ${formatCurrency(meta.valor_atual)}` : ''}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMeta.mutate(meta.id)}
                    disabled={deleteMeta.isPending}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
