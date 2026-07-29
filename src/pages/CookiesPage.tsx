import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { COOKIE_CONSENT_KEY, LGPD_INFO } from '@/lib/lgpd-config';
import { toast } from 'sonner';

export default function CookiesPage() {
  const navigate = useNavigate();

  const resetConsent = () => {
    localStorage.removeItem(COOKIE_CONSENT_KEY);
    localStorage.removeItem('cookie_consent');
    toast.success('Preferências apagadas. O banner voltará no próximo acesso.');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>

        <h1 className="text-3xl font-bold mb-2">Política de Cookies</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Como utilizamos cookies e tecnologias similares em conformidade com a LGPD.
        </p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-xl font-semibold text-foreground">O que são cookies?</h2>
            <p>Pequenos arquivos armazenados no seu dispositivo para lembrar preferências, manter sessão e medir uso.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">Categorias que usamos</h2>
            <div className="space-y-4">
              <div className="rounded-lg border border-border p-4">
                <p className="font-semibold text-foreground">1. Necessários (sempre ativos)</p>
                <p className="text-sm">Autenticação (Supabase), preferências de tema, carrinho da loja. Sem eles a plataforma não funciona.</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="font-semibold text-foreground">2. Analíticos (opcionais)</p>
                <p className="text-sm">Métricas agregadas de uso para melhorar a experiência. Nenhum dado pessoal identificável é enviado.</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="font-semibold text-foreground">3. Marketing (opcionais)</p>
                <p className="text-sm">Personalização de ofertas e remarketing na landing page. Só ativados com seu consentimento explícito.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">Gerenciar preferências</h2>
            <p>Você pode alterar suas preferências a qualquer momento clicando no botão abaixo:</p>
            <Button onClick={resetConsent} variant="outline" className="mt-3">
              Redefinir preferências de cookies
            </Button>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">Contato</h2>
            <p>Dúvidas sobre cookies: <a href={`mailto:${LGPD_INFO.emailDPO}`} className="text-primary underline">{LGPD_INFO.emailDPO}</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
