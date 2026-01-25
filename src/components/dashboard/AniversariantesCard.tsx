import { Cake, Gift, MessageCircle, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAniversariantesDoMes } from '@/hooks/useClientes';
import { openWhatsApp } from '@/lib/whatsapp';
import { Link } from 'react-router-dom';

export function AniversariantesCard() {
  const { data: aniversariantes = [] } = useAniversariantesDoMes();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const isToday = (dateString: string) => {
    const today = new Date();
    const date = new Date(dateString);
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth();
  };

  const sendBirthdayMessage = (nome: string, telefone: string) => {
    const message = `🎂 Olá ${nome.split(' ')[0]}!\n\nA equipe Nexsiles deseja um Feliz Aniversário! 🎉\n\nQue este dia seja repleto de alegrias e realizações! ✨`;
    openWhatsApp(telefone, message);
  };

  if (aniversariantes.length === 0) {
    return null;
  }

  const mesAtual = new Date().toLocaleDateString('pt-BR', { month: 'long' });

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center">
            <Cake className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Aniversariantes</h3>
            <p className="text-xs text-muted-foreground">{aniversariantes.length} em {mesAtual}</p>
          </div>
        </div>
        <button className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted hover:bg-muted/80 text-muted-foreground transition-colors">
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2 max-h-[180px] overflow-y-auto">
        {aniversariantes.slice(0, 5).map((cliente) => (
          <div 
            key={cliente.id} 
            className={`flex items-center justify-between p-3 rounded-xl ${
              isToday(cliente.data_nascimento!) ? 'bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/30' : 'bg-muted/30 border border-border/30'
            }`}
          >
            <div className="flex items-center gap-2">
              {isToday(cliente.data_nascimento!) && <Gift className="w-4 h-4 text-rose-500 animate-pulse" />}
              <div>
                <p className="font-medium text-sm text-foreground">{cliente.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(cliente.data_nascimento!)}{isToday(cliente.data_nascimento!) && ' - Hoje!'}
                </p>
              </div>
            </div>
            {cliente.telefone && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => sendBirthdayMessage(cliente.nome, cliente.telefone!)}>
                <MessageCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
