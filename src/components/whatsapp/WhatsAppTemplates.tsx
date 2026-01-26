import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MessageCircle,
  Copy,
  Check,
  Gift,
  Package,
  ShoppingBag,
  AlertCircle,
  Megaphone,
  Star,
  Plus,
  Save,
  Trash2,
  FileText,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { openWhatsApp, openWhatsAppWithoutPhone } from '@/lib/whatsapp';
import { useWhatsAppTemplates, type WhatsAppTemplate as CustomTemplate } from '@/hooks/useWhatsAppTemplates';

interface DefaultTemplate {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'vendas' | 'maletas' | 'promocoes' | 'relacionamento';
  template: string;
  variables: string[];
}

const DEFAULT_TEMPLATES: DefaultTemplate[] = [
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

type SelectedTemplate = {
  type: 'default' | 'custom';
  id: string;
  name: string;
  template: string;
  variables: string[];
  category?: string;
};

export function WhatsAppTemplates({ open, onOpenChange }: WhatsAppTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<SelectedTemplate | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [phone, setPhone] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'padrao' | 'meus'>('padrao');
  
  // Custom template creation
  const [isCreating, setIsCreating] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateMessage, setNewTemplateMessage] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const { templates: customTemplates, isLoading, createTemplate, deleteTemplate } = useWhatsAppTemplates();

  const handleSelectDefaultTemplate = (template: DefaultTemplate) => {
    setSelectedTemplate({
      type: 'default',
      id: template.id,
      name: template.name,
      template: template.template,
      variables: template.variables,
      category: template.category,
    });
    const initialVariables: Record<string, string> = {};
    template.variables.forEach((v) => {
      initialVariables[v] = '';
    });
    setVariables(initialVariables);
    setIsCreating(false);
  };

  const handleSelectCustomTemplate = (template: CustomTemplate) => {
    setSelectedTemplate({
      type: 'custom',
      id: template.id,
      name: template.nome,
      template: template.mensagem,
      variables: template.variaveis || [],
      category: template.categoria,
    });
    const initialVariables: Record<string, string> = {};
    (template.variaveis || []).forEach((v: string) => {
      initialVariables[v] = '';
    });
    setVariables(initialVariables);
    setIsCreating(false);
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
      personalizado: 'Personalizado',
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      vendas: 'bg-green-100 text-green-700',
      maletas: 'bg-blue-100 text-blue-700',
      promocoes: 'bg-purple-100 text-purple-700',
      relacionamento: 'bg-orange-100 text-orange-700',
      personalizado: 'bg-pink-100 text-pink-700',
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  // Extract variables from message template
  const extractVariables = (message: string): string[] => {
    const regex = /\{([^}]+)\}/g;
    const matches = message.match(regex);
    if (!matches) return [];
    return [...new Set(matches.map(m => m.replace(/[{}]/g, '')))];
  };

  const handleStartCreate = () => {
    setIsCreating(true);
    setSelectedTemplate(null);
    setNewTemplateName('');
    setNewTemplateMessage('');
  };

  const handleSaveTemplate = () => {
    if (!newTemplateName.trim()) {
      toast.error('Digite um nome para o template');
      return;
    }
    if (!newTemplateMessage.trim()) {
      toast.error('Digite a mensagem do template');
      return;
    }
    
    const variables = extractVariables(newTemplateMessage);
    
    createTemplate.mutate({
      nome: newTemplateName.trim(),
      mensagem: newTemplateMessage.trim(),
      variaveis: variables,
    }, {
      onSuccess: () => {
        setIsCreating(false);
        setNewTemplateName('');
        setNewTemplateMessage('');
        setActiveTab('meus');
      }
    });
  };

  const handleDeleteTemplate = (id: string) => {
    deleteTemplate.mutate(id, {
      onSuccess: () => {
        setDeleteConfirmId(null);
        if (selectedTemplate?.id === id) {
          setSelectedTemplate(null);
        }
      }
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-600" />
              Templates de Mensagens WhatsApp
            </DialogTitle>
            <DialogDescription>
              Escolha um template ou crie o seu próprio
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
            {/* Template List */}
            <div className="w-1/2 flex flex-col min-h-0">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'padrao' | 'meus')} className="flex flex-col min-h-0">
                <TabsList className="grid w-full grid-cols-2 mb-2">
                  <TabsTrigger value="padrao">Padrão</TabsTrigger>
                  <TabsTrigger value="meus">Meus Templates</TabsTrigger>
                </TabsList>
                
                <TabsContent value="padrao" className="flex-1 min-h-0 mt-0">
                  <ScrollArea className="h-[400px] pr-2">
                    <div className="space-y-2">
                      {DEFAULT_TEMPLATES.map((template) => {
                        const Icon = template.icon;
                        return (
                          <Card
                            key={template.id}
                            className={`cursor-pointer transition-colors ${
                              selectedTemplate?.id === template.id && selectedTemplate?.type === 'default'
                                ? 'border-primary bg-primary/5'
                                : 'hover:bg-muted/50'
                            }`}
                            onClick={() => handleSelectDefaultTemplate(template)}
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
                </TabsContent>
                
                <TabsContent value="meus" className="flex-1 min-h-0 mt-0">
                  <div className="mb-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full gap-2"
                      onClick={handleStartCreate}
                    >
                      <Plus className="w-4 h-4" />
                      Criar Novo Template
                    </Button>
                  </div>
                  <ScrollArea className="h-[360px] pr-2">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : customTemplates.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Nenhum template personalizado</p>
                        <p className="text-xs">Crie seu primeiro template!</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {customTemplates.map((template) => (
                          <Card
                            key={template.id}
                            className={`cursor-pointer transition-colors ${
                              selectedTemplate?.id === template.id && selectedTemplate?.type === 'custom'
                                ? 'border-primary bg-primary/5'
                                : 'hover:bg-muted/50'
                            }`}
                            onClick={() => handleSelectCustomTemplate(template)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center flex-shrink-0">
                                  <FileText className="w-5 h-5 text-pink-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-medium text-sm">{template.nome}</h4>
                                      <Badge
                                        variant="secondary"
                                        className="text-xs bg-pink-100 text-pink-700"
                                      >
                                        Personalizado
                                      </Badge>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-destructive hover:text-destructive"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteConfirmId(template.id);
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {template.mensagem.substring(0, 80)}...
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>

            {/* Template Editor */}
            <div className="w-1/2 flex flex-col min-h-0">
              {isCreating ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome do Template</Label>
                    <Input
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      placeholder="Ex: Boas-vindas Cliente"
                      maxLength={100}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mensagem</Label>
                    <Textarea
                      value={newTemplateMessage}
                      onChange={(e) => setNewTemplateMessage(e.target.value)}
                      placeholder={`Digite sua mensagem...

Use {variavel} para criar campos dinâmicos.
Ex: Olá, {nome}! Seu pedido {numero} está pronto.`}
                      className="min-h-[200px] resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      Use {'{'}variavel{'}'} para criar campos que podem ser preenchidos depois
                    </p>
                  </div>
                  {newTemplateMessage && extractVariables(newTemplateMessage).length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm">Variáveis detectadas:</Label>
                      <div className="flex flex-wrap gap-1">
                        {extractVariables(newTemplateMessage).map((v) => (
                          <Badge key={v} variant="outline" className="text-xs">
                            {'{' + v + '}'}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <Button 
                    onClick={handleSaveTemplate} 
                    className="w-full gap-2"
                    disabled={createTemplate.isPending}
                  >
                    {createTemplate.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Salvar Template
                  </Button>
                </div>
              ) : selectedTemplate ? (
                <>
                  {/* Variables Form */}
                  {selectedTemplate.variables.length > 0 && (
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
                  )}

                  {/* Preview */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Pré-visualização:</Label>
                    <div className="border rounded-lg bg-gradient-to-br from-green-50 to-green-100/50 p-4 min-h-[150px] max-h-[200px] overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm font-sans">
                        {getFormattedMessage()}
                      </pre>
                    </div>
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
                    <p className="text-sm mt-1">ou crie um novo template personalizado</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            {selectedTemplate && !isCreating && (
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Template?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O template será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteConfirmId && handleDeleteTemplate(deleteConfirmId)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
