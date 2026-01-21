import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, TrendingUp, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FaixaComissao {
  id: string;
  valorMinimo: number;
  valorMaximo: number | null;
  percentual: number;
}

interface ComissaoEscalaProps {
  faixas: FaixaComissao[];
  onChange: (faixas: FaixaComissao[]) => void;
  comissaoFixa: number;
  onComissaoFixaChange: (value: number) => void;
  usarEscala: boolean;
  onUsarEscalaChange: (value: boolean) => void;
  totalVendas?: number;
}

export function ComissaoEscala({
  faixas,
  onChange,
  comissaoFixa,
  onComissaoFixaChange,
  usarEscala,
  onUsarEscalaChange,
  totalVendas = 0,
}: ComissaoEscalaProps) {
  const addFaixa = () => {
    const ultimaFaixa = faixas[faixas.length - 1];
    const novoMinimo = ultimaFaixa ? (ultimaFaixa.valorMaximo || ultimaFaixa.valorMinimo) + 0.01 : 0;
    
    const novaFaixa: FaixaComissao = {
      id: crypto.randomUUID(),
      valorMinimo: novoMinimo,
      valorMaximo: novoMinimo + 500,
      percentual: ultimaFaixa ? ultimaFaixa.percentual + 5 : 20,
    };
    
    onChange([...faixas, novaFaixa]);
  };

  const removeFaixa = (id: string) => {
    onChange(faixas.filter(f => f.id !== id));
  };

  const updateFaixa = (id: string, field: keyof FaixaComissao, value: number | null) => {
    onChange(faixas.map(f => 
      f.id === id ? { ...f, [field]: value } : f
    ));
  };

  const calcularComissao = (valor: number): { percentual: number; valorComissao: number } => {
    if (!usarEscala || faixas.length === 0) {
      return {
        percentual: comissaoFixa,
        valorComissao: valor * (comissaoFixa / 100),
      };
    }

    // Find the applicable tier
    for (let i = faixas.length - 1; i >= 0; i--) {
      const faixa = faixas[i];
      if (valor >= faixa.valorMinimo) {
        return {
          percentual: faixa.percentual,
          valorComissao: valor * (faixa.percentual / 100),
        };
      }
    }

    // If below all tiers, use the first tier
    const primeiraFaixa = faixas[0];
    return {
      percentual: primeiraFaixa.percentual,
      valorComissao: valor * (primeiraFaixa.percentual / 100),
    };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const comissaoAtual = calcularComissao(totalVendas);

  return (
    <div className="space-y-4">
      {/* Toggle between fixed and scale */}
      <div className="flex items-center justify-between p-4 border rounded-lg bg-secondary/30">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Usar Escala de Comissão</Label>
          <p className="text-xs text-muted-foreground">
            {usarEscala 
              ? 'Comissão varia de acordo com o valor vendido' 
              : 'Comissão fixa para qualquer valor'
            }
          </p>
        </div>
        <Switch
          checked={usarEscala}
          onCheckedChange={onUsarEscalaChange}
        />
      </div>

      {!usarEscala ? (
        /* Fixed commission */
        <div className="space-y-2">
          <Label>Comissão Fixa (%)</Label>
          <Input
            type="number"
            min={0}
            max={100}
            step={1}
            value={comissaoFixa}
            onChange={(e) => onComissaoFixaChange(parseFloat(e.target.value) || 0)}
            className="w-32"
          />
        </div>
      ) : (
        /* Commission scale */
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Faixas de Comissão</Label>
            <Button 
              type="button"
              variant="outline" 
              size="sm" 
              onClick={addFaixa}
            >
              <Plus className="w-4 h-4 mr-1" />
              Adicionar Faixa
            </Button>
          </div>

          {faixas.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground border rounded-lg border-dashed">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma faixa configurada</p>
              <p className="text-xs">Clique em "Adicionar Faixa" para começar</p>
            </div>
          ) : (
            <div className="space-y-2">
              {faixas.map((faixa, index) => (
                <div 
                  key={faixa.id}
                  className={cn(
                    "flex items-center gap-2 p-3 border rounded-lg bg-card",
                    totalVendas >= faixa.valorMinimo && 
                    (faixa.valorMaximo === null || totalVendas <= faixa.valorMaximo) &&
                    "border-primary bg-primary/5"
                  )}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-muted-foreground">De</span>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">R$</span>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={faixa.valorMinimo}
                          onChange={(e) => updateFaixa(faixa.id, 'valorMinimo', parseFloat(e.target.value) || 0)}
                          className="w-24 pl-8 h-8 text-sm"
                        />
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">até</span>
                    <div className="flex items-center gap-1">
                      {index === faixas.length - 1 ? (
                        <span className="text-sm font-medium px-2">∞</span>
                      ) : (
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">R$</span>
                          <Input
                            type="number"
                            min={faixa.valorMinimo}
                            step={0.01}
                            value={faixa.valorMaximo || ''}
                            onChange={(e) => updateFaixa(faixa.id, 'valorMaximo', e.target.value ? parseFloat(e.target.value) : null)}
                            className="w-24 pl-8 h-8 text-sm"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">=</span>
                    <div className="relative">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        value={faixa.percentual}
                        onChange={(e) => updateFaixa(faixa.id, 'percentual', parseFloat(e.target.value) || 0)}
                        className="w-16 h-8 text-sm pr-6"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%</span>
                    </div>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => removeFaixa(faixa.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Preview - always show */}
      {totalVendas > 0 && (
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Vendido</p>
                  <p className="font-semibold">{formatCurrency(totalVendas)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  Comissão ({comissaoAtual.percentual}%)
                </p>
                <p className="text-xl font-display font-semibold text-primary">
                  {formatCurrency(comissaoAtual.valorComissao)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scale preview table */}
      {usarEscala && faixas.length > 0 && (
        <div className="text-xs text-muted-foreground border rounded-lg overflow-hidden">
          <div className="grid grid-cols-3 gap-2 p-2 bg-muted/50 font-medium">
            <span>Faixa de Vendas</span>
            <span className="text-center">Percentual</span>
            <span className="text-right">Exemplo (R$ 1.000)</span>
          </div>
          {faixas.map((faixa, index) => (
            <div 
              key={faixa.id} 
              className={cn(
                "grid grid-cols-3 gap-2 p-2 border-t",
                totalVendas >= faixa.valorMinimo && 
                (faixa.valorMaximo === null || totalVendas <= faixa.valorMaximo) &&
                "bg-primary/5"
              )}
            >
              <span>
                {formatCurrency(faixa.valorMinimo)} - {faixa.valorMaximo ? formatCurrency(faixa.valorMaximo) : '∞'}
              </span>
              <span className="text-center font-medium">{faixa.percentual}%</span>
              <span className="text-right">
                {formatCurrency(1000 * (faixa.percentual / 100))}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper function to calculate commission from scale
export function calcularComissaoPorEscala(
  totalVendas: number,
  faixas: FaixaComissao[],
  comissaoFixa: number,
  usarEscala: boolean
): { percentual: number; valorComissao: number } {
  if (!usarEscala || faixas.length === 0) {
    return {
      percentual: comissaoFixa,
      valorComissao: totalVendas * (comissaoFixa / 100),
    };
  }

  for (let i = faixas.length - 1; i >= 0; i--) {
    const faixa = faixas[i];
    if (totalVendas >= faixa.valorMinimo) {
      return {
        percentual: faixa.percentual,
        valorComissao: totalVendas * (faixa.percentual / 100),
      };
    }
  }

  const primeiraFaixa = faixas[0];
  return {
    percentual: primeiraFaixa.percentual,
    valorComissao: totalVendas * (primeiraFaixa.percentual / 100),
  };
}

// Serialize/deserialize for storing in database
export function serializeFaixas(faixas: FaixaComissao[]): string {
  return JSON.stringify(faixas);
}

export function deserializeFaixas(json: string | null): FaixaComissao[] {
  if (!json) return [];
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
}
