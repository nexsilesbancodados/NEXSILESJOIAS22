import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { MiniGradientCard } from '@/components/dashboard/MiniGradientCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, Plus, MoreHorizontal, Pencil, Trash2, Loader2, Truck, Building2, Mail, Phone } from 'lucide-react';
import { useFornecedores, useAddFornecedor, useUpdateFornecedor, useDeleteFornecedor, Fornecedor } from '@/hooks/useSupabaseData';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { ValidatedInput } from '@/components/ui/validated-input';
import { toast } from 'sonner';

export default function FornecedoresPage() {
  const { data: fornecedores = [], isLoading } = useFornecedores();
  const { mutate: addFornecedor } = useAddFornecedor();
  const { mutate: updateFornecedor } = useUpdateFornecedor();
  const { mutate: deleteFornecedor } = useDeleteFornecedor();

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFornecedor, setSelectedFornecedor] = useState<Fornecedor | null>(null);
  const [formData, setFormData] = useState({ 
    nome: '', 
    telefone: '', 
    email: '', 
    cnpj: '', 
    endereco: '' 
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const filteredFornecedores = fornecedores.filter(f => 
    f.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.cnpj?.includes(searchTerm) ||
    f.telefone?.includes(searchTerm)
  );

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
      case 'cnpj':
        if (value && !/^\d{14}$/.test(value.replace(/\D/g, ''))) return 'CNPJ inválido (14 dígitos)';
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

  const handleOpenForm = (fornecedor?: Fornecedor) => {
    setTouched({});
    setFormErrors({});
    if (fornecedor) {
      setSelectedFornecedor(fornecedor);
      setFormData({
        nome: fornecedor.nome,
        telefone: fornecedor.telefone || '',
        email: fornecedor.email || '',
        cnpj: fornecedor.cnpj || '',
        endereco: fornecedor.endereco || '',
      });
    } else {
      setSelectedFornecedor(null);
      setFormData({ nome: '', telefone: '', email: '', cnpj: '', endereco: '' });
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

    const data: any = {
      nome: formData.nome,
      telefone: formData.telefone || null,
      email: formData.email || null,
      cnpj: formData.cnpj || null,
      endereco: formData.endereco || null,
    };
    if (selectedFornecedor) {
      updateFornecedor({ id: selectedFornecedor.id, ...data });
    } else {
      addFornecedor(data);
    }
    setIsDialogOpen(false);
  };

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 14);
    return numbers;
  };

  const displayCNPJ = (cnpj: string | null) => {
    if (!cnpj) return '-';
    const numbers = cnpj.replace(/\D/g, '');
    if (numbers.length !== 14) return cnpj;
    return numbers.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
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
        icon={Truck}
        title="Fornecedores"
        subtitle="Gerencie seus fornecedores e parceiros comerciais"
      >
        <Button onClick={() => handleOpenForm()} className="btn-gold gap-2">
          <Plus className="w-4 h-4" />
          Novo Fornecedor
        </Button>
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <MiniGradientCard
          title="Total de Fornecedores"
          value={fornecedores.length}
          icon={Truck}
          gradient="purple"
        />
        <MiniGradientCard
          title="Com CNPJ"
          value={fornecedores.filter(f => f.cnpj).length}
          icon={Building2}
          gradient="cyan"
        />
        <MiniGradientCard
          title="Com Email"
          value={fornecedores.filter(f => f.email).length}
          icon={Mail}
          gradient="teal"
        />
      </div>

      {/* Search */}
      <Card className="glass-card mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nome, CNPJ, email ou telefone..." 
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
              <TableHead>CNPJ</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Endereço</TableHead>
              <TableHead className="w-[80px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFornecedores.map((fornecedor) => (
              <TableRow key={fornecedor.id}>
                <TableCell className="font-medium">{fornecedor.nome}</TableCell>
                <TableCell className="font-mono text-sm">{displayCNPJ(fornecedor.cnpj)}</TableCell>
                <TableCell>{fornecedor.telefone || '-'}</TableCell>
                <TableCell>{fornecedor.email || '-'}</TableCell>
                <TableCell className="max-w-[200px] truncate">{fornecedor.endereco || '-'}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover">
                      <DropdownMenuItem onClick={() => handleOpenForm(fornecedor)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive" 
                        onClick={() => { setSelectedFornecedor(fornecedor); setIsDeleteDialogOpen(true); }}
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

        {filteredFornecedores.length === 0 && (
          <EmptyState
            icon={Truck}
            title="Nenhum fornecedor encontrado"
            description="Adicione seu primeiro fornecedor para começar a gerenciar seus parceiros"
            actionLabel="Adicionar Fornecedor"
            onAction={() => handleOpenForm()}
          />
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {selectedFornecedor ? 'Editar Fornecedor' : 'Novo Fornecedor'}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 py-4 pr-4">
              <ValidatedInput
                id="fornecedor-nome"
                label="Nome"
                value={formData.nome}
                onChange={(e) => handleFieldChange('nome', e.target.value)}
                onBlur={() => handleFieldBlur('nome')}
                error={formErrors.nome}
                touched={touched.nome}
                required
                placeholder="Nome do fornecedor"
              />
              <div className="grid grid-cols-2 gap-4">
                <ValidatedInput
                  id="fornecedor-cnpj"
                  label="CNPJ"
                  value={formData.cnpj}
                  onChange={(e) => handleFieldChange('cnpj', formatCNPJ(e.target.value))}
                  onBlur={() => handleFieldBlur('cnpj')}
                  error={formErrors.cnpj}
                  touched={touched.cnpj}
                  placeholder="00000000000000"
                  maxLength={14}
                  className="font-mono"
                />
                <ValidatedInput
                  id="fornecedor-telefone"
                  label="Telefone"
                  value={formData.telefone}
                  onChange={(e) => handleFieldChange('telefone', e.target.value)}
                  onBlur={() => handleFieldBlur('telefone')}
                  error={formErrors.telefone}
                  touched={touched.telefone}
                  placeholder="11999999999"
                />
              </div>
              <ValidatedInput
                id="fornecedor-email"
                type="email"
                label="Email"
                value={formData.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                onBlur={() => handleFieldBlur('email')}
                error={formErrors.email}
                touched={touched.email}
                placeholder="contato@fornecedor.com"
              />
              <div className="space-y-1.5">
                <Label>Endereço</Label>
                <Input 
                  value={formData.endereco} 
                  onChange={(e) => handleFieldChange('endereco', e.target.value)} 
                  placeholder="Rua, número, bairro, cidade - UF"
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
            <AlertDialogTitle>Excluir fornecedor?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso irá remover permanentemente o fornecedor "{selectedFornecedor?.nome}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90" 
              onClick={() => { 
                if (selectedFornecedor) deleteFornecedor(selectedFornecedor.id); 
                setIsDeleteDialogOpen(false); 
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
