# Plano de Melhorias - Agente de IA

## Fase 1: Funcionalidades Essenciais ✅ CONCLUÍDA

### 1.1 Dashboard de Conversas ✅
- [x] Lista de todas as conversas com filtros (status, data, cliente)
- [x] Visualização do histórico completo de cada conversa
- [x] Métricas: total de atendimentos, tempo médio, satisfação
- [x] Busca por cliente/telefone/conteúdo
- [x] Status: ativa, encerrada, aguardando humano

### 1.2 Transferir para Humano ✅
- [x] Botão/comando para cliente solicitar atendente humano
- [x] Fila de atendimentos pendentes
- [x] Notificação para operadores quando há transferência
- [x] Interface de atendimento para operador continuar conversa
- [x] Histórico visível ao operador antes de assumir

### 1.3 Respostas Rápidas/FAQ ✅
- [x] Cadastro de perguntas e respostas frequentes
- [x] Detecção automática de perguntas similares
- [x] Prioridade sobre IA para respostas cadastradas
- [x] Categorização de FAQs
- [x] Sugestões de novas FAQs baseadas em conversas

---

## Fase 2: Inteligência e Engajamento 🧠 EM PROGRESSO

### 2.1 Recomendações Inteligentes
- [ ] Histórico de compras do cliente
- [ ] Preferências detectadas (categorias, faixa de preço)
- [ ] Sugestões de produtos complementares
- [ ] "Clientes que compraram X também compraram Y"
- [ ] Alertas de produtos favoritos em promoção

### 2.2 Pesquisa de Satisfação (NPS) ✅
- [x] Envio automático ao encerrar conversa
- [x] Escala de satisfação (0-10)
- [x] Campo de comentário opcional
- [ ] Dashboard de NPS por período
- [ ] Alertas para avaliações negativas

### 2.3 Notificações Push ✅
- [x] Notificação web para novos atendimentos
- [x] Alertas de transferência para humano
- [x] Notificação de pedidos criados via chat
- [x] Configuração de preferências de notificação

---

## Fase 3: Multicanal 📱

### 3.1 Instagram Direct
- [ ] Integração com Meta Business API
- [ ] Webhook para receber mensagens
- [ ] Resposta automática via IA
- [ ] Sincronização de conversas

### 3.2 E-mail Automático
- [ ] Template de confirmação de pedido
- [ ] Follow-up após atendimento
- [ ] Resumo de conversa por e-mail
- [ ] Campanhas baseadas em interações

---

## Fase 4: Funcionalidades Avançadas 🚀

### 4.1 Áudio/Voz
- [ ] Receber mensagens de áudio do WhatsApp
- [ ] Transcrição automática (Whisper/similar)
- [ ] Resposta do agente em texto
- [ ] Opção de resposta em áudio (TTS)

### 4.2 Agendamento Automático
- [ ] Integração com calendário
- [ ] Cliente pode agendar via chat
- [ ] Confirmação e lembretes automáticos
- [ ] Sincronização com Google Calendar

### 4.3 Multi-agentes
- [ ] Diferentes agentes por departamento (vendas, suporte, etc.)
- [ ] Roteamento inteligente baseado na mensagem
- [ ] Configurações independentes por agente
- [ ] Transferência entre agentes

---

## Cronograma Atualizado

| Fase | Funcionalidade | Status |
|------|---------------|--------|
| 1.1 | Dashboard de Conversas | ✅ Concluído |
| 1.2 | Transferir para Humano | ✅ Concluído |
| 1.3 | Respostas Rápidas/FAQ | ✅ Concluído |
| 2.1 | Recomendações | ⏳ Pendente |
| 2.2 | NPS | ✅ Concluído |
| 2.3 | Notificações Push | ✅ Concluído |
| 3.1 | Instagram | ⏳ Pendente |
| 3.2 | E-mail | ⏳ Pendente |
| 4.1 | Áudio | ⏳ Pendente |
| 4.2 | Agendamento | ⏳ Pendente |
| 4.3 | Multi-agentes | ⏳ Pendente |

---

## Arquivos Criados/Modificados

### Hooks
- `src/hooks/useConversas.ts` - Gerenciamento de conversas
- `src/hooks/useFAQs.ts` - CRUD de FAQs
- `src/hooks/useFilaHumana.ts` - Fila de atendimento humano
- `src/hooks/usePushNotifications.ts` - Notificações push web

### Componentes
- `src/components/ai-agent/ConversasDashboard.tsx` - Dashboard principal
- `src/components/ai-agent/ConversaViewer.tsx` - Visualizador de conversa
- `src/components/ai-agent/FilaHumanaPanel.tsx` - Painel da fila humana
- `src/components/ai-agent/FAQManager.tsx` - Gerenciador de FAQs
- `src/components/ai-agent/NotificationSettings.tsx` - Config notificações

### Database
- Tabela `agente_faqs` - FAQs/Respostas rápidas
- Tabela `agente_fila_humana` - Fila de atendimento humano
- Colunas extras em `agente_conversas` - NPS, origem, etc.

### Edge Functions
- `supabase/functions/agente-ia/index.ts` - Novas ferramentas: transferir_humano, buscar_faq, enviar_nps
