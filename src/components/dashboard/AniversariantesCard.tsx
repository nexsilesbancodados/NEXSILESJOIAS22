import { Cake, Gift, MessageCircle } from 'lucide-react';
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
    const message = `🎂 Olá ${nome.split(' ')[0]}!\n\n` +
      `A equipe Nexsiles deseja um Feliz Aniversário! 🎉\n\n` +
      `Que este dia seja repleto de alegrias e realizações! ✨\n\n` +
      `Como presente especial, preparamos condições exclusivas para você hoje! 💎`;
    
    openWhatsApp(telefone, message);
  };

  if (aniversariantes.length === 0) {
    return null;
  }

  const mesAtual = new Date().toLocaleDateString('pt-BR', { month: 'long' });

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-400 via-rose-500 to-red-500 p-5 shadow-lg">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/20" />
        <div className="absolute -left-4 -bottom-4 w-24 h-24 rounded-full bg-white/10" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Cake className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Aniversariantes de {mesAtual}</h3>
            <p className="text-sm text-white/70">
              {aniversariantes.length} cliente{aniversariantes.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {aniversariantes.slice(0, 5).map((cliente) => (
            <div 
              key={cliente.id} 
              className={`flex items-center justify-between p-3 rounded-xl ${
                isToday(cliente.data_nascimento!) 
                  ? 'bg-white/30' 
                  : 'bg-white/10'
              } backdrop-blur-sm`}
            >
              <div className="flex items-center gap-2">
                {isToday(cliente.data_nascimento!) && (
                  <Gift className="w-4 h-4 text-white animate-pulse" />
                )}
                <div>
                  <p className="font-medium text-sm text-white">{cliente.nome}</p>
                  <p className="text-xs text-white/70">
                    {formatDate(cliente.data_nascimento!)}
                    {isToday(cliente.data_nascimento!) && ' - Hoje!'}
                  </p>
                </div>
              </div>
              {cliente.telefone && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={() => sendBirthdayMessage(cliente.nome, cliente.telefone!)}
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {aniversariantes.length > 5 && (
          <Link to="/clientes" className="block mt-4">
            <Button variant="ghost" className="w-full text-white hover:bg-white/20 hover:text-white">
              Ver todos os {aniversariantes.length} aniversariantes
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}