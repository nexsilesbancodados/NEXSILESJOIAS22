import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Mail,
  Plus,
  Edit2,
  Trash2,
  Send,
  CheckCircle,
  XCircle,
  Eye,
  Copy,
  FileText,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { toast } from 'sonner';

interface EmailTemplate {
  id: string;
  nome: string;
  assunto: string;
  corpo_html: string;
  corpo_texto: string | null;
  tipo: string;
  ativo: boolean;
  variaveis: string[] | null;
  created_at: string;
}

interface EmailLog {
  id: string;
  destinatario_email: string;
  destinatario_nome: string | null;
  assunto: string;
  status: string;
  erro_mensagem: string | null;
  enviado_at: string | null;
  created_at: string;
}

const TEMPLATE_TYPES = [
  { value: 'confirmacao_pedido', label: 'Confirmação de Pedido' },
  { value: 'follow_up', label: 'Follow-up Pós-Atendimento' },
  { value: 'resumo_conversa', label: 'Resumo de Conversa' },
  { value: 'marketing', label: 'Marketing/Promoção' },
  { value: 'geral', label: 'Geral' }
];

const AVAILABLE_VARIABLES = [
  '{cliente_nome}',
  '{cliente_email}',
  '{pedido_numero}',
  '{pedido_valor}',
  '{pedido_itens}',
  '{data_hoje}',
  '{empresa_nome}',
  '{link_catalogo}'
];

export function EmailManager() {
  const { organizationId } = useOrganization();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [sendingTemplateId, setSendingTemplateId] = useState<string | null>(null);
  const [sendForm, setSendForm] = useState({
    destinatario_email: '',
    destinatario_nome: '',
    cliente_nome: '',
    empresa_nome: '',
    pedido_numero: '',
    pedido_valor: '',
    link_catalogo: '',
  });

  const [formData, setFormData] = useState({
    nome: '',
    assunto: '',
    corpo_html: '',
    corpo_texto: '',
    tipo: 'geral',
    ativo: true
  });

  // Fetch templates
  const { data: templates = [], isLoading: loadingTemplates } = useQuery({
    queryKey: ['email-templates', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('organization_id', organizationId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as EmailTemplate[];
    },
    enabled: !!organizationId
  });

  // Fetch logs
  const { data: logs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ['email-logs', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .eq('organization_id', organizationId!)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as EmailLog[];
    },
    enabled: !!organizationId
  });

  // Create/update template
  const saveMutation = useMutation({
    mutationFn: async () => {
      const variaveis = AVAILABLE_VARIABLES.filter(v => 
        formData.corpo_html.includes(v) || formData.assunto.includes(v)
      );

      const templateData = {
        ...formData,
        variaveis,
        organization_id: organizationId
      };

      if (editingTemplate) {
        const { error } = await supabase
          .from('email_templates')
          .update(templateData)
          .eq('id', editingTemplate.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('email_templates')
          .insert(templateData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingTemplate ? 'Template atualizado!' : 'Template criado!');
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      closeDialog();
    },
    onError: (error) => {
      console.error('Error saving template:', error);
      toast.error('Erro ao salvar template');
    }
  });

  // Delete template
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Template excluído!');
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
    }
  });

  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      if (!sendingTemplateId) throw new Error('Template não selecionado');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const variaveis: Record<string, string> = {};
      if (sendForm.cliente_nome) variaveis['{cliente_nome}'] = sendForm.cliente_nome;
      if (sendForm.empresa_nome) variaveis['{empresa_nome}'] = sendForm.empresa_nome;
      if (sendForm.pedido_numero) variaveis['{pedido_numero}'] = sendForm.pedido_numero;
      if (sendForm.pedido_valor) variaveis['{pedido_valor}'] = sendForm.pedido_valor;
      if (sendForm.link_catalogo) variaveis['{link_catalogo}'] = sendForm.link_catalogo;
      if (sendForm.destinatario_email) variaveis['{cliente_email}'] = sendForm.destinatario_email;

      const response = await fetch(
        `https://ljofnwcvpzqlhagejgbk.supabase.co/functions/v1/enviar-email-template`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            template_id: sendingTemplateId,
            destinatario_email: sendForm.destinatario_email,
            destinatario_nome: sendForm.destinatario_nome || sendForm.cliente_nome,
            variaveis,
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao enviar e-mail');
      }
      return result;
    },
    onSuccess: () => {
      toast.success('E-mail enviado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['email-logs'] });
      setSendDialogOpen(false);
      setSendingTemplateId(null);
      setSendForm({
        destinatario_email: '',
        destinatario_nome: '',
        cliente_nome: '',
        empresa_nome: '',
        pedido_numero: '',
        pedido_valor: '',
        link_catalogo: '',
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao enviar e-mail');
    }
  });

  // Seed default templates
  const seedMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('seed_default_email_templates', {
        p_organization_id: organizationId
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Templates padrão carregados!');
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
    },
    onError: (error) => {
      console.error('Error seeding templates:', error);
      toast.error('Erro ao carregar templates padrão');
    }
  });

  const openEditDialog = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData({
      nome: template.nome,
      assunto: template.assunto,
      corpo_html: template.corpo_html,
      corpo_texto: template.corpo_texto || '',
      tipo: template.tipo,
      ativo: template.ativo
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingTemplate(null);
    setFormData({
      nome: '',
      assunto: '',
      corpo_html: '',
      corpo_texto: '',
      tipo: 'geral',
      ativo: true
    });
  };

  const openSendDialog = (templateId: string) => {
    setSendingTemplateId(templateId);
    setSendDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'enviado':
        return <Badge className="bg-green-600 text-white"><CheckCircle className="h-3 w-3 mr-1" />Enviado</Badge>;
      case 'erro':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Erro</Badge>;
      case 'pendente':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'aberto':
        return <Badge className="bg-blue-600 text-white"><Eye className="h-3 w-3 mr-1" />Aberto</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const insertVariable = (variable: string) => {
    setFormData(prev => ({
      ...prev,
      corpo_html: prev.corpo_html + variable
    }));
  };

  const selectedTemplate = templates.find(t => t.id === sendingTemplateId);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <Mail className="h-4 w-4" />
            Histórico de Envios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Templates de E-mail
                </CardTitle>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => closeDialog()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Template
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingTemplate ? 'Editar Template' : 'Novo Template de E-mail'}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="nome">Nome do Template</Label>
                          <Input
                            id="nome"
                            value={formData.nome}
                            onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                            placeholder="Ex: Confirmação de Pedido"
                          />
                        </div>
                        <div>
                          <Label htmlFor="tipo">Tipo</Label>
                          <Select
                            value={formData.tipo}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, tipo: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TEMPLATE_TYPES.map(type => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="assunto">Assunto</Label>
                        <Input
                          id="assunto"
                          value={formData.assunto}
                          onChange={(e) => setFormData(prev => ({ ...prev, assunto: e.target.value }))}
                          placeholder="Ex: Seu pedido #{pedido_numero} foi confirmado!"
                        />
                      </div>

                      <div>
                        <Label>Variáveis Disponíveis</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {AVAILABLE_VARIABLES.map(v => (
                            <Button
                              key={v}
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => insertVariable(v)}
                              className="text-xs h-7"
                            >
                              {v}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="corpo_html">Corpo do E-mail (HTML)</Label>
                        <Textarea
                          id="corpo_html"
                          value={formData.corpo_html}
                          onChange={(e) => setFormData(prev => ({ ...prev, corpo_html: e.target.value }))}
                          placeholder="<h1>Olá, {cliente_nome}!</h1><p>Seu pedido foi confirmado...</p>"
                          className="min-h-[200px] font-mono text-sm"
                        />
                      </div>

                      <div>
                        <Label htmlFor="corpo_texto">Versão Texto (opcional)</Label>
                        <Textarea
                          id="corpo_texto"
                          value={formData.corpo_texto}
                          onChange={(e) => setFormData(prev => ({ ...prev, corpo_texto: e.target.value }))}
                          placeholder="Versão texto puro para clientes sem HTML..."
                          className="min-h-[100px]"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          checked={formData.ativo}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ativo: checked }))}
                        />
                        <Label>Template ativo</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
                      <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                        {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loadingTemplates ? (
                <div className="text-center py-8 text-muted-foreground">Carregando...</div>
              ) : templates.length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">Nenhum template criado ainda.</p>
                  <p className="text-sm text-muted-foreground mt-2 mb-4">
                    Crie templates para enviar e-mails automáticos ou carregue os templates padrão.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => seedMutation.mutate()}
                    disabled={seedMutation.isPending}
                  >
                    {seedMutation.isPending ? 'Carregando...' : 'Carregar Templates Padrão'}
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className="p-4 rounded-lg border hover:bg-muted/50 flex items-start justify-between"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{template.nome}</span>
                            <Badge variant={template.ativo ? 'default' : 'secondary'}>
                              {template.ativo ? 'Ativo' : 'Inativo'}
                            </Badge>
                            <Badge variant="outline">
                              {TEMPLATE_TYPES.find(t => t.value === template.tipo)?.label || template.tipo}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{template.assunto}</p>
                          {template.variaveis?.length ? (
                            <div className="flex gap-1 mt-2">
                              {template.variaveis.map(v => (
                                <Badge key={v} variant="outline" className="text-xs">
                                  {v}
                                </Badge>
                              ))}
                            </div>
                          ) : null}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Enviar e-mail"
                            onClick={() => openSendDialog(template.id)}
                            disabled={!template.ativo}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Preview"
                            onClick={() => setPreviewHtml(template.corpo_html)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Editar"
                            onClick={() => openEditDialog(template)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Excluir"
                            onClick={() => {
                              if (confirm('Excluir este template?')) {
                                deleteMutation.mutate(template.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Preview Dialog */}
          <Dialog open={!!previewHtml} onOpenChange={() => setPreviewHtml(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Preview do Template</DialogTitle>
              </DialogHeader>
              <div 
                className="p-4 bg-white rounded-lg border min-h-[300px]"
                dangerouslySetInnerHTML={{ __html: previewHtml || '' }}
              />
            </DialogContent>
          </Dialog>

          {/* Send Email Dialog */}
          <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-primary" />
                  Enviar E-mail
                </DialogTitle>
              </DialogHeader>
              {selectedTemplate && (
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-muted/50 border">
                    <p className="text-sm font-medium">Template: {selectedTemplate.nome}</p>
                    <p className="text-xs text-muted-foreground">{selectedTemplate.assunto}</p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="send-email">E-mail do destinatário *</Label>
                      <Input
                        id="send-email"
                        type="email"
                        value={sendForm.destinatario_email}
                        onChange={(e) => setSendForm(prev => ({ ...prev, destinatario_email: e.target.value }))}
                        placeholder="cliente@email.com"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="send-nome">Nome do destinatário</Label>
                      <Input
                        id="send-nome"
                        value={sendForm.destinatario_nome}
                        onChange={(e) => setSendForm(prev => ({ ...prev, destinatario_nome: e.target.value }))}
                        placeholder="Nome do cliente"
                      />
                    </div>

                    {selectedTemplate.variaveis?.length ? (
                      <>
                        <p className="text-sm font-medium text-muted-foreground pt-2 border-t">
                          Variáveis do template
                        </p>
                        {selectedTemplate.variaveis.includes('{cliente_nome}') && (
                          <div>
                            <Label>Nome do cliente</Label>
                            <Input
                              value={sendForm.cliente_nome}
                              onChange={(e) => setSendForm(prev => ({ ...prev, cliente_nome: e.target.value }))}
                              placeholder="Nome"
                            />
                          </div>
                        )}
                        {selectedTemplate.variaveis.includes('{empresa_nome}') && (
                          <div>
                            <Label>Nome da empresa</Label>
                            <Input
                              value={sendForm.empresa_nome}
                              onChange={(e) => setSendForm(prev => ({ ...prev, empresa_nome: e.target.value }))}
                              placeholder="Sua empresa"
                            />
                          </div>
                        )}
                        {selectedTemplate.variaveis.includes('{pedido_numero}') && (
                          <div>
                            <Label>Número do pedido</Label>
                            <Input
                              value={sendForm.pedido_numero}
                              onChange={(e) => setSendForm(prev => ({ ...prev, pedido_numero: e.target.value }))}
                              placeholder="12345"
                            />
                          </div>
                        )}
                        {selectedTemplate.variaveis.includes('{pedido_valor}') && (
                          <div>
                            <Label>Valor do pedido</Label>
                            <Input
                              value={sendForm.pedido_valor}
                              onChange={(e) => setSendForm(prev => ({ ...prev, pedido_valor: e.target.value }))}
                              placeholder="150,00"
                            />
                          </div>
                        )}
                        {selectedTemplate.variaveis.includes('{link_catalogo}') && (
                          <div>
                            <Label>Link do catálogo</Label>
                            <Input
                              value={sendForm.link_catalogo}
                              onChange={(e) => setSendForm(prev => ({ ...prev, link_catalogo: e.target.value }))}
                              placeholder="https://..."
                            />
                          </div>
                        )}
                      </>
                    ) : null}
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setSendDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => sendEmailMutation.mutate()}
                  disabled={sendEmailMutation.isPending || !sendForm.destinatario_email}
                >
                  {sendEmailMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar E-mail
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Send className="h-5 w-5" />
                Histórico de Envios
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingLogs ? (
                <div className="text-center py-8 text-muted-foreground">Carregando...</div>
              ) : logs.length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">Nenhum e-mail enviado ainda.</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 rounded-lg border hover:bg-muted/50 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{log.destinatario_email}</span>
                            {getStatusBadge(log.status)}
                          </div>
                          <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                            {log.assunto}
                          </p>
                          {log.erro_mensagem && (
                            <p className="text-xs text-destructive mt-1">{log.erro_mensagem}</p>
                          )}
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          {log.enviado_at ? (
                            format(new Date(log.enviado_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                          ) : (
                            format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
