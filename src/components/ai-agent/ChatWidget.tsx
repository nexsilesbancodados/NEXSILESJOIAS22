import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader2, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useAIAgent } from '@/hooks/useAIAgent';
import ReactMarkdown from 'react-markdown';

interface ChatWidgetProps {
  organizationId: string;
  config?: {
    nome_agente?: string;
    cor_primaria?: string;
    avatar_url?: string;
    mensagem_boas_vindas?: string;
  };
}

export function ChatWidget({ organizationId, config }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { messages, sendMessage, isLoading, clearMessages } = useAIAgent(organizationId);

  const nomeAgente = config?.nome_agente || 'Assistente Virtual';
  const corPrimaria = config?.cor_primaria || '#9b87f5';
  const mensagemBoasVindas = config?.mensagem_boas_vindas || 'Olá! 👋 Como posso ajudar você hoje?';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const message = input.trim();
    setInput('');
    await sendMessage(message);
  };

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
  };

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={handleOpen}
              className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
              style={{ backgroundColor: corPrimaria }}
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? 'auto' : undefined
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] bg-background border rounded-2xl shadow-2xl overflow-hidden flex flex-col",
              isMinimized ? "h-auto" : "h-[550px] max-h-[80vh]"
            )}
          >
            {/* Header */}
            <div 
              className="flex items-center justify-between px-4 py-3 text-white"
              style={{ backgroundColor: corPrimaria }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  {config?.avatar_url ? (
                    <img src={config.avatar_url} alt={nomeAgente} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <MessageCircle className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{nomeAgente}</h3>
                  <p className="text-xs text-white/80">Online agora</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={() => setIsMinimized(!isMinimized)}
                >
                  {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Chat content */}
            {!isMinimized && (
              <>
                <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                  <div className="space-y-4">
                    {/* Welcome message */}
                    {messages.length === 0 && (
                      <div className="flex gap-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: corPrimaria }}
                        >
                          <MessageCircle className="h-4 w-4 text-white" />
                        </div>
                        <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
                          <p className="text-sm">{mensagemBoasVindas}</p>
                        </div>
                      </div>
                    )}

                    {/* Messages */}
                    {messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "flex gap-3",
                          msg.role === 'user' ? "justify-end" : "justify-start"
                        )}
                      >
                        {msg.role === 'assistant' && (
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: corPrimaria }}
                          >
                            <MessageCircle className="h-4 w-4 text-white" />
                          </div>
                        )}
                        <div
                          className={cn(
                            "rounded-2xl px-4 py-3 max-w-[85%]",
                            msg.role === 'user'
                              ? "bg-primary text-primary-foreground rounded-tr-sm"
                              : "bg-muted rounded-tl-sm"
                          )}
                          style={msg.role === 'user' ? { backgroundColor: corPrimaria } : undefined}
                        >
                          <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Loading indicator */}
                    {isLoading && (
                      <div className="flex gap-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: corPrimaria }}
                        >
                          <MessageCircle className="h-4 w-4 text-white" />
                        </div>
                        <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Input */}
                <form onSubmit={handleSubmit} className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Digite sua mensagem..."
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button 
                      type="submit" 
                      size="icon"
                      disabled={isLoading || !input.trim()}
                      style={{ backgroundColor: corPrimaria }}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
