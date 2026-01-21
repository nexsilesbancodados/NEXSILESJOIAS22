import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, Loader2, Trash2 } from 'lucide-react';
import { useMetas, useAddMeta, useDeleteMeta } from '@/hooks/useMetas';

const meses = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function MetasConfig() {
  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth() + 1;
  
  const [ano, setAno] = useState(anoAtual);
  const [mesSelecionado, setMesSelecionado] = useState(mesAtual.toString());
  const [valorMeta, setValorMeta] = useState('');
  
  const { data: metas = [], isLoading } = useMetas(ano);
  const addMeta = useAddMeta();
  const deleteMeta = useDeleteMeta();

  const handleSaveMeta = () => {
    if (!valorMeta || !mesSelecionado) return;
    
    addMeta.mutate({
      tipo: 'faturamento',
      valor: parseFloat(valorMeta),
      mes: parseInt(mesSelecionado),
      ano,
    });
    
    setValorMeta('');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
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
              <Select value={ano.toString()} onValueChange={(v) => setAno(parseInt(v))}>
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
                    <SelectItem key={index + 1} value={(index + 1).toString()}>
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
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-display">Metas de {ano}</CardTitle>
          <CardDescription>Metas configuradas para o ano selecionado</CardDescription>
        </CardHeader>
        <CardContent>
          {metas.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhuma meta configurada para este ano.</p>
          ) : (
            <div className="space-y-2">
              {metas.map((meta) => (
                <div 
                  key={meta.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{meses[meta.mes - 1]}</p>
                    <p className="text-sm text-muted-foreground">
                      Meta: {formatCurrency(meta.valor)}
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
