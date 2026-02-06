import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, MessageSquare, TrendingUp, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useFAQs, useCreateFAQ, useUpdateFAQ, useDeleteFAQ, FAQ } from '@/hooks/useFAQs';

export function FAQManager() {
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [formData, setFormData] = useState({
    pergunta: '',
    resposta: '',
    categoria: '',
    palavras_chave: '',
    ativo: true,
  });

  const { data: faqs = [], isLoading } = useFAQs();
  const createFAQ = useCreateFAQ();
  const updateFAQ = useUpdateFAQ();
  const deleteFAQ = useDeleteFAQ();

  const filteredFAQs = faqs.filter(faq => 
    faq.pergunta.toLowerCase().includes(search.toLowerCase()) ||
    faq.resposta.toLowerCase().includes(search.toLowerCase()) ||
    faq.categoria?.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenDialog = (faq?: FAQ) => {
    if (faq) {
      setEditingFAQ(faq);
      setFormData({
        pergunta: faq.pergunta,
        resposta: faq.resposta,
        categoria: faq.categoria || '',
        palavras_chave: faq.palavras_chave?.join(', ') || '',
        ativo: faq.ativo ?? true,
      });
    } else {
      setEditingFAQ(null);
      setFormData({
        pergunta: '',
        resposta: '',
        categoria: '',
        palavras_chave: '',
        ativo: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    const palavrasArray = formData.palavras_chave
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0);

    const data = {
      pergunta: formData.pergunta,
      resposta: formData.resposta,
      categoria: formData.categoria || null,
      palavras_chave: palavrasArray.length > 0 ? palavrasArray : null,
      ativo: formData.ativo,
    };

    if (editingFAQ) {
      updateFAQ.mutate({ id: editingFAQ.id, ...data }, {
        onSuccess: () => setIsDialogOpen(false),
      });
    } else {
      createFAQ.mutate(data, {
        onSuccess: () => setIsDialogOpen(false),
      });
    }
  };

  const handleDelete = (id: string) => {
    deleteFAQ.mutate(id);
  };

  const toggleActive = (faq: FAQ) => {
    updateFAQ.mutate({ id: faq.id, ativo: !faq.ativo });
  };

  const categorias = [...new Set(faqs.map(f => f.categoria).filter(Boolean))];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Lista de FAQs */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Respostas Rápidas / FAQ
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-1" />
                  Nova FAQ
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingFAQ ? 'Editar FAQ' : 'Nova FAQ'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="pergunta">Pergunta</Label>
                    <Textarea
                      id="pergunta"
                      value={formData.pergunta}
                      onChange={(e) => setFormData({ ...formData, pergunta: e.target.value })}
                      placeholder="Ex: Qual o prazo de entrega?"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="resposta">Resposta</Label>
                    <Textarea
                      id="resposta"
                      value={formData.resposta}
                      onChange={(e) => setFormData({ ...formData, resposta: e.target.value })}
                      placeholder="Ex: O prazo de entrega é de 3 a 5 dias úteis..."
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="categoria">Categoria</Label>
                      <Input
                        id="categoria"
                        value={formData.categoria}
                        onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                        placeholder="Ex: Entrega, Pagamento"
                        list="categorias"
                      />
                      <datalist id="categorias">
                        {categorias.map(cat => (
                          <option key={cat} value={cat || ''} />
                        ))}
                      </datalist>
                    </div>
                    <div>
                      <Label htmlFor="palavras_chave">Palavras-chave (separadas por vírgula)</Label>
                      <Input
                        id="palavras_chave"
                        value={formData.palavras_chave}
                        onChange={(e) => setFormData({ ...formData, palavras_chave: e.target.value })}
                        placeholder="prazo, entrega, demora"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="ativo"
                      checked={formData.ativo}
                      onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                    />
                    <Label htmlFor="ativo">Ativo</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={!formData.pergunta || !formData.resposta || createFAQ.isPending || updateFAQ.isPending}
                  >
                    {editingFAQ ? 'Salvar' : 'Criar'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar FAQs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando...
              </div>
            ) : filteredFAQs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">Nenhuma FAQ encontrada</p>
                <p className="text-sm">Crie sua primeira resposta rápida</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFAQs.map((faq) => (
                  <div
                    key={faq.id}
                    className={`p-4 rounded-lg border ${!faq.ativo ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{faq.pergunta}</span>
                          {!faq.ativo && (
                            <Badge variant="secondary">Inativo</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {faq.resposta}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {faq.categoria && (
                            <Badge variant="outline">
                              <Tag className="h-3 w-3 mr-1" />
                              {faq.categoria}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {faq.uso_count || 0} usos
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Switch
                          checked={faq.ativo ?? true}
                          onCheckedChange={() => toggleActive(faq)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(faq)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir FAQ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(faq.id)}>
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Sidebar Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Como funciona</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            As FAQs são respostas pré-definidas que o agente de IA usa para responder perguntas frequentes de forma consistente e rápida.
          </p>

          <div className="space-y-3">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-1">✨ Detecção Automática</p>
              <p className="text-xs text-muted-foreground">
                O agente identifica automaticamente quando uma pergunta se encaixa em uma FAQ
              </p>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-1">🎯 Palavras-chave</p>
              <p className="text-xs text-muted-foreground">
                Adicione palavras-chave para melhorar a precisão da detecção
              </p>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-1">📊 Métricas de Uso</p>
              <p className="text-xs text-muted-foreground">
                Acompanhe quantas vezes cada FAQ é utilizada
              </p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-2">Estatísticas</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-muted/50 rounded text-center">
                <p className="text-lg font-bold">{faqs.length}</p>
                <p className="text-xs text-muted-foreground">Total FAQs</p>
              </div>
              <div className="p-2 bg-muted/50 rounded text-center">
                <p className="text-lg font-bold">{faqs.filter(f => f.ativo).length}</p>
                <p className="text-xs text-muted-foreground">Ativas</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
