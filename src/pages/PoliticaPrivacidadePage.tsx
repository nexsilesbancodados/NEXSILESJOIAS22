import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LGPD_INFO } from '@/lib/lgpd-config';

export default function PoliticaPrivacidadePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>

        <h1 className="text-3xl font-bold mb-2">Política de Privacidade</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Versão {LGPD_INFO.versaoPrivacidade} — em conformidade com a Lei nº 13.709/2018 (LGPD)
        </p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Controlador dos Dados</h2>
            <p>
              O tratamento de dados pessoais nesta plataforma é realizado por <strong>{LGPD_INFO.razaoSocial}</strong>,
              inscrita no CNPJ {LGPD_INFO.cnpj}, com sede em {LGPD_INFO.endereco}, {LGPD_INFO.cidade}, CEP {LGPD_INFO.cep}.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">2. Encarregado (DPO)</h2>
            <p>
              Nosso Encarregado pelo Tratamento de Dados Pessoais é {LGPD_INFO.nomeDPO}.
              Contato: <a href={`mailto:${LGPD_INFO.emailDPO}`} className="text-primary underline">{LGPD_INFO.emailDPO}</a> — {LGPD_INFO.telefoneDPO}.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">3. Dados que Coletamos</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Cadastro:</strong> nome, e-mail, telefone, CPF/CNPJ, endereço.</li>
              <li><strong>Uso:</strong> logs de acesso, IP, dispositivo, páginas visitadas.</li>
              <li><strong>Financeiros:</strong> dados de pagamento processados pelo Mercado Pago/Stripe (não armazenamos dados de cartão).</li>
              <li><strong>Operacionais:</strong> produtos, clientes, vendas e demais dados inseridos por você para gestão do seu negócio.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">4. Bases Legais (Art. 7º LGPD)</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Execução de contrato:</strong> para prestar o serviço contratado.</li>
              <li><strong>Consentimento:</strong> comunicações de marketing e cookies não essenciais.</li>
              <li><strong>Obrigação legal:</strong> emissão fiscal e retenção contábil.</li>
              <li><strong>Legítimo interesse:</strong> segurança, prevenção a fraude e melhoria do serviço.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">5. Compartilhamento</h2>
            <p>Compartilhamos dados apenas com operadores essenciais à prestação do serviço:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Supabase (hospedagem e banco de dados)</li>
              <li>Mercado Pago e Stripe (processamento de pagamento)</li>
              <li>Brevo e Resend (envio de e-mails transacionais)</li>
              <li>Evolution API (integração WhatsApp, quando ativada)</li>
              <li>DeepSeek (IA de atendimento, quando ativada)</li>
            </ul>
            <p>Nunca vendemos seus dados. Todos os operadores possuem contrato de tratamento adequado.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Retenção</h2>
            <p>
              Mantemos seus dados enquanto sua conta estiver ativa. Após solicitação de exclusão,
              observamos período de carência de {LGPD_INFO.diasCarenciaExclusao} dias e depois removemos definitivamente,
              exceto quando obrigados por lei (registros fiscais por 5 anos, conforme Código Tributário).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">7. Seus Direitos (Art. 18 LGPD)</h2>
            <p>Você pode, a qualquer momento:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Confirmar a existência de tratamento</li>
              <li>Acessar e corrigir seus dados</li>
              <li>Solicitar portabilidade (export JSON em <em>Meus Dados</em>)</li>
              <li>Solicitar exclusão (em <em>Meus Dados</em>)</li>
              <li>Revogar consentimento</li>
              <li>Solicitar informações sobre compartilhamento</li>
            </ul>
            <p>Para exercer seus direitos: <a href={`mailto:${LGPD_INFO.emailDPO}`} className="text-primary underline">{LGPD_INFO.emailDPO}</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">8. Segurança</h2>
            <p>
              Adotamos criptografia em trânsito (TLS 1.2+), isolamento multi-tenant por Row Level Security,
              controle de acesso por perfil, monitoramento de anomalias e backups automáticos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">9. Cookies</h2>
            <p>
              Utilizamos cookies necessários (sessão, autenticação), analíticos (uso agregado) e de marketing (opcional).
              Gerencie suas preferências no banner de cookies ou na página <a href="/cookies" className="text-primary underline">/cookies</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">10. Menores de Idade</h2>
            <p>O serviço não é destinado a menores de 18 anos.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">11. Alterações</h2>
            <p>Alterações materiais serão comunicadas por e-mail com 15 dias de antecedência.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">12. ANPD</h2>
            <p>
              Em caso de discordância, você pode registrar reclamação na Autoridade Nacional de Proteção de Dados
              (<a href="https://www.gov.br/anpd" target="_blank" rel="noreferrer" className="text-primary underline">anpd.gov.br</a>).
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
