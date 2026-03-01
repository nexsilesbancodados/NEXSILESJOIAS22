import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PoliticaPrivacidadePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>

        <h1 className="text-3xl font-bold mb-8">Política de Privacidade</h1>
        <p className="text-sm text-muted-foreground mb-8">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Informações que Coletamos</h2>
            <p>Coletamos informações que você nos fornece diretamente ao criar uma conta, incluindo nome, e-mail, telefone e dados relacionados ao seu negócio de semijoias. Também coletamos dados de uso da plataforma para melhorar nossos serviços.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">2. Como Utilizamos suas Informações</h2>
            <p>Utilizamos suas informações para: fornecer e manter nossos serviços; processar transações; enviar comunicações relacionadas ao serviço; melhorar a experiência do usuário; cumprir obrigações legais.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">3. Compartilhamento de Dados</h2>
            <p>Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros para fins de marketing. Podemos compartilhar dados com provedores de serviço que nos auxiliam na operação da plataforma (processadores de pagamento, serviços de hospedagem).</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">4. Segurança</h2>
            <p>Implementamos medidas técnicas e organizacionais para proteger suas informações pessoais contra acesso não autorizado, alteração ou destruição. Seus dados são armazenados com criptografia e isolamento por tenant (multi-tenant).</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">5. Seus Direitos (LGPD)</h2>
            <p>De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a: acessar seus dados; corrigir dados incompletos ou incorretos; solicitar a exclusão de seus dados; revogar consentimento; solicitar portabilidade dos dados.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Cookies</h2>
            <p>Utilizamos cookies e tecnologias similares para manter sua sessão, lembrar preferências e analisar o uso da plataforma. Você pode configurar seu navegador para recusar cookies.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">7. Contato</h2>
            <p>Para dúvidas sobre esta política ou para exercer seus direitos, entre em contato pelo e-mail: contato@nexsiles.com.br</p>
          </section>
        </div>
      </div>
    </div>
  );
}
