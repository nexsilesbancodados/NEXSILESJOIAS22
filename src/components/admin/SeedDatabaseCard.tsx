import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Loader2, CheckCircle, AlertCircle, Sparkles, Trash2 } from 'lucide-react';
import { seedDatabase, clearDatabase } from '@/lib/seed-data';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function SeedDatabaseCard() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; details?: Record<string, number> } | null>(null);
  const queryClient = useQueryClient();

  const handleClear = async () => {
    setIsClearing(true);
    setResult(null);
    
    try {
      const clearResult = await clearDatabase();
      
      if (clearResult.success) {
        toast.success('Dados removidos com sucesso!');
        queryClient.invalidateQueries();
        setResult(clearResult);
      } else {
        toast.error(clearResult.message);
        setResult(clearResult);
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      });
      toast.error('Erro ao limpar banco de dados');
    } finally {
      setIsClearing(false);
    }
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    setResult(null);
    
    try {
      const seedResult = await seedDatabase();
      setResult(seedResult);
      
      if (seedResult.success) {
        toast.success('Dados de teste inseridos com sucesso!');
        // Invalidate all queries to refresh data
        queryClient.invalidateQueries();
      } else {
        toast.error(seedResult.message);
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      });
      toast.error('Erro ao popular banco de dados');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleClearAndSeed = async () => {
    setIsSeeding(true);
    setResult(null);
    
    try {
      // First clear
      const clearResult = await clearDatabase();
      if (!clearResult.success) {
        throw new Error(clearResult.message);
      }
      
      // Then seed
      const seedResult = await seedDatabase();
      setResult(seedResult);
      
      if (seedResult.success) {
        toast.success('Banco limpo e repopulado com sucesso!');
        queryClient.invalidateQueries();
      } else {
        toast.error(seedResult.message);
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      });
      toast.error('Erro ao repopular banco de dados');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <Card className="glass-card border-dashed border-2 border-primary/30">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="font-display">Dados de Demonstração</CardTitle>
            <CardDescription>Popule o banco com dados de teste para explorar o sistema</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground space-y-1">
          <p>Serão criados automaticamente:</p>
          <ul className="list-disc list-inside space-y-0.5 ml-2">
            <li><strong>5 banhos</strong> de galvânica</li>
            <li><strong>4 fornecedores</strong> de semijoias</li>
            <li><strong>23 peças</strong> (anéis, colares, brincos, pulseiras, conjuntos)</li>
            <li><strong>12 clientes</strong> com dados completos</li>
            <li><strong>8 revendedoras</strong> com comissões configuradas</li>
            <li><strong>3 campanhas</strong> promocionais</li>
            <li><strong>3 catálogos</strong> com peças</li>
            <li><strong>4 maletas</strong> para revendedoras</li>
            <li><strong>30 vendas</strong> históricas dos últimos 90 dias</li>
            <li><strong>3 romaneios</strong> de envio</li>
          </ul>
        </div>
        
        {result && (
          <div className={`p-3 rounded-lg flex items-start gap-2 ${
            result.success 
              ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
              : 'bg-destructive/10 text-destructive'
          }`}>
            {result.success ? (
              <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            )}
            <div className="space-y-1">
              <p className="font-medium">{result.message}</p>
              {result.details && (
                <ul className="text-xs space-y-0.5 grid grid-cols-2 gap-x-4">
                  {Object.entries(result.details).map(([key, value]) => (
                    <li key={key}>✓ {key}: {value}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
        
        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline"
                className="gap-2 text-destructive hover:text-destructive" 
                disabled={isClearing || isSeeding}
              >
                {isClearing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Limpar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar limpeza do banco</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação irá remover TODOS os dados de teste do banco (peças, clientes, vendas, etc).
                  <br /><br />
                  <strong className="text-destructive">Esta ação não pode ser desfeita!</strong>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleClear} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Sim, limpar tudo
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                className="flex-1 gap-2" 
                disabled={isSeeding || isClearing}
                variant={result?.success ? "outline" : "default"}
              >
                {isSeeding ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Populando...
                  </>
                ) : result?.success ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Repopular
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    Popular com Dados
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar população do banco</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação irá limpar todos os dados existentes e inserir novos dados de demonstração.
                  <br /><br />
                  Os dados incluem fornecedores, peças, clientes, revendedoras, maletas, catálogos, campanhas e vendas fictícias.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearAndSeed}>
                  Sim, popular banco
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
