import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LGPDPanel } from '@/components/lgpd/LGPDPanel';
import { LGPD_INFO } from '@/lib/lgpd-config';

export default function MeusDadosPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>

        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="text-3xl font-bold">Meus Dados</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-8">
          Exerça seus direitos garantidos pela LGPD (Lei nº 13.709/2018).
          Encarregado (DPO): <a href={`mailto:${LGPD_INFO.emailDPO}`} className="text-primary underline">{LGPD_INFO.emailDPO}</a>.
        </p>

        <LGPDPanel />
      </div>
    </div>
  );
}
