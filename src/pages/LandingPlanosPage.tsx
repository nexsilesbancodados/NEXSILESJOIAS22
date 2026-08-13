import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Atalho de campanha para a tabela de preços.
 *
 * Antes redirecionava para `/planos`. Essa rota existe só dentro do app
 * autenticado — no subdomínio `lp.`, onde esta página é registrada, ela não
 * existe e caía no `Navigate to="/"`. Ou seja: o link de campanha dava a volta
 * e largava o visitante na home, sem nunca mostrar preço. E `/planos` exige
 * login, então nem faria sentido para quem ainda não é cliente.
 *
 * O destino certo é a seção de preços da própria landing (`#preco`), que é
 * pública. `/landing` está registrada nos dois ramos de rota, então o link
 * funciona tanto em `lp.` quanto no domínio principal.
 */
const LandingPlanosPage = () => {
  useEffect(() => {
    window.location.replace('/landing#preco');
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
};

export default LandingPlanosPage;
