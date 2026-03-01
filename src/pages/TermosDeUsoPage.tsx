import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TermosDeUsoPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>

        <h1 className="text-3xl font-bold mb-8">Termos de Uso</h1>
        <p className="text-sm text-muted-foreground mb-8">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Aceitação dos Termos</h2>
            <p>Ao acessar e utilizar a plataforma Nexsiles, você concorda com estes Termos de Uso. Se não concordar com qualquer parte destes termos, não utilize o serviço.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">2. Descrição do Serviço</h2>
            <p>O Nexsiles é uma plataforma SaaS de gestão para negócios de semijoias, oferecendo funcionalidades como dashboard, PDV, controle de estoque, gestão de revendedoras, loja virtual e assistente de IA. Os recursos disponíveis variam de acordo com o plano contratado.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">3. Período de Teste</h2>
            <p>Oferecemos um período de teste gratuito de 3 dias. Após o término do teste, a assinatura será cobrada conforme o plano escolhido. Você pode cancelar a qualquer momento durante o período de teste sem nenhum custo.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">4. Pagamento e Cancelamento</h2>
            <p>Os pagamentos são processados mensalmente. Você pode cancelar sua assinatura a qualquer momento. O cancelamento entra em vigor ao final do período de cobrança vigente.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">5. Responsabilidades do Usuário</h2>
            <p>Você é responsável por manter a confidencialidade de suas credenciais de acesso e por todas as atividades realizadas em sua conta. Os dados inseridos na plataforma são de sua responsabilidade.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Limitação de Responsabilidade</h2>
            <p>O Nexsiles é fornecido "como está". Não garantimos resultados específicos de vendas ou desempenho comercial. A plataforma é uma ferramenta de gestão e os resultados dependem do uso e dedicação de cada usuário.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">7. Propriedade Intelectual</h2>
            <p>Todo o conteúdo, design e funcionalidades da plataforma são propriedade do Nexsiles. Os dados inseridos pelo usuário permanecem de propriedade do usuário.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">8. Contato</h2>
            <p>Para dúvidas sobre estes termos, entre em contato pelo e-mail: contato@nexsiles.com.br</p>
          </section>
        </div>
      </div>
    </div>
  );
}
