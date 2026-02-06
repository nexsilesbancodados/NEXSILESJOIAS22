import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  MessageSquare, 
  Search, 
  Filter, 
  Clock, 
  User, 
  Phone, 
  Star,
  TrendingUp,
  Users,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useConversas, useConversaMessages, useConversaStats, useCloseConversa, Conversa } from '@/hooks/useConversas';
import { ConversaViewer } from './ConversaViewer';
import { FilaHumanaPanel } from './FilaHumanaPanel';
import { FAQManager } from './FAQManager';

export function ConversasDashboard() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [selectedConversa, setSelectedConversa] = useState<Conversa | null>(null);
  
  const { data: conversas = [], isLoading } = useConversas({
    search,
    status: statusFilter,
  });
  
  const { data: stats } = useConversaStats();
  const closeConversa = useCloseConversa();

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'ativa':
        return <Badge variant="default" className="bg-green-500">Ativa</Badge>;
      case 'aguardando_humano':
        return <Badge variant="destructive">Aguardando Humano</Badge>;
      case 'em_atendimento':
        return <Badge className="bg-blue-500">Em Atendimento</Badge>;
      case 'encerrada':
        return <Badge variant="secondary">Encerrada</Badge>;
      default:
        return <Badge variant="outline">{status || 'Desconhecido'}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
                <p className="text-sm text-muted-foreground">Total Conversas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.conversasHoje || 0}</p>
                <p className="text-sm text-muted-foreground">Hoje</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.aguardandoHumano || 0}</p>
                <p className="text-sm text-muted-foreground">Aguardando Humano</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Star className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">
                  {stats?.npsScore !== null ? `${stats.npsScore.toFixed(0)}` : '-'}
                </p>
                <p className="text-sm text-muted-foreground">NPS Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="conversas" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="conversas" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Conversas
          </TabsTrigger>
          <TabsTrigger value="fila" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Fila Humana
            {stats?.aguardandoHumano ? (
              <Badge variant="destructive" className="ml-1">{stats.aguardandoHumano}</Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="faq" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            FAQs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conversas" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Lista de Conversas */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome ou telefone..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="ativa">Ativas</SelectItem>
                      <SelectItem value="aguardando_humano">Aguardando Humano</SelectItem>
                      <SelectItem value="em_atendimento">Em Atendimento</SelectItem>
                      <SelectItem value="encerrada">Encerradas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {isLoading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Carregando...
                    </div>
                  ) : conversas.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhuma conversa encontrada
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {conversas.map((conversa) => (
                        <div
                          key={conversa.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedConversa?.id === conversa.id
                              ? 'bg-primary/10 border-primary'
                              : 'hover:bg-muted/50'
                          }`}
                          onClick={() => setSelectedConversa(conversa)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium truncate">
                                  {conversa.cliente_nome || 'Cliente Anônimo'}
                                </span>
                              </div>
                              {conversa.cliente_telefone && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                  <Phone className="h-3 w-3" />
                                  {conversa.cliente_telefone}
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(conversa.updated_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                <span>•</span>
                                <MessageSquare className="h-3 w-3" />
                                {conversa.total_mensagens || 0} msgs
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {getStatusBadge(conversa.status)}
                              {conversa.nps_rating !== null && (
                                <div className="flex items-center gap-1 text-xs">
                                  <Star className="h-3 w-3 text-yellow-500" />
                                  {conversa.nps_rating}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Visualizador de Conversa */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {selectedConversa ? 'Detalhes da Conversa' : 'Selecione uma conversa'}
                  </CardTitle>
                  {selectedConversa && (
                    <div className="flex gap-2">
                      {selectedConversa.status !== 'encerrada' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            closeConversa.mutate(selectedConversa.id);
                            setSelectedConversa(null);
                          }}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Encerrar
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {selectedConversa ? (
                  <ConversaViewer conversa={selectedConversa} />
                ) : (
                  <div className="flex items-center justify-center h-[500px] text-muted-foreground">
                    <div className="text-center">
                      <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Selecione uma conversa para ver os detalhes</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="fila" className="mt-4">
          <FilaHumanaPanel />
        </TabsContent>

        <TabsContent value="faq" className="mt-4">
          <FAQManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
