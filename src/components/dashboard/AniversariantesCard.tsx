import { Cake, Gift, MessageCircle, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAniversariantesDoMes } from '@/hooks/useClientes';
import { openWhatsApp } from '@/lib/whatsapp';

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
    <div className="relative overflow-hidden bg-gradient-to-br from-rose-500 via-pink-500 to-pink-600 rounded-2xl p-5 shadow-sm transition-all duration-300 hover:shadow-lg">
      {/* Decorative wave pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg 
          className="absolute bottom-0 left-0 right-0 w-full h-24 opacity-40"
          viewBox="0 0 400 100" 
          preserveAspectRatio="none"
        >
          <path
            d="M0 60 C 80 40, 120 80, 200 50 C 280 20, 320 70, 400 40 L 400 100 L 0 100 Z"
            fill="rgba(255,255,255,0.15)"
          />
          <path
            d="M0 75 C 60 60, 140 90, 200 65 C 260 40, 340 85, 400 55 L 400 100 L 0 100 Z"
            fill="rgba(255,255,255,0.15)"
          />
        </svg>
      </div>

      <div className="relative flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Cake className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Aniversariantes</h3>
            <p className="text-xs text-white/60">{aniversariantes.length} em {mesAtual}</p>
          </div>
        </div>
        <button className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/20 hover:bg-white/30 text-white transition-colors">
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      <div className="relative space-y-2 max-h-[180px] overflow-y-auto">
        {aniversariantes.slice(0, 5).map((cliente) => (
          <div 
            key={cliente.id} 
            className={`flex items-center justify-between p-3 rounded-xl backdrop-blur-sm ${
              isToday(cliente.data_nascimento!) 
                ? 'bg-white/30 border border-white/40' 
                : 'bg-white/10 border border-white/20'
            }`}
          >
            <div className="flex items-center gap-2">
              {isToday(cliente.data_nascimento!) && <Gift className="w-4 h-4 text-white animate-pulse" />}
              <div>
                <p className="font-medium text-sm text-white">{cliente.nome}</p>
                <p className="text-xs text-white/70">
                  {formatDate(cliente.data_nascimento!)}{isToday(cliente.data_nascimento!) && ' - Hoje!'}
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
    </div>
  );
}