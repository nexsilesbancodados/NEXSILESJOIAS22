import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useOrganization } from '@/hooks/useOrganization';
import { db } from '@/lib/supabase-db';
import { useQuery } from '@tanstack/react-query';
import { Search, Globe, CheckCircle2, XCircle, AlertTriangle, Eye, FileText, Share2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SEOCheck {
  label: string;
  status: 'ok' | 'warning' | 'error';
  message: string;
}

export function EcommerceSEOTab() {
  const { organization } = useOrganization();

  const { data: config } = useQuery({
    queryKey: ['ecommerce-seo', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      const { data } = await db.from('ecommerce_config')
        .select('*')
        .eq('organization_id', organization.id)
        .single();
      return data;
    },
    enabled: !!organization?.id,
  });

  const { data: pecas = [] } = useQuery({
    queryKey: ['ecommerce-seo-products', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await db.from('pecas')
        .select('id, nome, descricao, foto_url, disponivel_loja')
        .eq('organization_id', organization.id)
        .eq('disponivel_loja', true);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const checks: SEOCheck[] = [
    {
      label: 'Nome da Loja',
      status: config?.nome_loja ? 'ok' : 'error',
      message: config?.nome_loja ? `"${config.nome_loja}" configurado` : 'Defina o nome da loja',
    },
    {
      label: 'Descrição da Loja',
      status: config?.descricao ? (config.descricao.length >= 50 ? 'ok' : 'warning') : 'error',
      message: config?.descricao
        ? `${config.descricao.length} caracteres ${config.descricao.length < 50 ? '(recomendado: mín. 50)' : '✓'}`
        : 'Adicione uma descrição para SEO',
    },
    {
      label: 'Logo da Loja',
      status: config?.logo_url ? 'ok' : 'warning',
      message: config?.logo_url ? 'Logo configurado' : 'Adicione uma logo para melhor branding',
    },
    {
      label: 'Hero/Banner',
      status: config?.hero_titulo ? 'ok' : 'warning',
      message: config?.hero_titulo ? 'Hero configurado' : 'Configure o banner principal',
    },
    {
      label: 'WhatsApp',
      status: config?.whatsapp ? 'ok' : 'warning',
      message: config?.whatsapp ? 'WhatsApp configurado' : 'Adicione WhatsApp para contato',
    },
    {
      label: 'Política de Troca',
      status: config?.politica_troca ? 'ok' : 'warning',
      message: config?.politica_troca ? 'Política definida' : 'Defina política de trocas (confiança)',
    },
    {
      label: 'Produtos com Foto',
      status: (() => {
        const comFoto = pecas.filter((p: any) => p.foto_url).length;
        const total = pecas.length;
        if (total === 0) return 'warning';
        const pct = comFoto / total;
        return pct >= 0.8 ? 'ok' : pct >= 0.5 ? 'warning' : 'error';
      })(),
      message: `${pecas.filter((p: any) => p.foto_url).length}/${pecas.length} produtos com foto`,
    },
    {
      label: 'Produtos com Descrição',
      status: (() => {
        const comDesc = pecas.filter((p: any) => p.descricao && p.descricao.length > 10).length;
        const total = pecas.length;
        if (total === 0) return 'warning';
        const pct = comDesc / total;
        return pct >= 0.8 ? 'ok' : pct >= 0.5 ? 'warning' : 'error';
      })(),
      message: `${pecas.filter((p: any) => p.descricao && p.descricao.length > 10).length}/${pecas.length} com descrição`,
    },
    {
      label: 'Google Analytics',
      status: config?.google_analytics_id ? 'ok' : 'warning',
      message: config?.google_analytics_id ? 'GA configurado' : 'Configure para rastrear visitas',
    },
    {
      label: 'Facebook Pixel',
      status: config?.facebook_pixel_id ? 'ok' : 'warning',
      message: config?.facebook_pixel_id ? 'Pixel configurado' : 'Configure para remarketing',
    },
  ];

  const okCount = checks.filter(c => c.status === 'ok').length;
  const score = Math.round((okCount / checks.length) * 100);

  const getScoreColor = () => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-destructive';
  };

  return (
    <div className="space-y-6">
      {/* Score */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className={cn("text-4xl font-bold", getScoreColor())}>{score}</p>
              <p className="text-xs text-muted-foreground">SEO Score</p>
            </div>
            <div className="flex-1">
              <Progress value={score} className="h-3" />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>{okCount} de {checks.length} verificações OK</span>
                <span>{score >= 80 ? '🎉 Excelente!' : score >= 50 ? '⚠️ Pode melhorar' : '🔴 Precisa de atenção'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Google Preview */}
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Eye className="h-4 w-4" />Preview do Google</CardTitle></CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-primary text-lg hover:underline cursor-pointer">{config?.nome_loja || 'Nome da sua Loja'}</p>
            <p className="text-emerald-600 text-xs">loja.seudominio.com</p>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {config?.descricao || 'Adicione uma descrição para sua loja aparecer melhor nos resultados de busca.'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Checklist */}
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4" />Checklist de Otimização</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {checks.map((check, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30">
                {check.status === 'ok' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                ) : check.status === 'warning' ? (
                  <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{check.label}</p>
                  <p className="text-xs text-muted-foreground">{check.message}</p>
                </div>
                <Badge variant={check.status === 'ok' ? 'default' : check.status === 'warning' ? 'secondary' : 'destructive'} className="text-[10px]">
                  {check.status === 'ok' ? 'OK' : check.status === 'warning' ? 'Atenção' : 'Falta'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dicas */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <p className="text-sm font-medium mb-2">💡 Dicas de SEO para E-commerce</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Todos os produtos devem ter fotos de alta qualidade e descrições detalhadas</li>
            <li>• Configure Google Analytics e Facebook Pixel para rastrear conversões</li>
            <li>• Adicione política de trocas e privacidade para gerar confiança</li>
            <li>• Use o WhatsApp como canal de suporte para aumentar conversão</li>
            <li>• Compartilhe o link da loja nas redes sociais regularmente</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
