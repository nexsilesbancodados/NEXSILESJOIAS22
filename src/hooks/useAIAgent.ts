import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function useAIAgent(organizationId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const sessionIdRef = useRef<string>(generateSessionId());

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !organizationId) return;

    const userMessage: Message = { role: 'user', content };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const allMessages = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content
      }));

      const { data, error } = await supabase.functions.invoke('agente-ia', {
        body: {
          messages: allMessages,
          organizationId,
          sessionId: sessionIdRef.current
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.error) {
        if (data.error.includes('Muitas requisições')) {
          toast.error('Aguarde um momento antes de enviar outra mensagem.');
        } else if (data.error.includes('Limite de uso')) {
          toast.error('Limite de uso atingido. Entre em contato com o suporte.');
        } else {
          toast.error(data.error);
        }
        return;
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data?.content || 'Desculpe, não consegui processar sua mensagem.'
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem. Tente novamente.');
      
      // Remove the user message if failed
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }, [messages, organizationId]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    sessionIdRef.current = generateSessionId();
  }, []);

  return {
    messages,
    sendMessage,
    isLoading,
    clearMessages
  };
}
