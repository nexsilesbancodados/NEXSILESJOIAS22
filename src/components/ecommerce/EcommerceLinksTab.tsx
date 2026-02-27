import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  ExternalLink, Copy, QrCode, Share2, Globe, 
  Smartphone, Monitor, Loader2, CheckCircle2
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useOrganization } from '@/hooks/useOrganization';

export function EcommerceLinksTab() {
  const [copied, setCopied] = useState('');
  const { organizationId } = useOrganization();

  const { data: config, isLoading } = useQuery({
    queryKey: ['ecommerce-config-links', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      const { data } = await supabase
        .from('ecommerce_config' as any)
        .select('slug, nome_loja, ativo')
        .eq('organization_id', organizationId)
        .maybeSingle();
      return data as any;
    },
    enabled: !!organizationId,
  });

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const lojaUrl = config?.slug ? `${baseUrl}/loja/${config.slug}` : '';

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success('Link copiado!');
    setTimeout(() => setCopied(''), 2000);
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: config?.nome_loja || 'Minha Loja', url: lojaUrl });
      } catch { /* cancelled */ }
    } else {
      copyToClipboard(lojaUrl, 'share');
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!config?.slug) {
    return (
      <div className="text-center py-16">
        <Globe className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Loja não configurada</h3>
        <p className="text-muted-foreground text-sm">Configure sua loja nas Configurações para obter o link.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Main Link */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Link da sua Loja</h3>
            {config.ativo && (
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Ativa
              </Badge>
            )}
          </div>

          <div className="flex gap-2">
            <Input value={lojaUrl} readOnly className="font-mono text-sm bg-background" />
            <Button
              variant="outline"
              onClick={() => copyToClipboard(lojaUrl, 'main')}
              className="flex-shrink-0 gap-1.5"
            >
              {copied === 'main' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              {copied === 'main' ? 'Copiado' : 'Copiar'}
            </Button>
            <Button onClick={() => window.open(lojaUrl, '_blank')} className="flex-shrink-0 gap-1.5">
              <ExternalLink className="w-4 h-4" />
              Abrir
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* QR Code */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <QrCode className="w-4 h-4 text-primary" />
              QR Code
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="bg-white p-4 rounded-xl shadow-inner">
              <QRCodeSVG value={lojaUrl} size={180} level="H" includeMargin />
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Imprima e coloque em cartões, embalagens ou vitrines
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 gap-1.5"
              onClick={() => {
                const svg = document.querySelector('.qr-container svg');
                if (svg) {
                  const data = new XMLSerializer().serializeToString(svg);
                  const blob = new Blob([data], { type: 'image/svg+xml' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `qrcode-${config.slug}.svg`;
                  a.click();
                }
              }}
            >
              Baixar QR Code
            </Button>
          </CardContent>
        </Card>

        {/* Share options */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Share2 className="w-4 h-4 text-primary" />
              Compartilhar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start gap-3" onClick={shareLink}>
              <Share2 className="w-4 h-4" />
              Compartilhar link
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={() => {
                const msg = encodeURIComponent(`Confira nossa loja! ${lojaUrl}`);
                window.open(`https://wa.me/?text=${msg}`, '_blank');
              }}
            >
              <Smartphone className="w-4 h-4" />
              Enviar via WhatsApp
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={() => copyToClipboard(`<iframe src="${lojaUrl}" width="100%" height="800" frameborder="0"></iframe>`, 'embed')}
            >
              <Monitor className="w-4 h-4" />
              {copied === 'embed' ? 'Código copiado!' : 'Copiar código embed'}
            </Button>

            <div className="p-3 rounded-lg bg-muted/50 mt-4">
              <p className="text-xs font-medium mb-1">💡 Dica</p>
              <p className="text-[10px] text-muted-foreground">
                Use o QR Code em embalagens e o link no Instagram/WhatsApp para atrair mais clientes!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
