import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { MiniGradientCard } from '@/components/dashboard/MiniGradientCard';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, Plus, MoreHorizontal, Pencil, Trash2, Cake, MessageCircle, Loader2, UserCircle, MessageSquare, Upload } from 'lucide-react';
import { useClientes, useAddCliente, useUpdateCliente, useDeleteCliente, Cliente } from '@/hooks/useClientes';
import { openWhatsApp } from '@/lib/whatsapp';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { ValidatedInput } from '@/components/ui/validated-input';
import { toast } from 'sonner';
import { WhatsAppTemplates } from '@/components/whatsapp/WhatsAppTemplates';
import { ReadOnlyGuard } from '@/components/subscription/ReadOnlyGuard';
import { ImportacaoClientesModal } from '@/components/clientes/ImportacaoClientesModal';

export default function ClientesPage() {
  const { data: clientes = [], isLoading } = useClientes();
  const { mutate: addCliente } = useAddCliente();
  const { mutate: updateCliente } = useUpdateCliente();
  const { mutate: deleteCliente } = useDeleteCliente();

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [formData, setFormData] = useState({ nome: '', telefone: '', email: '', cpf: '', data_nascimento: '', endereco: '' });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isWhatsAppTemplatesOpen, setIsWhatsAppTemplatesOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const filteredClientes = clientes.filter(c => 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.telefone?.includes(searchTerm)
  );

  const isAniversariante = (data: string | null) => {
    if (!data) return false;
    const hoje = new Date();
    const nascimento = new Date(data);
    return nascimento.getMonth() === hoje.getMonth();
  };

  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'nome':
        if (!value.trim()) return 'Nome é obrigatório';
        if (value.trim().length < 2) return 'Nome deve ter pelo menos 2 caracteres';
        break;
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Email inválido';
        break;
      case 'telefone':
        if (value && !/^\d{10,11}$/.test(value.replace(/\D/g, ''))) return 'Telefone inválido (10-11 dígitos)';
        break;
      case 'cpf':
        if (value && !/^\d{11}$/.test(value.replace(/\D/g, ''))) return 'CPF inválido (11 dígitos)';
        break;
    }
    return '';
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (touched[field]) {
      const error = validateField(field, value);
      setFormErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const handleFieldBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field as keyof typeof formData]);
    setFormErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleOpenForm = (cliente?: Cliente) => {
    setTouched({});
    setFormErrors({});
    if (cliente) {
      setSelectedCliente(cliente);
      setFormData({
        nome: cliente.nome,
        telefone: cliente.telefone || '',
        email: cliente.email || '',
        cpf: cliente.cpf || '',
        data_nascimento: cliente.data_nascimento || '',
        endereco: cliente.endereco || '',
      });
    } else {
      setSelectedCliente(null);
      setFormData({ nome: '', telefone: '', email: '', cpf: '', data_nascimento: '', endereco: '' });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    // Validate all fields
    const allTouched = Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {});
    setTouched(allTouched);
    
    const errors: Record<string, string> = {};
    Object.keys(formData).forEach(field => {
      const error = validateField(field, formData[field as keyof typeof formData]);
      if (error) errors[field] = error;
    });
    setFormErrors(errors);

    if (Object.values(errors).some(e => e)) {
      toast.error('Corrija os erros do formulário');
      return;
    }

    const data = {
      nome: formData.nome,
      telefone: formData.telefone || null,
      email: formData.email || null,
      cpf: formData.cpf || null,
      data_nascimento: formData.data_nascimento || null,
      endereco: formData.endereco || null,
      cidade: null,
      estado: null,
      cep: null,
      observacoes: null,
      pontos_fidelidade: null,
      ativo: true,
      whatsapp: null,
      organization_id: null,
    };
    if (selectedCliente) {
      updateCliente({ id: selectedCliente.id, ...data });
    } else {
      addCliente(data);
    }
    setIsDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 animate-fade-in">
      <PageHeader
        icon={UserCircle}
        title="Clientes"
        subtitle="Gerencie seus clientes e acompanhe o histórico"
      >
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsWhatsAppTemplatesOpen(true)} className="gap-2">
            <MessageSquare className="w-4 h-4" />
            Templates WhatsApp
          </Button>
          <ReadOnlyGuard>
            <Button variant="outline" onClick={() => setIsImportModalOpen(true)} className="gap-2">
              <Upload className="w-4 h-4" />
              Importar
            </Button>
          </ReadOnlyGuard>
          <ReadOnlyGuard>
            <Button onClick={() => handleOpenForm()} className="btn-gold gap-2">
              <Plus className="w-4 h-4" />
              Novo Cliente
            </Button>
          </ReadOnlyGuard>
        </div>
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <MiniGradientCard
          title="Total de Clientes"
          value={clientes.length}
          icon={UserCircle}
          gradient="purple"
        />
        <MiniGradientCard
          title="Aniversariantes do Mês"
          value={clientes.filter(c => isAniversariante(c.data_nascimento)).length}
          icon={Cake}
          gradient="pink"
        />
        <MiniGradientCard
          title="Com WhatsApp"
          value={clientes.filter(c => c.telefone).length}
          icon={MessageCircle}
          gradient="teal"
        />
      </div>

      {/* Search */}
      <Card className="glass-card mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nome, email ou telefone..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="pl-10 input-search" 
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <div className="table-glass">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Aniversário</TableHead>
              <TableHead className="w-[80px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClientes.map((cliente) => (
              <TableRow key={cliente.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {cliente.nome}
                    {isAniversariante(cliente.data_nascimento) && (
                      <Badge className="bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400 gap-1">
                        <Cake className="w-3 h-3" />
                        Aniversariante
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>{cliente.telefone || '-'}</TableCell>
                <TableCell>{cliente.email || '-'}</TableCell>
                <TableCell>
                  {cliente.data_nascimento 
                    ? new Date(cliente.data_nascimento).toLocaleDateString('pt-BR') 
                    : '-'}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover">
                      <DropdownMenuItem onClick={() => handleOpenForm(cliente)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      {cliente.telefone && (
                        <DropdownMenuItem onClick={() => openWhatsApp(cliente.telefone!, `Olá ${cliente.nome}!`)}>
                          <MessageCircle className="w-4 h-4 mr-2" />
                          WhatsApp
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        className="text-destructive" 
                        onClick={() => { setSelectedCliente(cliente); setIsDeleteDialogOpen(true); }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredClientes.length === 0 && (
          <EmptyState
            icon={UserCircle}
            title="Nenhum cliente encontrado"
            description="Adicione seu primeiro cliente para começar a gerenciar seus contatos"
            actionLabel="Adicionar Cliente"
            onAction={() => handleOpenForm()}
          />
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {selectedCliente ? 'Editar Cliente' : 'Novo Cliente'}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 py-4 pr-4">
              <ValidatedInput
                id="cliente-nome"
                label="Nome"
                value={formData.nome}
                onChange={(e) => handleFieldChange('nome', e.target.value)}
                onBlur={() => handleFieldBlur('nome')}
                error={formErrors.nome}
                touched={touched.nome}
                required
                placeholder="Nome do cliente"
              />
              <div className="grid grid-cols-2 gap-4">
                <ValidatedInput
                  id="cliente-telefone"
                  label="Telefone"
                  value={formData.telefone}
                  onChange={(e) => handleFieldChange('telefone', e.target.value)}
                  onBlur={() => handleFieldBlur('telefone')}
                  error={formErrors.telefone}
                  touched={touched.telefone}
                  placeholder="11999999999"
                />
                <ValidatedInput
                  id="cliente-email"
                  type="email"
                  label="Email"
                  value={formData.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  onBlur={() => handleFieldBlur('email')}
                  error={formErrors.email}
                  touched={touched.email}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <ValidatedInput
                  id="cliente-cpf"
                  label="CPF"
                  value={formData.cpf}
                  onChange={(e) => handleFieldChange('cpf', e.target.value)}
                  onBlur={() => handleFieldBlur('cpf')}
                  error={formErrors.cpf}
                  touched={touched.cpf}
                  placeholder="00000000000"
                  maxLength={11}
                />
                <div className="space-y-1.5">
                  <Label>Data de Nascimento</Label>
                  <Input 
                    type="date" 
                    value={formData.data_nascimento} 
                    onChange={(e) => handleFieldChange('data_nascimento', e.target.value)} 
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Endereço</Label>
                <Input 
                  value={formData.endereco} 
                  onChange={(e) => handleFieldChange('endereco', e.target.value)} 
                  placeholder="Rua, número, bairro, cidade"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} className="btn-gold" disabled={!formData.nome.trim()}>
                  Salvar
                </Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90" 
              onClick={() => { 
                if (selectedCliente) deleteCliente(selectedCliente.id); 
                setIsDeleteDialogOpen(false); 
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* WhatsApp Templates Modal */}
      <WhatsAppTemplates 
        open={isWhatsAppTemplatesOpen} 
        onOpenChange={setIsWhatsAppTemplatesOpen} 
      />

      {/* Import Clientes Modal */}
      <ImportacaoClientesModal
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
      />
    </div>
  );
}
