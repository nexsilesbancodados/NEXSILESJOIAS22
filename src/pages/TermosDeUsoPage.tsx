import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LGPD_INFO } from '@/lib/lgpd-config';

export default function TermosDeUsoPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>

        <h1 className="text-3xl font-bold mb-2">Termos de Uso</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Versão {LGPD_INFO.versaoTermos} — regidos pelas leis brasileiras (CDC, Marco Civil, LGPD).
        </p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Aceitação</h2>
            <p>
              Ao criar conta e utilizar o {LGPD_INFO.nomeFantasia}, você declara ter lido e concordado integralmente
              com estes Termos e com nossa <a href="/politica-privacidade" className="text-primary underline">Política de Privacidade</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">2. Identificação do Fornecedor</h2>
            <p>
              <strong>{LGPD_INFO.razaoSocial}</strong> — CNPJ {LGPD_INFO.cnpj} — {LGPD_INFO.endereco}, {LGPD_INFO.cidade}, CEP {LGPD_INFO.cep}.
              Contato: {LGPD_INFO.email}.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">3. Descrição do Serviço</h2>
            <p>
              O {LGPD_INFO.nomeFantasia} é um SaaS de gestão para negócios de semijoias, oferecendo dashboard,
              PDV, controle de estoque, gestão de revendedoras, catálogos, loja virtual, agente de IA e integrações.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">4. Plano e Preço</h2>
            <p>
              Plano único <strong>{LGPD_INFO.planoNome}</strong>, {LGPD_INFO.precoMensal}/mês, com todos os recursos incluídos.
              Sem taxas ocultas. Faturamento mensal recorrente via Mercado Pago ou Stripe.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">5. Direito de Arrependimento (CDC Art. 49)</h2>
            <p>
              Você pode desistir da contratação em até <strong>{LGPD_INFO.diasArrependimento} dias corridos</strong> após o pagamento,
              com reembolso integral, bastando solicitar via {LGPD_INFO.email}.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Cancelamento</h2>
            <p>
              Você pode cancelar a qualquer momento. O acesso permanece ativo até o fim do período pago.
              Não há multa de fidelidade.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">7. Uso Aceitável</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Não utilizar para atividades ilegais ou que violem direitos de terceiros.</li>
              <li>Não tentar burlar mecanismos de segurança ou multi-tenancy.</li>
              <li>Não realizar engenharia reversa nem redistribuir a plataforma.</li>
              <li>Manter informações fiscais e de clientes verídicas e atualizadas.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">8. Propriedade Intelectual</h2>
            <p>
              A plataforma, marca, código e design são de propriedade da {LGPD_INFO.razaoSocial}.
              Os dados inseridos por você permanecem de sua propriedade — você pode exportá-los a qualquer momento.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">9. Disponibilidade</h2>
            <p>
              Buscamos disponibilidade de 99,5% mensal, excluídas janelas de manutenção programada
              (comunicadas com 48h de antecedência).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">10. Limitação de Responsabilidade</h2>
            <p>
              O {LGPD_INFO.nomeFantasia} é ferramenta de gestão; não garantimos resultados comerciais específicos.
              Nossa responsabilidade, quando aplicável, limita-se ao valor pago nos últimos 12 meses.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">11. Suspensão</h2>
            <p>
              Podemos suspender contas com pagamento em atraso superior a 5 dias ou uso em violação a estes Termos,
              mediante notificação prévia por e-mail.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">12. Alterações</h2>
            <p>Alterações materiais nestes Termos serão comunicadas por e-mail com 15 dias de antecedência.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">13. Foro</h2>
            <p>
              Fica eleito o foro da comarca de {LGPD_INFO.cidade} para dirimir controvérsias, com renúncia a qualquer outro,
              por mais privilegiado que seja.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">14. Contato</h2>
            <p>Dúvidas: <a href={`mailto:${LGPD_INFO.email}`} className="text-primary underline">{LGPD_INFO.email}</a> — WhatsApp {LGPD_INFO.whatsappSuporte}.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
