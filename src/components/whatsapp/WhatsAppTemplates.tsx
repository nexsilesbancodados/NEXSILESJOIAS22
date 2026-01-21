import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  MessageCircle,
  Edit,
  Copy,
  Check,
  Gift,
  Package,
  ShoppingBag,
  AlertCircle,
  Megaphone,
  Star,
} from 'lucide-react';
import { toast } from 'sonner';
import { openWhatsApp, openWhatsAppWithoutPhone } from '@/lib/whatsapp';

interface WhatsAppTemplate {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'vendas' | 'maletas' | 'promocoes' | 'relacionamento';
  template: string;
  variables: string[];
}

const DEFAULT_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: 'pedido_confirmacao',
    name: 'Confirmação de Pedido',
    icon: ShoppingBag,
    category: 'vendas',
    template: `Olá, {cliente_nome}! 🎉

Seu pedido foi confirmado com sucesso!

📦 *Pedido #{pedido_id}*
💰 Valor: {valor_total}
📅 Data: {data}

Obrigado por comprar conosco! ✨`,
    variables: ['cliente_nome', 'pedido_id', 'valor_total', 'data'],
  },
  {
    id: 'maleta_lembrete',
    name: 'Lembrete de Devolução de Maleta',
    icon: Package,
    category: 'maletas',
    template: `Olá, {revendedora_nome}! 👋

Lembramos que a maleta *{maleta_codigo}* está prevista para devolução em *{data_devolucao}*.

📦 Quantidade de peças: {qtd_pecas}
💰 Valor total: {valor_total}

Por favor, entre em contato para agendar a devolução.

Obrigada! 💎`,
    variables: ['revendedora_nome', 'maleta_codigo', 'data_devolucao', 'qtd_pecas', 'valor_total'],
  },
  {
    id: 'maleta_vencida',
    name: 'Maleta Vencida',
    icon: AlertCircle,
    category: 'maletas',
    template: `Olá, {revendedora_nome}! ⚠️

A maleta *{maleta_codigo}* estava prevista para devolução em *{data_devolucao}* e ainda não foi retornada.

📦 Quantidade de peças: {qtd_pecas}
💰 Valor total: {valor_total}

Por favor, entre em contato urgente para regularização.

Aguardamos seu retorno! 📞`,
    variables: ['revendedora_nome', 'maleta_codigo', 'data_devolucao', 'qtd_pecas', 'valor_total'],
  },
  {
    id: 'aniversario',
    name: 'Parabéns pelo Aniversário',
    icon: Gift,
    category: 'relacionamento',
    template: `🎂 *Feliz Aniversário, {cliente_nome}!* 🎉

A equipe {nome_loja} deseja um dia repleto de alegrias!

Como presente especial, oferecemos *{desconto}% de desconto* em qualquer compra válido por 7 dias.

Use o cupom: *{cupom}*

Aproveite! 💎✨`,
    variables: ['cliente_nome', 'nome_loja', 'desconto', 'cupom'],
  },
  {
    id: 'promocao_geral',
    name: 'Promoção Geral',
    icon: Megaphone,
    category: 'promocoes',
    template: `✨ *PROMOÇÃO IMPERDÍVEL* ✨

Olá! Temos novidades para você!

{descricao_promocao}

📅 Válido até: {data_fim}
🎁 Desconto: {desconto}

Não perca essa oportunidade! 💎

Acesse nosso catálogo: {link_catalogo}`,
    variables: ['descricao_promocao', 'data_fim', 'desconto', 'link_catalogo'],
  },
  {
    id: 'cliente_fiel',
    name: 'Agradecimento Cliente Fiel',
    icon: Star,
    category: 'relacionamento',
    template: `Olá, {cliente_nome}! 💎

Queremos agradecer por fazer parte da nossa história!

Você já realizou *{qtd_compras} compras* conosco e isso é muito especial para nós.

Como forma de agradecimento, você ganhou *{desconto}% de desconto* na próxima compra!

Use o cupom: *{cupom}*

Obrigado pela confiança! ✨`,
    variables: ['cliente_nome', 'qtd_compras', 'desconto', 'cupom'],
  },
];

interface WhatsAppTemplatesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WhatsAppTemplates({ open, onOpenChange }: WhatsAppTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [phone, setPhone] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSelectTemplate = (template: WhatsAppTemplate) => {
    setSelectedTemplate(template);
    // Initialize variables with empty values
    const initialVariables: Record<string, string> = {};
    template.variables.forEach((v) => {
      initialVariables[v] = '';
    });
    setVariables(initialVariables);
  };

  const handleVariableChange = (variable: string, value: string) => {
    setVariables({ ...variables, [variable]: value });
  };

  const getFormattedMessage = () => {
    if (!selectedTemplate) return '';
    let message = selectedTemplate.template;
    Object.entries(variables).forEach(([key, value]) => {
      message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), value || `{${key}}`);
    });
    return message;
  };

  const handleSendWhatsApp = () => {
    const message = getFormattedMessage();
    if (phone) {
      openWhatsApp(phone, message);
    } else {
      openWhatsAppWithoutPhone(message);
    }
  };

  const handleCopyMessage = () => {
    const message = getFormattedMessage();
    navigator.clipboard.writeText(message);
    setCopiedId(selectedTemplate?.id || null);
    toast.success('Mensagem copiada!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      vendas: 'Vendas',
      maletas: 'Maletas',
      promocoes: 'Promoções',
      relacionamento: 'Relacionamento',
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      vendas: 'bg-green-100 text-green-700',
      maletas: 'bg-blue-100 text-blue-700',
      promocoes: 'bg-purple-100 text-purple-700',
      relacionamento: 'bg-orange-100 text-orange-700',
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-600" />
            Templates de Mensagens WhatsApp
          </DialogTitle>
          <DialogDescription>
            Escolha um template e personalize a mensagem
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
          {/* Template List */}
          <ScrollArea className="w-1/2 pr-2">
            <div className="space-y-2">
              {DEFAULT_TEMPLATES.map((template) => {
                const Icon = template.icon;
                return (
                  <Card
                    key={template.id}
                    className={`cursor-pointer transition-colors ${
                      selectedTemplate?.id === template.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">{template.name}</h4>
                            <Badge
                              variant="secondary"
                              className={`text-xs ${getCategoryColor(template.category)}`}
                            >
                              {getCategoryLabel(template.category)}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {template.template.substring(0, 80)}...
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>

          {/* Template Editor */}
          <div className="w-1/2 flex flex-col min-h-0">
            {selectedTemplate ? (
              <>
                {/* Variables Form */}
                <div className="mb-4 space-y-3">
                  <Label className="text-sm font-medium">Preencha as variáveis:</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedTemplate.variables.map((variable) => (
                      <div key={variable} className="space-y-1">
                        <Label className="text-xs text-muted-foreground capitalize">
                          {variable.replace(/_/g, ' ')}
                        </Label>
                        <Input
                          size={1}
                          value={variables[variable] || ''}
                          onChange={(e) => handleVariableChange(variable, e.target.value)}
                          placeholder={variable}
                          className="h-8 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div className="flex-1 min-h-0 flex flex-col">
                  <Label className="text-sm font-medium mb-2">Pré-visualização:</Label>
                  <ScrollArea className="flex-1 border rounded-lg bg-gradient-to-br from-green-50 to-green-100/50 p-4">
                    <pre className="whitespace-pre-wrap text-sm font-sans">
                      {getFormattedMessage()}
                    </pre>
                  </ScrollArea>
                </div>

                {/* Phone Input */}
                <div className="mt-4 space-y-2">
                  <Label className="text-sm">Telefone (opcional)</Label>
                  <Input
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Selecione um template para editar</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          {selectedTemplate && (
            <>
              <Button variant="outline" onClick={handleCopyMessage} className="gap-2">
                {copiedId === selectedTemplate.id ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                Copiar
              </Button>
              <Button onClick={handleSendWhatsApp} className="gap-2 bg-green-600 hover:bg-green-700">
                <MessageCircle className="w-4 h-4" />
                Enviar WhatsApp
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
