import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, User, Phone, Mail, Star, Check, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type Cliente } from '@/hooks/useSupabaseData';

interface ClienteFielModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientes: Cliente[];
  clienteSelecionado: Cliente | null;
  onSelectCliente: (cliente: Cliente | null) => void;
  onAddCliente: (cliente: Omit<Cliente, 'id' | 'created_at' | 'updated_at'>) => void;
}

export function ClienteFielModal({
  open,
  onOpenChange,
  clientes,
  clienteSelecionado,
  onSelectCliente,
  onAddCliente,
}: ClienteFielModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [novoCliente, setNovoCliente] = useState({
    nome: '',
    telefone: '',
    email: '',
    cpf: '',
  });

  const filteredClientes = clientes.filter(cliente =>
    cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.telefone?.includes(searchTerm) ||
    cliente.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.cpf?.includes(searchTerm)
  );

  const handleSelectCliente = (cliente: Cliente) => {
    onSelectCliente(cliente);
    onOpenChange(false);
  };

  const handleAddNovoCliente = () => {
    if (!novoCliente.nome.trim()) return;
    onAddCliente({
      user_id: '', // Will be set by the mutation
      nome: novoCliente.nome,
      telefone: novoCliente.telefone || null,
      email: novoCliente.email || null,
      cpf: novoCliente.cpf || null,
      data_nascimento: null,
      endereco: null,
      cidade: null,
      estado: null,
      cep: null,
      observacoes: null,
    });
    setNovoCliente({ nome: '', telefone: '', email: '', cpf: '' });
    setIsAddingNew(false);
  };

  const handleRemoveCliente = () => {
    onSelectCliente(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" />
            Cliente Fiel
          </DialogTitle>
          <DialogDescription>
            Selecione ou cadastre um cliente para a venda
          </DialogDescription>
        </DialogHeader>

        {!isAddingNew ? (
          <div className="space-y-4 py-2">
            {/* Selected client display */}
            {clienteSelecionado && (
              <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{clienteSelecionado.nome}</p>
                    <p className="text-xs text-muted-foreground">{clienteSelecionado.telefone}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={handleRemoveCliente}>
                  Remover
                </Button>
              </div>
            )}

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome, telefone, email ou CPF..."
                className="pl-10"
              />
            </div>

            {/* Client list */}
            <ScrollArea className="h-[300px]">
              <div className="space-y-2 pr-4">
                {filteredClientes.length === 0 ? (
                  <div className="text-center py-8">
                    <User className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">
                      {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                    </p>
                  </div>
                ) : (
                  filteredClientes.map((cliente) => (
                    <div
                      key={cliente.id}
                      onClick={() => handleSelectCliente(cliente)}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-all hover:border-primary/50 hover:bg-secondary/50",
                        clienteSelecionado?.id === cliente.id && "border-primary bg-primary/5"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                            <User className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{cliente.nome}</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              {cliente.telefone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" /> {cliente.telefone}
                                </span>
                              )}
                              {cliente.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" /> {cliente.email}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {clienteSelecionado?.id === cliente.id && (
                          <Check className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsAddingNew(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar Novo Cliente
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={novoCliente.nome}
                onChange={(e) => setNovoCliente({ ...novoCliente, nome: e.target.value })}
                placeholder="Nome do cliente"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={novoCliente.telefone}
                  onChange={(e) => setNovoCliente({ ...novoCliente, telefone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label>CPF</Label>
                <Input
                  value={novoCliente.cpf}
                  onChange={(e) => setNovoCliente({ ...novoCliente, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={novoCliente.email}
                onChange={(e) => setNovoCliente({ ...novoCliente, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsAddingNew(false)}
              >
                Voltar
              </Button>
              <Button
                className="flex-1 btn-gold"
                onClick={handleAddNovoCliente}
                disabled={!novoCliente.nome.trim()}
              >
                Cadastrar Cliente
              </Button>
            </div>
          </div>
        )}

        {!isAddingNew && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
