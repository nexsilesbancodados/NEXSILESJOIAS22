import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Loader2, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { seedDatabase, checkDatabaseHasData } from '@/lib/seed-data';
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
  const [result, setResult] = useState<{ success: boolean; message: string; details?: Record<string, number> } | null>(null);
  const queryClient = useQueryClient();

  const handleSeed = async () => {
    setIsSeeding(true);
    setResult(null);
    
    try {
      // Check if database already has data
      const hasData = await checkDatabaseHasData();
      
      if (hasData) {
        setResult({
          success: false,
          message: 'O banco de dados já possui peças cadastradas. Limpe os dados antes de popular novamente.',
        });
        setIsSeeding(false);
        return;
      }
      
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
            <li><strong>4 fornecedores</strong> de semijoias</li>
            <li><strong>23 peças</strong> (anéis, colares, brincos, pulseiras, conjuntos)</li>
            <li><strong>12 clientes</strong> com dados completos</li>
            <li><strong>8 revendedoras</strong> com comissões configuradas</li>
            <li><strong>20 vendas</strong> históricas dos últimos 60 dias</li>
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
                <ul className="text-xs space-y-0.5">
                  {Object.entries(result.details).map(([key, value]) => (
                    <li key={key}>✓ {key}: {value} registros</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              className="w-full gap-2" 
              disabled={isSeeding}
              variant={result?.success ? "outline" : "default"}
            >
              {isSeeding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Populando banco...
                </>
              ) : result?.success ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Dados inseridos!
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  Popular com Dados de Teste
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar população do banco</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação irá inserir dados de demonstração no seu banco de dados. 
                Os dados incluem fornecedores, peças, clientes, revendedoras e vendas fictícias.
                <br /><br />
                <strong>Nota:</strong> Isso só funcionará se o banco estiver vazio.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleSeed}>
                Sim, popular banco
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
