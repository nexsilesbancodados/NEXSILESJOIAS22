import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bot, User, Star, Clock, Phone, MessageSquare } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useConversaMessages, Conversa } from '@/hooks/useConversas';
import ReactMarkdown from 'react-markdown';

interface ConversaViewerProps {
  conversa: Conversa;
}

export function ConversaViewer({ conversa }: ConversaViewerProps) {
  const { data: messages = [], isLoading } = useConversaMessages(conversa.id);

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="font-medium">{conversa.cliente_nome || 'Anônimo'}</span>
          </div>
          {conversa.cliente_telefone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-3 w-3" />
              {conversa.cliente_telefone}
            </div>
          )}
        </div>
        <div className="text-right space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            {format(new Date(conversa.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageSquare className="h-3 w-3" />
            {conversa.total_mensagens || 0} mensagens
          </div>
        </div>
      </div>

      {/* NPS if available */}
      {conversa.nps_rating !== null && (
        <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <Star className="h-5 w-5 text-yellow-500" />
          <div>
            <span className="font-medium">Avaliação NPS: {conversa.nps_rating}/10</span>
            <Badge 
              variant={conversa.nps_rating >= 9 ? 'default' : conversa.nps_rating >= 7 ? 'secondary' : 'destructive'}
              className="ml-2"
            >
              {conversa.nps_rating >= 9 ? 'Promotor' : conversa.nps_rating >= 7 ? 'Neutro' : 'Detrator'}
            </Badge>
          </div>
        </div>
      )}

      <Separator />

      {/* Messages */}
      <ScrollArea className="h-[350px]">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando mensagens...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma mensagem encontrada
          </div>
        ) : (
          <div className="space-y-4 pr-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'assistant' ? '' : 'flex-row-reverse'
                }`}
              >
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === 'assistant'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <Bot className="h-4 w-4" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </div>
                <div
                  className={`flex-1 max-w-[80%] ${
                    message.role === 'assistant' ? '' : 'text-right'
                  }`}
                >
                  <div
                    className={`inline-block p-3 rounded-lg ${
                      message.role === 'assistant'
                        ? 'bg-muted'
                        : 'bg-primary text-primary-foreground'
                    }`}
                  >
                    <div className={`prose prose-sm max-w-none ${message.role === 'user' ? 'prose-invert' : ''}`}>
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {format(new Date(message.created_at), "HH:mm", { locale: ptBR })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
