export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ab_testes: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          organization_id: string | null
          updated_at: string | null
          variante_a_conversas: number | null
          variante_a_nps_total: number | null
          variante_a_prompt: string
          variante_a_resolucoes: number | null
          variante_b_conversas: number | null
          variante_b_nps_total: number | null
          variante_b_prompt: string
          variante_b_resolucoes: number | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          organization_id?: string | null
          updated_at?: string | null
          variante_a_conversas?: number | null
          variante_a_nps_total?: number | null
          variante_a_prompt: string
          variante_a_resolucoes?: number | null
          variante_b_conversas?: number | null
          variante_b_nps_total?: number | null
          variante_b_prompt: string
          variante_b_resolucoes?: number | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          organization_id?: string | null
          updated_at?: string | null
          variante_a_conversas?: number | null
          variante_a_nps_total?: number | null
          variante_a_prompt?: string
          variante_a_resolucoes?: number | null
          variante_b_conversas?: number | null
          variante_b_nps_total?: number | null
          variante_b_prompt?: string
          variante_b_resolucoes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ab_testes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      account_deletion_requests: {
        Row: {
          created_at: string
          email: string
          id: string
          organization_id: string | null
          processed_at: string | null
          reason: string | null
          scheduled_for: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          organization_id?: string | null
          processed_at?: string | null
          reason?: string | null
          scheduled_for?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          organization_id?: string | null
          processed_at?: string | null
          reason?: string | null
          scheduled_for?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_deletion_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      agendamentos: {
        Row: {
          cliente_email: string | null
          cliente_nome: string
          cliente_telefone: string | null
          conversa_id: string | null
          created_at: string | null
          data_hora: string
          descricao: string | null
          duracao_minutos: number | null
          google_event_id: string | null
          id: string
          lembrete_enviado: boolean | null
          lembrete_horas_antes: number | null
          metadata: Json | null
          organization_id: string | null
          status: string | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          cliente_email?: string | null
          cliente_nome: string
          cliente_telefone?: string | null
          conversa_id?: string | null
          created_at?: string | null
          data_hora: string
          descricao?: string | null
          duracao_minutos?: number | null
          google_event_id?: string | null
          id?: string
          lembrete_enviado?: boolean | null
          lembrete_horas_antes?: number | null
          metadata?: Json | null
          organization_id?: string | null
          status?: string | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          cliente_email?: string | null
          cliente_nome?: string
          cliente_telefone?: string | null
          conversa_id?: string | null
          created_at?: string | null
          data_hora?: string
          descricao?: string | null
          duracao_minutos?: number | null
          google_event_id?: string | null
          id?: string
          lembrete_enviado?: boolean | null
          lembrete_horas_antes?: number | null
          metadata?: Json | null
          organization_id?: string | null
          status?: string | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_conversa_id_fkey"
            columns: ["conversa_id"]
            isOneToOne: false
            referencedRelation: "agente_conversas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      agente_conversas: {
        Row: {
          ab_teste_id: string | null
          ab_variante: string | null
          agente_id: string | null
          assigned_to: string | null
          cliente_nome: string | null
          cliente_telefone: string | null
          closed_at: string | null
          closed_by: string | null
          created_at: string
          follow_up_at: string | null
          follow_up_enviado: boolean | null
          id: string
          lead_score: string | null
          nps_comentario: string | null
          nps_enviado_at: string | null
          nps_rating: number | null
          organization_id: string | null
          origem: string | null
          produtos_interesse: string[] | null
          sentimento: string | null
          sentimento_score: number | null
          session_id: string
          status: string | null
          tempo_primeira_resposta: number | null
          total_mensagens: number | null
          ultimo_contato_at: string | null
          updated_at: string
          valor_venda: number | null
          venda_id: string | null
          venda_realizada: boolean | null
        }
        Insert: {
          ab_teste_id?: string | null
          ab_variante?: string | null
          agente_id?: string | null
          assigned_to?: string | null
          cliente_nome?: string | null
          cliente_telefone?: string | null
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          follow_up_at?: string | null
          follow_up_enviado?: boolean | null
          id?: string
          lead_score?: string | null
          nps_comentario?: string | null
          nps_enviado_at?: string | null
          nps_rating?: number | null
          organization_id?: string | null
          origem?: string | null
          produtos_interesse?: string[] | null
          sentimento?: string | null
          sentimento_score?: number | null
          session_id: string
          status?: string | null
          tempo_primeira_resposta?: number | null
          total_mensagens?: number | null
          ultimo_contato_at?: string | null
          updated_at?: string
          valor_venda?: number | null
          venda_id?: string | null
          venda_realizada?: boolean | null
        }
        Update: {
          ab_teste_id?: string | null
          ab_variante?: string | null
          agente_id?: string | null
          assigned_to?: string | null
          cliente_nome?: string | null
          cliente_telefone?: string | null
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          follow_up_at?: string | null
          follow_up_enviado?: boolean | null
          id?: string
          lead_score?: string | null
          nps_comentario?: string | null
          nps_enviado_at?: string | null
          nps_rating?: number | null
          organization_id?: string | null
          origem?: string | null
          produtos_interesse?: string[] | null
          sentimento?: string | null
          sentimento_score?: number | null
          session_id?: string
          status?: string | null
          tempo_primeira_resposta?: number | null
          total_mensagens?: number | null
          ultimo_contato_at?: string | null
          updated_at?: string
          valor_venda?: number | null
          venda_id?: string | null
          venda_realizada?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "agente_conversas_ab_teste_id_fkey"
            columns: ["ab_teste_id"]
            isOneToOne: false
            referencedRelation: "ab_testes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agente_conversas_agente_id_fkey"
            columns: ["agente_id"]
            isOneToOne: false
            referencedRelation: "agentes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agente_conversas_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agente_conversas_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      agente_faqs: {
        Row: {
          ativo: boolean | null
          categoria: string | null
          created_at: string | null
          id: string
          organization_id: string | null
          palavras_chave: string[] | null
          pergunta: string
          resposta: string
          updated_at: string | null
          uso_count: number | null
        }
        Insert: {
          ativo?: boolean | null
          categoria?: string | null
          created_at?: string | null
          id?: string
          organization_id?: string | null
          palavras_chave?: string[] | null
          pergunta: string
          resposta: string
          updated_at?: string | null
          uso_count?: number | null
        }
        Update: {
          ativo?: boolean | null
          categoria?: string | null
          created_at?: string | null
          id?: string
          organization_id?: string | null
          palavras_chave?: string[] | null
          pergunta?: string
          resposta?: string
          updated_at?: string | null
          uso_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agente_faqs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      agente_fila_humana: {
        Row: {
          atendente_id: string | null
          atendido_at: string | null
          conversa_id: string | null
          created_at: string | null
          entrou_fila_at: string | null
          id: string
          motivo: string | null
          organization_id: string | null
          prioridade: number | null
          status: string | null
        }
        Insert: {
          atendente_id?: string | null
          atendido_at?: string | null
          conversa_id?: string | null
          created_at?: string | null
          entrou_fila_at?: string | null
          id?: string
          motivo?: string | null
          organization_id?: string | null
          prioridade?: number | null
          status?: string | null
        }
        Update: {
          atendente_id?: string | null
          atendido_at?: string | null
          conversa_id?: string | null
          created_at?: string | null
          entrou_fila_at?: string | null
          id?: string
          motivo?: string | null
          organization_id?: string | null
          prioridade?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agente_fila_humana_conversa_id_fkey"
            columns: ["conversa_id"]
            isOneToOne: false
            referencedRelation: "agente_conversas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agente_fila_humana_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      agente_ia_config: {
        Row: {
          agendamento_antecedencia_min_horas: number | null
          agendamento_ativo: boolean | null
          agendamento_duracao_padrao: number | null
          agendamento_horarios: Json | null
          alertas_config: Json | null
          ativo: boolean | null
          audio_transcricao_ativo: boolean | null
          audio_tts_ativo: boolean | null
          audio_voz_preferida: string | null
          avatar_url: string | null
          cor_primaria: string | null
          created_at: string
          dono_email: string | null
          dono_nome: string | null
          dono_whatsapp: string | null
          email_ativo: boolean | null
          email_follow_up_horas: number | null
          email_nome_remetente: string | null
          email_remetente: string | null
          ferramentas_ativas: Json | null
          gemini_api_key: string | null
          horario_funcionamento: Json | null
          id: string
          idioma: string | null
          instagram_access_token: string | null
          instagram_ativo: boolean | null
          instagram_page_id: string | null
          instrucoes_especiais: string | null
          limite_mensagens_sessao: number | null
          max_tokens: number | null
          mensagem_boas_vindas: string | null
          nome_agente: string
          organization_id: string | null
          palavras_proibidas: string[] | null
          pix_chave: string | null
          pix_nome: string | null
          pix_tipo: string | null
          prompt_sistema: string
          respostas_rapidas: Json | null
          temperatura: number | null
          tom_resposta: string | null
          updated_at: string
          whatsapp_instancia: string | null
          whatsapp_numero: string | null
        }
        Insert: {
          agendamento_antecedencia_min_horas?: number | null
          agendamento_ativo?: boolean | null
          agendamento_duracao_padrao?: number | null
          agendamento_horarios?: Json | null
          alertas_config?: Json | null
          ativo?: boolean | null
          audio_transcricao_ativo?: boolean | null
          audio_tts_ativo?: boolean | null
          audio_voz_preferida?: string | null
          avatar_url?: string | null
          cor_primaria?: string | null
          created_at?: string
          dono_email?: string | null
          dono_nome?: string | null
          dono_whatsapp?: string | null
          email_ativo?: boolean | null
          email_follow_up_horas?: number | null
          email_nome_remetente?: string | null
          email_remetente?: string | null
          ferramentas_ativas?: Json | null
          gemini_api_key?: string | null
          horario_funcionamento?: Json | null
          id?: string
          idioma?: string | null
          instagram_access_token?: string | null
          instagram_ativo?: boolean | null
          instagram_page_id?: string | null
          instrucoes_especiais?: string | null
          limite_mensagens_sessao?: number | null
          max_tokens?: number | null
          mensagem_boas_vindas?: string | null
          nome_agente?: string
          organization_id?: string | null
          palavras_proibidas?: string[] | null
          pix_chave?: string | null
          pix_nome?: string | null
          pix_tipo?: string | null
          prompt_sistema?: string
          respostas_rapidas?: Json | null
          temperatura?: number | null
          tom_resposta?: string | null
          updated_at?: string
          whatsapp_instancia?: string | null
          whatsapp_numero?: string | null
        }
        Update: {
          agendamento_antecedencia_min_horas?: number | null
          agendamento_ativo?: boolean | null
          agendamento_duracao_padrao?: number | null
          agendamento_horarios?: Json | null
          alertas_config?: Json | null
          ativo?: boolean | null
          audio_transcricao_ativo?: boolean | null
          audio_tts_ativo?: boolean | null
          audio_voz_preferida?: string | null
          avatar_url?: string | null
          cor_primaria?: string | null
          created_at?: string
          dono_email?: string | null
          dono_nome?: string | null
          dono_whatsapp?: string | null
          email_ativo?: boolean | null
          email_follow_up_horas?: number | null
          email_nome_remetente?: string | null
          email_remetente?: string | null
          ferramentas_ativas?: Json | null
          gemini_api_key?: string | null
          horario_funcionamento?: Json | null
          id?: string
          idioma?: string | null
          instagram_access_token?: string | null
          instagram_ativo?: boolean | null
          instagram_page_id?: string | null
          instrucoes_especiais?: string | null
          limite_mensagens_sessao?: number | null
          max_tokens?: number | null
          mensagem_boas_vindas?: string | null
          nome_agente?: string
          organization_id?: string | null
          palavras_proibidas?: string[] | null
          pix_chave?: string | null
          pix_nome?: string | null
          pix_tipo?: string | null
          prompt_sistema?: string
          respostas_rapidas?: Json | null
          temperatura?: number | null
          tom_resposta?: string | null
          updated_at?: string
          whatsapp_instancia?: string | null
          whatsapp_numero?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agente_ia_config_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      agente_mensagens: {
        Row: {
          audio_url: string | null
          content: string
          conversa_id: string | null
          created_at: string
          duracao_segundos: number | null
          id: string
          metadata: Json | null
          role: string
          sentimento: string | null
          transcricao: string | null
        }
        Insert: {
          audio_url?: string | null
          content: string
          conversa_id?: string | null
          created_at?: string
          duracao_segundos?: number | null
          id?: string
          metadata?: Json | null
          role: string
          sentimento?: string | null
          transcricao?: string | null
        }
        Update: {
          audio_url?: string | null
          content?: string
          conversa_id?: string | null
          created_at?: string
          duracao_segundos?: number | null
          id?: string
          metadata?: Json | null
          role?: string
          sentimento?: string | null
          transcricao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agente_mensagens_conversa_id_fkey"
            columns: ["conversa_id"]
            isOneToOne: false
            referencedRelation: "agente_conversas"
            referencedColumns: ["id"]
          },
        ]
      }
      agentes: {
        Row: {
          ativo: boolean | null
          avatar_url: string | null
          cor: string | null
          created_at: string | null
          departamento: string
          ferramentas_ativas: Json | null
          id: string
          nome: string
          ordem_prioridade: number | null
          organization_id: string | null
          palavras_chave: string[] | null
          prompt_sistema: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          avatar_url?: string | null
          cor?: string | null
          created_at?: string | null
          departamento: string
          ferramentas_ativas?: Json | null
          id?: string
          nome: string
          ordem_prioridade?: number | null
          organization_id?: string | null
          palavras_chave?: string[] | null
          prompt_sistema: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          avatar_url?: string | null
          cor?: string | null
          created_at?: string | null
          departamento?: string
          ferramentas_ativas?: Json | null
          id?: string
          nome?: string
          ordem_prioridade?: number | null
          organization_id?: string | null
          palavras_chave?: string[] | null
          prompt_sistema?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agentes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      assinaturas: {
        Row: {
          created_at: string
          data_inicio: string
          data_vencimento: string
          id: string
          mercadopago_payment_id: string | null
          mercadopago_preference_id: string | null
          metodo_pagamento: string | null
          notificacao_3dias_enviada: boolean | null
          notificacao_vencimento_enviada: boolean | null
          pagamento_recorrente: boolean | null
          plano: string
          proximo_pagamento_em: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_ativo: boolean | null
          trial_dias: number | null
          trial_iniciado_em: string | null
          ultimo_pagamento_em: string | null
          updated_at: string
          user_id: string
          valor_mensal: number
        }
        Insert: {
          created_at?: string
          data_inicio?: string
          data_vencimento: string
          id?: string
          mercadopago_payment_id?: string | null
          mercadopago_preference_id?: string | null
          metodo_pagamento?: string | null
          notificacao_3dias_enviada?: boolean | null
          notificacao_vencimento_enviada?: boolean | null
          pagamento_recorrente?: boolean | null
          plano: string
          proximo_pagamento_em?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ativo?: boolean | null
          trial_dias?: number | null
          trial_iniciado_em?: string | null
          ultimo_pagamento_em?: string | null
          updated_at?: string
          user_id: string
          valor_mensal: number
        }
        Update: {
          created_at?: string
          data_inicio?: string
          data_vencimento?: string
          id?: string
          mercadopago_payment_id?: string | null
          mercadopago_preference_id?: string | null
          metodo_pagamento?: string | null
          notificacao_3dias_enviada?: boolean | null
          notificacao_vencimento_enviada?: boolean | null
          pagamento_recorrente?: boolean | null
          plano?: string
          proximo_pagamento_em?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ativo?: boolean | null
          trial_dias?: number | null
          trial_iniciado_em?: string | null
          ultimo_pagamento_em?: string | null
          updated_at?: string
          user_id?: string
          valor_mensal?: number
        }
        Relationships: []
      }
      banhos: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          custo_por_grama: number | null
          descricao: string | null
          id: string
          nome: string
          organization_id: string | null
          tempo_medio_minutos: number | null
          tipo: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          custo_por_grama?: number | null
          descricao?: string | null
          id?: string
          nome: string
          organization_id?: string | null
          tempo_medio_minutos?: number | null
          tipo?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          custo_por_grama?: number | null
          descricao?: string | null
          id?: string
          nome?: string
          organization_id?: string | null
          tempo_medio_minutos?: number | null
          tipo?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "banhos_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      caixa_sessoes: {
        Row: {
          created_at: string
          data_abertura: string
          data_fechamento: string | null
          id: string
          observacoes: string | null
          operador_id: string | null
          organization_id: string | null
          status: string
          updated_at: string
          valor_final: number | null
          valor_inicial: number
          valor_sangrias: number | null
          valor_suprimentos: number | null
          valor_vendas: number | null
        }
        Insert: {
          created_at?: string
          data_abertura?: string
          data_fechamento?: string | null
          id?: string
          observacoes?: string | null
          operador_id?: string | null
          organization_id?: string | null
          status?: string
          updated_at?: string
          valor_final?: number | null
          valor_inicial?: number
          valor_sangrias?: number | null
          valor_suprimentos?: number | null
          valor_vendas?: number | null
        }
        Update: {
          created_at?: string
          data_abertura?: string
          data_fechamento?: string | null
          id?: string
          observacoes?: string | null
          operador_id?: string | null
          organization_id?: string | null
          status?: string
          updated_at?: string
          valor_final?: number | null
          valor_inicial?: number
          valor_sangrias?: number | null
          valor_suprimentos?: number | null
          valor_vendas?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "caixa_sessoes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      campanhas: {
        Row: {
          ativa: boolean | null
          created_at: string | null
          data_fim: string | null
          data_inicio: string | null
          desconto_percentual: number | null
          descricao: string | null
          id: string
          meta_valor: number | null
          nome: string
          organization_id: string | null
          premio: string | null
          tipo: string | null
          updated_at: string | null
        }
        Insert: {
          ativa?: boolean | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          desconto_percentual?: number | null
          descricao?: string | null
          id?: string
          meta_valor?: number | null
          nome: string
          organization_id?: string | null
          premio?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Update: {
          ativa?: boolean | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          desconto_percentual?: number | null
          descricao?: string | null
          id?: string
          meta_valor?: number | null
          nome?: string
          organization_id?: string | null
          premio?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campanhas_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      catalogos: {
        Row: {
          ativo: boolean | null
          banner_url: string | null
          cor_primaria: string | null
          cor_secundaria: string | null
          created_at: string | null
          custo_operacional: number | null
          custo_separacao: number | null
          data_validade: string | null
          descricao: string | null
          email_contato: string | null
          id: string
          imagem_capa: string | null
          imagem_url: string | null
          logo_url: string | null
          mensagem_boas_vindas: string | null
          nome: string
          observacao: string | null
          organization_id: string | null
          pedido_minimo_pecas: number | null
          slug: string | null
          status: string | null
          taxa_entrega: number | null
          titulo: string | null
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          ativo?: boolean | null
          banner_url?: string | null
          cor_primaria?: string | null
          cor_secundaria?: string | null
          created_at?: string | null
          custo_operacional?: number | null
          custo_separacao?: number | null
          data_validade?: string | null
          descricao?: string | null
          email_contato?: string | null
          id?: string
          imagem_capa?: string | null
          imagem_url?: string | null
          logo_url?: string | null
          mensagem_boas_vindas?: string | null
          nome: string
          observacao?: string | null
          organization_id?: string | null
          pedido_minimo_pecas?: number | null
          slug?: string | null
          status?: string | null
          taxa_entrega?: number | null
          titulo?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          ativo?: boolean | null
          banner_url?: string | null
          cor_primaria?: string | null
          cor_secundaria?: string | null
          created_at?: string | null
          custo_operacional?: number | null
          custo_separacao?: number | null
          data_validade?: string | null
          descricao?: string | null
          email_contato?: string | null
          id?: string
          imagem_capa?: string | null
          imagem_url?: string | null
          logo_url?: string | null
          mensagem_boas_vindas?: string | null
          nome?: string
          observacao?: string | null
          organization_id?: string | null
          pedido_minimo_pecas?: number | null
          slug?: string | null
          status?: string | null
          taxa_entrega?: number | null
          titulo?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catalogos_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      catalogos_pecas: {
        Row: {
          catalogo_id: string
          created_at: string | null
          destaque: boolean | null
          id: string
          ordem: number | null
          peca_id: string
          quantidade: number
          quantidade_minima: number
        }
        Insert: {
          catalogo_id: string
          created_at?: string | null
          destaque?: boolean | null
          id?: string
          ordem?: number | null
          peca_id: string
          quantidade?: number
          quantidade_minima?: number
        }
        Update: {
          catalogo_id?: string
          created_at?: string | null
          destaque?: boolean | null
          id?: string
          ordem?: number | null
          peca_id?: string
          quantidade?: number
          quantidade_minima?: number
        }
        Relationships: [
          {
            foreignKeyName: "catalogos_pecas_catalogo_id_fkey"
            columns: ["catalogo_id"]
            isOneToOne: false
            referencedRelation: "catalogos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalogos_pecas_catalogo_id_fkey"
            columns: ["catalogo_id"]
            isOneToOne: false
            referencedRelation: "catalogos_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalogos_pecas_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalogos_pecas_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas_loja_public"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias_pecas: {
        Row: {
          created_at: string | null
          id: string
          nome: string
          ordem: number | null
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome: string
          ordem?: number | null
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          nome?: string
          ordem?: number | null
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categorias_pecas_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cliente_preferencias: {
        Row: {
          categorias_favoritas: string[] | null
          cliente_telefone: string
          created_at: string | null
          faixa_preco_max: number | null
          faixa_preco_min: number | null
          id: string
          materiais_preferidos: string[] | null
          organization_id: string | null
          produtos_comprados: string[] | null
          produtos_visualizados: string[] | null
          total_compras: number | null
          ultima_compra_at: string | null
          updated_at: string | null
          valor_total_compras: number | null
        }
        Insert: {
          categorias_favoritas?: string[] | null
          cliente_telefone: string
          created_at?: string | null
          faixa_preco_max?: number | null
          faixa_preco_min?: number | null
          id?: string
          materiais_preferidos?: string[] | null
          organization_id?: string | null
          produtos_comprados?: string[] | null
          produtos_visualizados?: string[] | null
          total_compras?: number | null
          ultima_compra_at?: string | null
          updated_at?: string | null
          valor_total_compras?: number | null
        }
        Update: {
          categorias_favoritas?: string[] | null
          cliente_telefone?: string
          created_at?: string | null
          faixa_preco_max?: number | null
          faixa_preco_min?: number | null
          id?: string
          materiais_preferidos?: string[] | null
          organization_id?: string | null
          produtos_comprados?: string[] | null
          produtos_visualizados?: string[] | null
          total_compras?: number | null
          ultima_compra_at?: string | null
          updated_at?: string | null
          valor_total_compras?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cliente_preferencias_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          ativo: boolean | null
          cep: string | null
          cidade: string | null
          cpf: string | null
          created_at: string | null
          data_nascimento: string | null
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          nome: string
          observacoes: string | null
          organization_id: string | null
          pontos_fidelidade: number | null
          senha: string | null
          telefone: string | null
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          ativo?: boolean | null
          cep?: string | null
          cidade?: string | null
          cpf?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          organization_id?: string | null
          pontos_fidelidade?: number | null
          senha?: string | null
          telefone?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          ativo?: boolean | null
          cep?: string | null
          cidade?: string | null
          cpf?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          organization_id?: string | null
          pontos_fidelidade?: number | null
          senha?: string | null
          telefone?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      codigos_acesso: {
        Row: {
          codigo: string
          created_at: string | null
          email: string
          id: string
          mercadopago_payment_id: string | null
          plano: string
          updated_at: string | null
          usado: boolean | null
          usado_em: string | null
          usado_por: string | null
          valido_ate: string
          valor_pago: number
        }
        Insert: {
          codigo: string
          created_at?: string | null
          email: string
          id?: string
          mercadopago_payment_id?: string | null
          plano: string
          updated_at?: string | null
          usado?: boolean | null
          usado_em?: string | null
          usado_por?: string | null
          valido_ate: string
          valor_pago: number
        }
        Update: {
          codigo?: string
          created_at?: string | null
          email?: string
          id?: string
          mercadopago_payment_id?: string | null
          plano?: string
          updated_at?: string | null
          usado?: boolean | null
          usado_em?: string | null
          usado_por?: string | null
          valido_ate?: string
          valor_pago?: number
        }
        Relationships: []
      }
      comissoes_revendedoras: {
        Row: {
          created_at: string | null
          data_pagamento: string | null
          id: string
          mes_referencia: string
          organization_id: string
          percentual_comissao: number | null
          revendedora_id: string
          status: string | null
          updated_at: string | null
          valor_comissao: number | null
          valor_vendas: number | null
        }
        Insert: {
          created_at?: string | null
          data_pagamento?: string | null
          id?: string
          mes_referencia: string
          organization_id: string
          percentual_comissao?: number | null
          revendedora_id: string
          status?: string | null
          updated_at?: string | null
          valor_comissao?: number | null
          valor_vendas?: number | null
        }
        Update: {
          created_at?: string | null
          data_pagamento?: string | null
          id?: string
          mes_referencia?: string
          organization_id?: string
          percentual_comissao?: number | null
          revendedora_id?: string
          status?: string | null
          updated_at?: string | null
          valor_comissao?: number | null
          valor_vendas?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "comissoes_revendedoras_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_revendedoras_revendedora_id_fkey"
            columns: ["revendedora_id"]
            isOneToOne: false
            referencedRelation: "revendedoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_revendedoras_revendedora_id_fkey"
            columns: ["revendedora_id"]
            isOneToOne: false
            referencedRelation: "revendedoras_portal_public"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes: {
        Row: {
          chave: string
          created_at: string | null
          descricao: string | null
          id: string
          organization_id: string | null
          tipo: string | null
          updated_at: string | null
          valor: string | null
        }
        Insert: {
          chave: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          organization_id?: string | null
          tipo?: string | null
          updated_at?: string | null
          valor?: string | null
        }
        Update: {
          chave?: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          organization_id?: string | null
          tipo?: string | null
          updated_at?: string | null
          valor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "configuracoes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_atividades: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          lead_id: string
          realizado_por: string | null
          tipo: string
          titulo: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          lead_id: string
          realizado_por?: string | null
          tipo?: string
          titulo: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          lead_id?: string
          realizado_por?: string | null
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_atividades_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_conversoes: {
        Row: {
          created_at: string
          evento: string
          id: string
          lead_id: string | null
          metadata: Json | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          valor: number | null
        }
        Insert: {
          created_at?: string
          evento: string
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          valor?: number | null
        }
        Update: {
          created_at?: string
          evento?: string
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_conversoes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_leads: {
        Row: {
          convertido_em: string | null
          created_at: string
          email: string | null
          empresa: string | null
          id: string
          nome: string
          notas: string | null
          origem: string
          plano_interesse: string | null
          score: number | null
          status: string
          tags: string[] | null
          telefone: string | null
          ultimo_contato_em: string | null
          updated_at: string
          user_id_convertido: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          valor_potencial: number | null
        }
        Insert: {
          convertido_em?: string | null
          created_at?: string
          email?: string | null
          empresa?: string | null
          id?: string
          nome: string
          notas?: string | null
          origem?: string
          plano_interesse?: string | null
          score?: number | null
          status?: string
          tags?: string[] | null
          telefone?: string | null
          ultimo_contato_em?: string | null
          updated_at?: string
          user_id_convertido?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          valor_potencial?: number | null
        }
        Update: {
          convertido_em?: string | null
          created_at?: string
          email?: string | null
          empresa?: string | null
          id?: string
          nome?: string
          notas?: string | null
          origem?: string
          plano_interesse?: string | null
          score?: number | null
          status?: string
          tags?: string[] | null
          telefone?: string | null
          ultimo_contato_em?: string | null
          updated_at?: string
          user_id_convertido?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          valor_potencial?: number | null
        }
        Relationships: []
      }
      cupons: {
        Row: {
          ativo: boolean
          codigo: string
          created_at: string
          id: string
          organization_id: string
          tipo: string
          updated_at: string
          uso_atual: number
          uso_maximo: number | null
          valido_ate: string | null
          valor: number
          valor_minimo_pedido: number
        }
        Insert: {
          ativo?: boolean
          codigo: string
          created_at?: string
          id?: string
          organization_id: string
          tipo?: string
          updated_at?: string
          uso_atual?: number
          uso_maximo?: number | null
          valido_ate?: string | null
          valor?: number
          valor_minimo_pedido?: number
        }
        Update: {
          ativo?: boolean
          codigo?: string
          created_at?: string
          id?: string
          organization_id?: string
          tipo?: string
          updated_at?: string
          uso_atual?: number
          uso_maximo?: number | null
          valido_ate?: string | null
          valor?: number
          valor_minimo_pedido?: number
        }
        Relationships: [
          {
            foreignKeyName: "cupons_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ecommerce_avaliacoes: {
        Row: {
          aprovada: boolean | null
          cliente_email: string | null
          cliente_nome: string
          comentario: string | null
          created_at: string
          id: string
          nota: number
          organization_id: string
          peca_id: string
        }
        Insert: {
          aprovada?: boolean | null
          cliente_email?: string | null
          cliente_nome: string
          comentario?: string | null
          created_at?: string
          id?: string
          nota: number
          organization_id: string
          peca_id: string
        }
        Update: {
          aprovada?: boolean | null
          cliente_email?: string | null
          cliente_nome?: string
          comentario?: string | null
          created_at?: string
          id?: string
          nota?: number
          organization_id?: string
          peca_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ecommerce_avaliacoes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecommerce_avaliacoes_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecommerce_avaliacoes_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas_loja_public"
            referencedColumns: ["id"]
          },
        ]
      }
      ecommerce_config: {
        Row: {
          apenas_com_foto: boolean | null
          ativo: boolean
          avaliacoes_ativas: boolean | null
          badges_produto: string[] | null
          banner_ativo: boolean | null
          banner_cor: string | null
          banner_link: string | null
          banner_posicao: string | null
          banner_texto: string | null
          banner_url: string | null
          banners_carousel: Json | null
          barra_frete_ativo: boolean | null
          cep_origem: string | null
          colecoes_destaque: Json | null
          colunas_desktop: number | null
          colunas_mobile: number | null
          commission_fee: number | null
          cor_primaria: string | null
          cor_secundaria: string | null
          countdown_ativo: boolean | null
          countdown_data_fim: string | null
          countdown_produto_ids: Json | null
          countdown_subtitulo: string | null
          countdown_titulo: string | null
          created_at: string
          css_personalizado: string | null
          descricao: string | null
          email_contato: string | null
          facebook: string | null
          facebook_pixel_id: string | null
          fonte_corpo: string | null
          fonte_titulos: string | null
          frete_gratis_acima: number | null
          google_analytics_id: string | null
          header_sticky: boolean | null
          header_transparente_hero: boolean | null
          hero_cta_link: string | null
          hero_cta_texto: string | null
          hero_imagem_url: string | null
          hero_overlay_opacity: number | null
          hero_subtitulo: string | null
          hero_titulo: string | null
          horario_funcionamento: Json | null
          id: string
          instagram: string | null
          layout_produtos: string | null
          logo_url: string | null
          lookbook_ativo: boolean | null
          lookbook_imagens: Json | null
          lookbook_titulo: string | null
          mais_vendidos_ids: Json | null
          mensagem_whatsapp: string | null
          mercadopago_access_token: string | null
          mercadopago_public_key: string | null
          metodos_entrega: Json | null
          metodos_pagamento: string[] | null
          mostrar_busca: boolean | null
          mostrar_categorias: boolean | null
          mostrar_codigo_produto: boolean | null
          mostrar_estoque: boolean | null
          mostrar_filtros: boolean | null
          mostrar_ordenacao: boolean | null
          mostrar_parcelamento: boolean | null
          mostrar_preco_original: boolean | null
          mostrar_whatsapp_float: boolean | null
          mp_user_id: string | null
          nome_loja: string
          organization_id: string
          parcelamento_max: number | null
          pedido_minimo: number | null
          pix_chave: string | null
          pix_cidade: string | null
          pix_nome: string | null
          pix_tipo: string | null
          politica_privacidade: string | null
          politica_troca: string | null
          popup_ativo: boolean | null
          popup_cupom: string | null
          popup_delay_segundos: number | null
          popup_imagem_url: string | null
          popup_texto: string | null
          popup_titulo: string | null
          produtos_destaque_ids: Json | null
          produtos_por_pagina: number | null
          produtos_relacionados_ativo: boolean | null
          rodape_coluna1_links: Json | null
          rodape_coluna1_titulo: string | null
          rodape_coluna2_links: Json | null
          rodape_coluna2_titulo: string | null
          rodape_endereco: string | null
          rodape_exibir_mapa: boolean | null
          secoes_homepage: Json | null
          selos_confianca: string[] | null
          slug: string
          taxa_entrega: number | null
          tempo_estimado_entrega: string | null
          texto_rodape: string | null
          updated_at: string
          whatsapp: string | null
          whatsapp_posicao: string | null
          zoom_imagem_ativo: boolean | null
        }
        Insert: {
          apenas_com_foto?: boolean | null
          ativo?: boolean
          avaliacoes_ativas?: boolean | null
          badges_produto?: string[] | null
          banner_ativo?: boolean | null
          banner_cor?: string | null
          banner_link?: string | null
          banner_posicao?: string | null
          banner_texto?: string | null
          banner_url?: string | null
          banners_carousel?: Json | null
          barra_frete_ativo?: boolean | null
          cep_origem?: string | null
          colecoes_destaque?: Json | null
          colunas_desktop?: number | null
          colunas_mobile?: number | null
          commission_fee?: number | null
          cor_primaria?: string | null
          cor_secundaria?: string | null
          countdown_ativo?: boolean | null
          countdown_data_fim?: string | null
          countdown_produto_ids?: Json | null
          countdown_subtitulo?: string | null
          countdown_titulo?: string | null
          created_at?: string
          css_personalizado?: string | null
          descricao?: string | null
          email_contato?: string | null
          facebook?: string | null
          facebook_pixel_id?: string | null
          fonte_corpo?: string | null
          fonte_titulos?: string | null
          frete_gratis_acima?: number | null
          google_analytics_id?: string | null
          header_sticky?: boolean | null
          header_transparente_hero?: boolean | null
          hero_cta_link?: string | null
          hero_cta_texto?: string | null
          hero_imagem_url?: string | null
          hero_overlay_opacity?: number | null
          hero_subtitulo?: string | null
          hero_titulo?: string | null
          horario_funcionamento?: Json | null
          id?: string
          instagram?: string | null
          layout_produtos?: string | null
          logo_url?: string | null
          lookbook_ativo?: boolean | null
          lookbook_imagens?: Json | null
          lookbook_titulo?: string | null
          mais_vendidos_ids?: Json | null
          mensagem_whatsapp?: string | null
          mercadopago_access_token?: string | null
          mercadopago_public_key?: string | null
          metodos_entrega?: Json | null
          metodos_pagamento?: string[] | null
          mostrar_busca?: boolean | null
          mostrar_categorias?: boolean | null
          mostrar_codigo_produto?: boolean | null
          mostrar_estoque?: boolean | null
          mostrar_filtros?: boolean | null
          mostrar_ordenacao?: boolean | null
          mostrar_parcelamento?: boolean | null
          mostrar_preco_original?: boolean | null
          mostrar_whatsapp_float?: boolean | null
          mp_user_id?: string | null
          nome_loja?: string
          organization_id: string
          parcelamento_max?: number | null
          pedido_minimo?: number | null
          pix_chave?: string | null
          pix_cidade?: string | null
          pix_nome?: string | null
          pix_tipo?: string | null
          politica_privacidade?: string | null
          politica_troca?: string | null
          popup_ativo?: boolean | null
          popup_cupom?: string | null
          popup_delay_segundos?: number | null
          popup_imagem_url?: string | null
          popup_texto?: string | null
          popup_titulo?: string | null
          produtos_destaque_ids?: Json | null
          produtos_por_pagina?: number | null
          produtos_relacionados_ativo?: boolean | null
          rodape_coluna1_links?: Json | null
          rodape_coluna1_titulo?: string | null
          rodape_coluna2_links?: Json | null
          rodape_coluna2_titulo?: string | null
          rodape_endereco?: string | null
          rodape_exibir_mapa?: boolean | null
          secoes_homepage?: Json | null
          selos_confianca?: string[] | null
          slug: string
          taxa_entrega?: number | null
          tempo_estimado_entrega?: string | null
          texto_rodape?: string | null
          updated_at?: string
          whatsapp?: string | null
          whatsapp_posicao?: string | null
          zoom_imagem_ativo?: boolean | null
        }
        Update: {
          apenas_com_foto?: boolean | null
          ativo?: boolean
          avaliacoes_ativas?: boolean | null
          badges_produto?: string[] | null
          banner_ativo?: boolean | null
          banner_cor?: string | null
          banner_link?: string | null
          banner_posicao?: string | null
          banner_texto?: string | null
          banner_url?: string | null
          banners_carousel?: Json | null
          barra_frete_ativo?: boolean | null
          cep_origem?: string | null
          colecoes_destaque?: Json | null
          colunas_desktop?: number | null
          colunas_mobile?: number | null
          commission_fee?: number | null
          cor_primaria?: string | null
          cor_secundaria?: string | null
          countdown_ativo?: boolean | null
          countdown_data_fim?: string | null
          countdown_produto_ids?: Json | null
          countdown_subtitulo?: string | null
          countdown_titulo?: string | null
          created_at?: string
          css_personalizado?: string | null
          descricao?: string | null
          email_contato?: string | null
          facebook?: string | null
          facebook_pixel_id?: string | null
          fonte_corpo?: string | null
          fonte_titulos?: string | null
          frete_gratis_acima?: number | null
          google_analytics_id?: string | null
          header_sticky?: boolean | null
          header_transparente_hero?: boolean | null
          hero_cta_link?: string | null
          hero_cta_texto?: string | null
          hero_imagem_url?: string | null
          hero_overlay_opacity?: number | null
          hero_subtitulo?: string | null
          hero_titulo?: string | null
          horario_funcionamento?: Json | null
          id?: string
          instagram?: string | null
          layout_produtos?: string | null
          logo_url?: string | null
          lookbook_ativo?: boolean | null
          lookbook_imagens?: Json | null
          lookbook_titulo?: string | null
          mais_vendidos_ids?: Json | null
          mensagem_whatsapp?: string | null
          mercadopago_access_token?: string | null
          mercadopago_public_key?: string | null
          metodos_entrega?: Json | null
          metodos_pagamento?: string[] | null
          mostrar_busca?: boolean | null
          mostrar_categorias?: boolean | null
          mostrar_codigo_produto?: boolean | null
          mostrar_estoque?: boolean | null
          mostrar_filtros?: boolean | null
          mostrar_ordenacao?: boolean | null
          mostrar_parcelamento?: boolean | null
          mostrar_preco_original?: boolean | null
          mostrar_whatsapp_float?: boolean | null
          mp_user_id?: string | null
          nome_loja?: string
          organization_id?: string
          parcelamento_max?: number | null
          pedido_minimo?: number | null
          pix_chave?: string | null
          pix_cidade?: string | null
          pix_nome?: string | null
          pix_tipo?: string | null
          politica_privacidade?: string | null
          politica_troca?: string | null
          popup_ativo?: boolean | null
          popup_cupom?: string | null
          popup_delay_segundos?: number | null
          popup_imagem_url?: string | null
          popup_texto?: string | null
          popup_titulo?: string | null
          produtos_destaque_ids?: Json | null
          produtos_por_pagina?: number | null
          produtos_relacionados_ativo?: boolean | null
          rodape_coluna1_links?: Json | null
          rodape_coluna1_titulo?: string | null
          rodape_coluna2_links?: Json | null
          rodape_coluna2_titulo?: string | null
          rodape_endereco?: string | null
          rodape_exibir_mapa?: boolean | null
          secoes_homepage?: Json | null
          selos_confianca?: string[] | null
          slug?: string
          taxa_entrega?: number | null
          tempo_estimado_entrega?: string | null
          texto_rodape?: string | null
          updated_at?: string
          whatsapp?: string | null
          whatsapp_posicao?: string | null
          zoom_imagem_ativo?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ecommerce_config_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ecommerce_pedido_itens: {
        Row: {
          created_at: string
          id: string
          peca_id: string
          pedido_id: string
          preco_unitario: number
          quantidade: number
        }
        Insert: {
          created_at?: string
          id?: string
          peca_id: string
          pedido_id: string
          preco_unitario?: number
          quantidade?: number
        }
        Update: {
          created_at?: string
          id?: string
          peca_id?: string
          pedido_id?: string
          preco_unitario?: number
          quantidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "ecommerce_pedido_itens_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecommerce_pedido_itens_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas_loja_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecommerce_pedido_itens_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "ecommerce_pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      ecommerce_pedidos: {
        Row: {
          cliente_cpf: string | null
          cliente_email: string | null
          cliente_nome: string
          cliente_telefone: string | null
          codigo_rastreio: string | null
          created_at: string
          cupom_id: string | null
          endereco: Json | null
          id: string
          mercadopago_payment_id: string | null
          metodo_pagamento: string | null
          numero_pedido: number
          organization_id: string
          status: string
          transportadora: string | null
          updated_at: string
          valor_desconto: number | null
          valor_frete: number
          valor_subtotal: number
          valor_total: number
        }
        Insert: {
          cliente_cpf?: string | null
          cliente_email?: string | null
          cliente_nome: string
          cliente_telefone?: string | null
          codigo_rastreio?: string | null
          created_at?: string
          cupom_id?: string | null
          endereco?: Json | null
          id?: string
          mercadopago_payment_id?: string | null
          metodo_pagamento?: string | null
          numero_pedido?: number
          organization_id: string
          status?: string
          transportadora?: string | null
          updated_at?: string
          valor_desconto?: number | null
          valor_frete?: number
          valor_subtotal?: number
          valor_total?: number
        }
        Update: {
          cliente_cpf?: string | null
          cliente_email?: string | null
          cliente_nome?: string
          cliente_telefone?: string | null
          codigo_rastreio?: string | null
          created_at?: string
          cupom_id?: string | null
          endereco?: Json | null
          id?: string
          mercadopago_payment_id?: string | null
          metodo_pagamento?: string | null
          numero_pedido?: number
          organization_id?: string
          status?: string
          transportadora?: string | null
          updated_at?: string
          valor_desconto?: number | null
          valor_frete?: number
          valor_subtotal?: number
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "ecommerce_pedidos_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          aberto_at: string | null
          assunto: string
          conversa_id: string | null
          created_at: string | null
          destinatario_email: string
          destinatario_nome: string | null
          enviado_at: string | null
          erro_mensagem: string | null
          id: string
          metadata: Json | null
          organization_id: string | null
          status: string | null
          template_id: string | null
        }
        Insert: {
          aberto_at?: string | null
          assunto: string
          conversa_id?: string | null
          created_at?: string | null
          destinatario_email: string
          destinatario_nome?: string | null
          enviado_at?: string | null
          erro_mensagem?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          status?: string | null
          template_id?: string | null
        }
        Update: {
          aberto_at?: string | null
          assunto?: string
          conversa_id?: string | null
          created_at?: string | null
          destinatario_email?: string
          destinatario_nome?: string | null
          enviado_at?: string | null
          erro_mensagem?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          status?: string | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_conversa_id_fkey"
            columns: ["conversa_id"]
            isOneToOne: false
            referencedRelation: "agente_conversas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          assunto: string
          ativo: boolean | null
          corpo_html: string
          corpo_texto: string | null
          created_at: string | null
          id: string
          nome: string
          organization_id: string | null
          tipo: string
          updated_at: string | null
          variaveis: string[] | null
        }
        Insert: {
          assunto: string
          ativo?: boolean | null
          corpo_html: string
          corpo_texto?: string | null
          created_at?: string | null
          id?: string
          nome: string
          organization_id?: string | null
          tipo?: string
          updated_at?: string | null
          variaveis?: string[] | null
        }
        Update: {
          assunto?: string
          ativo?: boolean | null
          corpo_html?: string
          corpo_texto?: string | null
          created_at?: string | null
          id?: string
          nome?: string
          organization_id?: string | null
          tipo?: string
          updated_at?: string | null
          variaveis?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      envio_galvanica_itens: {
        Row: {
          banho_id: string | null
          created_at: string
          envio_id: string | null
          id: string
          nome_peca: string | null
          peca_id: string | null
          peso: number | null
          quantidade: number
        }
        Insert: {
          banho_id?: string | null
          created_at?: string
          envio_id?: string | null
          id?: string
          nome_peca?: string | null
          peca_id?: string | null
          peso?: number | null
          quantidade?: number
        }
        Update: {
          banho_id?: string | null
          created_at?: string
          envio_id?: string | null
          id?: string
          nome_peca?: string | null
          peca_id?: string | null
          peso?: number | null
          quantidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "envio_galvanica_itens_banho_id_fkey"
            columns: ["banho_id"]
            isOneToOne: false
            referencedRelation: "banhos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "envio_galvanica_itens_envio_id_fkey"
            columns: ["envio_id"]
            isOneToOne: false
            referencedRelation: "envios_galvanica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "envio_galvanica_itens_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "envio_galvanica_itens_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas_loja_public"
            referencedColumns: ["id"]
          },
        ]
      }
      envios: {
        Row: {
          codigo_rastreio: string | null
          created_at: string
          data_entrega: string | null
          data_postagem: string | null
          destinatario_cep: string | null
          destinatario_cidade: string | null
          destinatario_endereco: string | null
          destinatario_estado: string | null
          destinatario_nome: string
          destinatario_telefone: string | null
          id: string
          maleta_id: string | null
          observacoes: string | null
          organization_id: string | null
          peso: number | null
          previsao_entrega: string | null
          romaneio_id: string | null
          status: string
          tipo_envio: string
          transportadora: string | null
          updated_at: string
          valor_frete: number
        }
        Insert: {
          codigo_rastreio?: string | null
          created_at?: string
          data_entrega?: string | null
          data_postagem?: string | null
          destinatario_cep?: string | null
          destinatario_cidade?: string | null
          destinatario_endereco?: string | null
          destinatario_estado?: string | null
          destinatario_nome: string
          destinatario_telefone?: string | null
          id?: string
          maleta_id?: string | null
          observacoes?: string | null
          organization_id?: string | null
          peso?: number | null
          previsao_entrega?: string | null
          romaneio_id?: string | null
          status?: string
          tipo_envio?: string
          transportadora?: string | null
          updated_at?: string
          valor_frete?: number
        }
        Update: {
          codigo_rastreio?: string | null
          created_at?: string
          data_entrega?: string | null
          data_postagem?: string | null
          destinatario_cep?: string | null
          destinatario_cidade?: string | null
          destinatario_endereco?: string | null
          destinatario_estado?: string | null
          destinatario_nome?: string
          destinatario_telefone?: string | null
          id?: string
          maleta_id?: string | null
          observacoes?: string | null
          organization_id?: string | null
          peso?: number | null
          previsao_entrega?: string | null
          romaneio_id?: string | null
          status?: string
          tipo_envio?: string
          transportadora?: string | null
          updated_at?: string
          valor_frete?: number
        }
        Relationships: [
          {
            foreignKeyName: "envios_maleta_id_fkey"
            columns: ["maleta_id"]
            isOneToOne: false
            referencedRelation: "maletas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "envios_maleta_id_fkey"
            columns: ["maleta_id"]
            isOneToOne: false
            referencedRelation: "maletas_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "envios_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "envios_romaneio_id_fkey"
            columns: ["romaneio_id"]
            isOneToOne: false
            referencedRelation: "romaneios"
            referencedColumns: ["id"]
          },
        ]
      }
      envios_galvanica: {
        Row: {
          created_at: string
          data_envio: string
          data_retorno: string | null
          fornecedor_id: string | null
          id: string
          observacoes: string | null
          organization_id: string | null
          peso_cobrado: number | null
          peso_total: number | null
          status: string
          updated_at: string
          valor_total: number | null
        }
        Insert: {
          created_at?: string
          data_envio?: string
          data_retorno?: string | null
          fornecedor_id?: string | null
          id?: string
          observacoes?: string | null
          organization_id?: string | null
          peso_cobrado?: number | null
          peso_total?: number | null
          status?: string
          updated_at?: string
          valor_total?: number | null
        }
        Update: {
          created_at?: string
          data_envio?: string
          data_retorno?: string | null
          fornecedor_id?: string | null
          id?: string
          observacoes?: string | null
          organization_id?: string | null
          peso_cobrado?: number | null
          peso_total?: number | null
          status?: string
          updated_at?: string
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "envios_galvanica_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "envios_galvanica_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      fiado: {
        Row: {
          cliente_id: string | null
          created_at: string
          data_vencimento: string
          id: string
          notificacao_enviada: boolean | null
          notificacao_enviada_at: string | null
          observacoes: string | null
          organization_id: string | null
          status: string
          updated_at: string
          valor_pago: number
          valor_total: number
          venda_id: string | null
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          data_vencimento: string
          id?: string
          notificacao_enviada?: boolean | null
          notificacao_enviada_at?: string | null
          observacoes?: string | null
          organization_id?: string | null
          status?: string
          updated_at?: string
          valor_pago?: number
          valor_total?: number
          venda_id?: string | null
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          data_vencimento?: string
          id?: string
          notificacao_enviada?: boolean | null
          notificacao_enviada_at?: string | null
          observacoes?: string | null
          organization_id?: string | null
          status?: string
          updated_at?: string
          valor_pago?: number
          valor_total?: number
          venda_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fiado_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiado_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiado_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      fidelidade_transacoes: {
        Row: {
          cliente_id: string
          created_at: string | null
          descricao: string | null
          id: string
          pontos: number
          tipo: string
          venda_id: string | null
        }
        Insert: {
          cliente_id: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          pontos: number
          tipo: string
          venda_id?: string | null
        }
        Update: {
          cliente_id?: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          pontos?: number
          tipo?: string
          venda_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fidelidade_transacoes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fidelidade_transacoes_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          ativo: boolean | null
          cep: string | null
          cidade: string | null
          cnpj: string | null
          created_at: string | null
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          nome: string
          observacoes: string | null
          organization_id: string | null
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          organization_id?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          organization_id?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fornecedores_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      funcionario_permissoes: {
        Row: {
          created_at: string | null
          funcionario_id: string
          id: string
          modulo: string
          pode_criar: boolean
          pode_editar: boolean
          pode_excluir: boolean
          pode_ver: boolean
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          funcionario_id: string
          id?: string
          modulo: string
          pode_criar?: boolean
          pode_editar?: boolean
          pode_excluir?: boolean
          pode_ver?: boolean
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          funcionario_id?: string
          id?: string
          modulo?: string
          pode_criar?: boolean
          pode_editar?: boolean
          pode_excluir?: boolean
          pode_ver?: boolean
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funcionario_permissoes_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      funcionarios: {
        Row: {
          ativo: boolean | null
          cargo: string | null
          cpf: string | null
          created_at: string | null
          data_admissao: string | null
          data_demissao: string | null
          email: string | null
          id: string
          nome: string
          organization_id: string | null
          salario: number | null
          telefone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ativo?: boolean | null
          cargo?: string | null
          cpf?: string | null
          created_at?: string | null
          data_admissao?: string | null
          data_demissao?: string | null
          email?: string | null
          id?: string
          nome: string
          organization_id?: string | null
          salario?: number | null
          telefone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ativo?: boolean | null
          cargo?: string | null
          cpf?: string | null
          created_at?: string | null
          data_admissao?: string | null
          data_demissao?: string | null
          email?: string | null
          id?: string
          nome?: string
          organization_id?: string | null
          salario?: number | null
          telefone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funcionarios_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_atividades: {
        Row: {
          acao: string
          created_at: string | null
          dados_anteriores: Json | null
          dados_novos: Json | null
          id: string
          ip_address: string | null
          organization_id: string | null
          registro_id: string | null
          tabela: string
          user_id: string | null
          usuario_nome: string | null
        }
        Insert: {
          acao: string
          created_at?: string | null
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip_address?: string | null
          organization_id?: string | null
          registro_id?: string | null
          tabela: string
          user_id?: string | null
          usuario_nome?: string | null
        }
        Update: {
          acao?: string
          created_at?: string | null
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip_address?: string | null
          organization_id?: string | null
          registro_id?: string | null
          tabela?: string
          user_id?: string | null
          usuario_nome?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historico_atividades_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_precos: {
        Row: {
          created_at: string | null
          id: string
          peca_id: string
          preco_anterior: number | null
          preco_novo: number | null
          tipo_preco: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          peca_id: string
          preco_anterior?: number | null
          preco_novo?: number | null
          tipo_preco?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          peca_id?: string
          preco_anterior?: number | null
          preco_novo?: number | null
          tipo_preco?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historico_precos_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_precos_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas_loja_public"
            referencedColumns: ["id"]
          },
        ]
      }
      loja_avaliacoes: {
        Row: {
          aprovada: boolean | null
          cliente_email: string
          cliente_nome: string
          comentario: string | null
          created_at: string
          id: string
          organization_id: string
          peca_id: string
          rating: number
        }
        Insert: {
          aprovada?: boolean | null
          cliente_email: string
          cliente_nome: string
          comentario?: string | null
          created_at?: string
          id?: string
          organization_id: string
          peca_id: string
          rating: number
        }
        Update: {
          aprovada?: boolean | null
          cliente_email?: string
          cliente_nome?: string
          comentario?: string | null
          created_at?: string
          id?: string
          organization_id?: string
          peca_id?: string
          rating?: number
        }
        Relationships: []
      }
      loja_avise_me: {
        Row: {
          created_at: string
          email: string
          id: string
          notificado: boolean | null
          organization_id: string
          peca_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          notificado?: boolean | null
          organization_id: string
          peca_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          notificado?: boolean | null
          organization_id?: string
          peca_id?: string
        }
        Relationships: []
      }
      loja_favoritos: {
        Row: {
          cliente_email: string
          created_at: string
          id: string
          organization_id: string
          peca_id: string
        }
        Insert: {
          cliente_email: string
          created_at?: string
          id?: string
          organization_id: string
          peca_id: string
        }
        Update: {
          cliente_email?: string
          created_at?: string
          id?: string
          organization_id?: string
          peca_id?: string
        }
        Relationships: []
      }
      maleta_interesse_itens: {
        Row: {
          created_at: string | null
          id: string
          interesse_id: string
          peca_id: string
          quantidade: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          interesse_id: string
          peca_id: string
          quantidade?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          interesse_id?: string
          peca_id?: string
          quantidade?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "maleta_interesse_itens_interesse_id_fkey"
            columns: ["interesse_id"]
            isOneToOne: false
            referencedRelation: "maleta_interesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maleta_interesse_itens_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maleta_interesse_itens_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas_loja_public"
            referencedColumns: ["id"]
          },
        ]
      }
      maleta_interesses: {
        Row: {
          cliente_email: string | null
          cliente_nome: string
          cliente_telefone: string | null
          created_at: string | null
          id: string
          maleta_id: string
          observacoes: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          cliente_email?: string | null
          cliente_nome: string
          cliente_telefone?: string | null
          created_at?: string | null
          id?: string
          maleta_id: string
          observacoes?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          cliente_email?: string | null
          cliente_nome?: string
          cliente_telefone?: string | null
          created_at?: string | null
          id?: string
          maleta_id?: string
          observacoes?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maleta_interesses_maleta_id_fkey"
            columns: ["maleta_id"]
            isOneToOne: false
            referencedRelation: "maletas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maleta_interesses_maleta_id_fkey"
            columns: ["maleta_id"]
            isOneToOne: false
            referencedRelation: "maletas_public"
            referencedColumns: ["id"]
          },
        ]
      }
      maletas: {
        Row: {
          codigo: string | null
          cor_primaria: string | null
          cor_secundaria: string | null
          created_at: string | null
          data_devolucao: string | null
          data_entrega: string | null
          descricao: string | null
          id: string
          imagem_capa: string | null
          is_public: boolean | null
          nome: string
          observacoes: string | null
          organization_id: string | null
          revendedora_id: string | null
          sharing_slug: string | null
          status: string | null
          updated_at: string | null
          valor_total: number | null
        }
        Insert: {
          codigo?: string | null
          cor_primaria?: string | null
          cor_secundaria?: string | null
          created_at?: string | null
          data_devolucao?: string | null
          data_entrega?: string | null
          descricao?: string | null
          id?: string
          imagem_capa?: string | null
          is_public?: boolean | null
          nome: string
          observacoes?: string | null
          organization_id?: string | null
          revendedora_id?: string | null
          sharing_slug?: string | null
          status?: string | null
          updated_at?: string | null
          valor_total?: number | null
        }
        Update: {
          codigo?: string | null
          cor_primaria?: string | null
          cor_secundaria?: string | null
          created_at?: string | null
          data_devolucao?: string | null
          data_entrega?: string | null
          descricao?: string | null
          id?: string
          imagem_capa?: string | null
          is_public?: boolean | null
          nome?: string
          observacoes?: string | null
          organization_id?: string | null
          revendedora_id?: string | null
          sharing_slug?: string | null
          status?: string | null
          updated_at?: string | null
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "maletas_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maletas_revendedora_id_fkey"
            columns: ["revendedora_id"]
            isOneToOne: false
            referencedRelation: "revendedoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maletas_revendedora_id_fkey"
            columns: ["revendedora_id"]
            isOneToOne: false
            referencedRelation: "revendedoras_portal_public"
            referencedColumns: ["id"]
          },
        ]
      }
      maletas_pecas: {
        Row: {
          created_at: string | null
          data_venda: string | null
          id: string
          maleta_id: string
          peca_id: string
          preco_unitario: number | null
          quantidade: number
          quantidade_vendida: number | null
          updated_at: string | null
          vendida: boolean | null
        }
        Insert: {
          created_at?: string | null
          data_venda?: string | null
          id?: string
          maleta_id: string
          peca_id: string
          preco_unitario?: number | null
          quantidade?: number
          quantidade_vendida?: number | null
          updated_at?: string | null
          vendida?: boolean | null
        }
        Update: {
          created_at?: string | null
          data_venda?: string | null
          id?: string
          maleta_id?: string
          peca_id?: string
          preco_unitario?: number | null
          quantidade?: number
          quantidade_vendida?: number | null
          updated_at?: string | null
          vendida?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "maletas_pecas_maleta_id_fkey"
            columns: ["maleta_id"]
            isOneToOne: false
            referencedRelation: "maletas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maletas_pecas_maleta_id_fkey"
            columns: ["maleta_id"]
            isOneToOne: false
            referencedRelation: "maletas_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maletas_pecas_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maletas_pecas_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas_loja_public"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      metas: {
        Row: {
          atingida: boolean | null
          campanha_id: string | null
          created_at: string | null
          data_fim: string | null
          data_inicio: string | null
          descricao: string | null
          id: string
          organization_id: string | null
          revendedora_id: string | null
          tipo: string | null
          titulo: string
          updated_at: string | null
          valor_atual: number | null
          valor_meta: number
        }
        Insert: {
          atingida?: boolean | null
          campanha_id?: string | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          organization_id?: string | null
          revendedora_id?: string | null
          tipo?: string | null
          titulo: string
          updated_at?: string | null
          valor_atual?: number | null
          valor_meta: number
        }
        Update: {
          atingida?: boolean | null
          campanha_id?: string | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          organization_id?: string | null
          revendedora_id?: string | null
          tipo?: string | null
          titulo?: string
          updated_at?: string | null
          valor_atual?: number | null
          valor_meta?: number
        }
        Relationships: [
          {
            foreignKeyName: "metas_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metas_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metas_revendedora_id_fkey"
            columns: ["revendedora_id"]
            isOneToOne: false
            referencedRelation: "revendedoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metas_revendedora_id_fkey"
            columns: ["revendedora_id"]
            isOneToOne: false
            referencedRelation: "revendedoras_portal_public"
            referencedColumns: ["id"]
          },
        ]
      }
      modelos_etiquetas: {
        Row: {
          altura: number
          ativo: boolean | null
          campos: Json | null
          created_at: string | null
          id: string
          largura: number
          nome: string
          organization_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          altura?: number
          ativo?: boolean | null
          campos?: Json | null
          created_at?: string | null
          id?: string
          largura?: number
          nome?: string
          organization_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          altura?: number
          ativo?: boolean | null
          campos?: Json | null
          created_at?: string | null
          id?: string
          largura?: number
          nome?: string
          organization_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "modelos_etiquetas_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      movimentos_caixa: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          operador_id: string | null
          sessao_id: string
          tipo: string
          valor: number
          venda_id: string | null
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          operador_id?: string | null
          sessao_id: string
          tipo: string
          valor: number
          venda_id?: string | null
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          operador_id?: string | null
          sessao_id?: string
          tipo?: string
          valor?: number
          venda_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movimentos_caixa_sessao_id_fkey"
            columns: ["sessao_id"]
            isOneToOne: false
            referencedRelation: "caixa_sessoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentos_caixa_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      movimentos_pontos: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          pontos_fidelidade_id: string
          quantidade: number
          tipo: string
          venda_id: string | null
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          pontos_fidelidade_id: string
          quantidade: number
          tipo?: string
          venda_id?: string | null
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          pontos_fidelidade_id?: string
          quantidade?: number
          tipo?: string
          venda_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movimentos_pontos_pontos_fidelidade_id_fkey"
            columns: ["pontos_fidelidade_id"]
            isOneToOne: false
            referencedRelation: "pontos_fidelidade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentos_pontos_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          ativo: boolean | null
          created_at: string
          email: string
          id: string
          organization_id: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string
          email: string
          id?: string
          organization_id?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string
          email?: string
          id?: string
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_subscribers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      niveis_fidelidade: {
        Row: {
          beneficios: string | null
          cor: string
          created_at: string
          desconto_percentual: number
          icone: string | null
          id: string
          nome: string
          organization_id: string | null
          pontos_minimos: number
          user_id: string
        }
        Insert: {
          beneficios?: string | null
          cor?: string
          created_at?: string
          desconto_percentual?: number
          icone?: string | null
          id?: string
          nome: string
          organization_id?: string | null
          pontos_minimos?: number
          user_id: string
        }
        Update: {
          beneficios?: string | null
          cor?: string
          created_at?: string
          desconto_percentual?: number
          icone?: string | null
          id?: string
          nome?: string
          organization_id?: string | null
          pontos_minimos?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "niveis_fidelidade_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          created_at: string | null
          id: string
          lida: boolean | null
          link: string | null
          mensagem: string | null
          tipo: string | null
          titulo: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lida?: boolean | null
          link?: string | null
          mensagem?: string | null
          tipo?: string | null
          titulo: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lida?: boolean | null
          link?: string | null
          mensagem?: string | null
          tipo?: string | null
          titulo?: string
          user_id?: string | null
        }
        Relationships: []
      }
      notificacoes_assinatura: {
        Row: {
          created_at: string
          email_enviado: boolean | null
          id: string
          lida: boolean | null
          mensagem: string
          tipo: string
          titulo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_enviado?: boolean | null
          id?: string
          lida?: boolean | null
          mensagem: string
          tipo: string
          titulo: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_enviado?: boolean | null
          id?: string
          lida?: boolean | null
          mensagem?: string
          tipo?: string
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string | null
          slug: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id?: string | null
          slug?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string | null
          slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pecas: {
        Row: {
          ativo: boolean | null
          catalogo_only: boolean | null
          categoria: string | null
          codigo: string | null
          codigo_barras: string | null
          created_at: string | null
          descricao: string | null
          disponivel_loja: boolean
          estoque: number | null
          estoque_minimo: number | null
          fornecedor_id: string | null
          id: string
          imagem_url: string | null
          material: string | null
          nome: string
          organization_id: string | null
          peso: number | null
          preco_custo: number | null
          preco_revenda: number | null
          preco_venda: number | null
          subcategoria: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          catalogo_only?: boolean | null
          categoria?: string | null
          codigo?: string | null
          codigo_barras?: string | null
          created_at?: string | null
          descricao?: string | null
          disponivel_loja?: boolean
          estoque?: number | null
          estoque_minimo?: number | null
          fornecedor_id?: string | null
          id?: string
          imagem_url?: string | null
          material?: string | null
          nome: string
          organization_id?: string | null
          peso?: number | null
          preco_custo?: number | null
          preco_revenda?: number | null
          preco_venda?: number | null
          subcategoria?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          catalogo_only?: boolean | null
          categoria?: string | null
          codigo?: string | null
          codigo_barras?: string | null
          created_at?: string | null
          descricao?: string | null
          disponivel_loja?: boolean
          estoque?: number | null
          estoque_minimo?: number | null
          fornecedor_id?: string | null
          id?: string
          imagem_url?: string | null
          material?: string | null
          nome?: string
          organization_id?: string | null
          peso?: number | null
          preco_custo?: number | null
          preco_revenda?: number | null
          preco_venda?: number | null
          subcategoria?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pecas_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pecas_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos_catalogo: {
        Row: {
          catalogo_id: string | null
          cliente_email: string | null
          cliente_nome: string
          cliente_telefone: string | null
          created_at: string | null
          id: string
          observacoes: string | null
          status: string | null
          updated_at: string | null
          valor_total: number | null
        }
        Insert: {
          catalogo_id?: string | null
          cliente_email?: string | null
          cliente_nome: string
          cliente_telefone?: string | null
          created_at?: string | null
          id?: string
          observacoes?: string | null
          status?: string | null
          updated_at?: string | null
          valor_total?: number | null
        }
        Update: {
          catalogo_id?: string | null
          cliente_email?: string | null
          cliente_nome?: string
          cliente_telefone?: string | null
          created_at?: string | null
          id?: string
          observacoes?: string | null
          status?: string | null
          updated_at?: string | null
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_catalogo_catalogo_id_fkey"
            columns: ["catalogo_id"]
            isOneToOne: false
            referencedRelation: "catalogos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_catalogo_catalogo_id_fkey"
            columns: ["catalogo_id"]
            isOneToOne: false
            referencedRelation: "catalogos_public"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos_catalogo_itens: {
        Row: {
          created_at: string | null
          id: string
          peca_id: string
          pedido_id: string
          preco_unitario: number | null
          quantidade: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          peca_id: string
          pedido_id: string
          preco_unitario?: number | null
          quantidade?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          peca_id?: string
          pedido_id?: string
          preco_unitario?: number | null
          quantidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_catalogo_itens_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_catalogo_itens_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas_loja_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_catalogo_itens_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos_catalogo"
            referencedColumns: ["id"]
          },
        ]
      }
      pontos_fidelidade: {
        Row: {
          cliente_id: string
          created_at: string
          id: string
          nivel_atual_id: string | null
          organization_id: string | null
          pontos_disponiveis: number
          pontos_totais: number
          updated_at: string
          user_id: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          id?: string
          nivel_atual_id?: string | null
          organization_id?: string | null
          pontos_disponiveis?: number
          pontos_totais?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          id?: string
          nivel_atual_id?: string | null
          organization_id?: string | null
          pontos_disponiveis?: number
          pontos_totais?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pontos_fidelidade_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pontos_fidelidade_nivel_atual_id_fkey"
            columns: ["nivel_atual_id"]
            isOneToOne: false
            referencedRelation: "niveis_fidelidade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pontos_fidelidade_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      produto_associacoes: {
        Row: {
          created_at: string | null
          id: string
          organization_id: string | null
          peca_associada_id: string | null
          peca_origem_id: string | null
          score: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          organization_id?: string | null
          peca_associada_id?: string | null
          peca_origem_id?: string | null
          score?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          organization_id?: string | null
          peca_associada_id?: string | null
          peca_origem_id?: string | null
          score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "produto_associacoes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produto_associacoes_peca_associada_id_fkey"
            columns: ["peca_associada_id"]
            isOneToOne: false
            referencedRelation: "pecas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produto_associacoes_peca_associada_id_fkey"
            columns: ["peca_associada_id"]
            isOneToOne: false
            referencedRelation: "pecas_loja_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produto_associacoes_peca_origem_id_fkey"
            columns: ["peca_origem_id"]
            isOneToOne: false
            referencedRelation: "pecas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produto_associacoes_peca_origem_id_fkey"
            columns: ["peca_origem_id"]
            isOneToOne: false
            referencedRelation: "pecas_loja_public"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          id: string
          is_super_admin: boolean | null
          nome: string
          telefone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_super_admin?: boolean | null
          nome: string
          telefone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_super_admin?: boolean | null
          nome?: string
          telefone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          access_code: string
          cpf: string | null
          created_at: string
          email: string
          expires_at: string | null
          id: string
          last_resend_at: string | null
          mercadopago_preference_id: string | null
          name: string
          notified_expired: boolean | null
          notified_expiring: boolean | null
          payment_status: string
          phone: string | null
          plan: string
          resend_count: number | null
          updated_at: string
        }
        Insert: {
          access_code: string
          cpf?: string | null
          created_at?: string
          email: string
          expires_at?: string | null
          id?: string
          last_resend_at?: string | null
          mercadopago_preference_id?: string | null
          name: string
          notified_expired?: boolean | null
          notified_expiring?: boolean | null
          payment_status?: string
          phone?: string | null
          plan: string
          resend_count?: number | null
          updated_at?: string
        }
        Update: {
          access_code?: string
          cpf?: string | null
          created_at?: string
          email?: string
          expires_at?: string | null
          id?: string
          last_resend_at?: string | null
          mercadopago_preference_id?: string | null
          name?: string
          notified_expired?: boolean | null
          notified_expiring?: boolean | null
          payment_status?: string
          phone?: string | null
          plan?: string
          resend_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      rastreio_eventos: {
        Row: {
          created_at: string
          data: string
          descricao: string
          envio_id: string
          id: string
          local: string | null
        }
        Insert: {
          created_at?: string
          data?: string
          descricao: string
          envio_id: string
          id?: string
          local?: string | null
        }
        Update: {
          created_at?: string
          data?: string
          descricao?: string
          envio_id?: string
          id?: string
          local?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rastreio_eventos_envio_id_fkey"
            columns: ["envio_id"]
            isOneToOne: false
            referencedRelation: "envios"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          created_at: string
          endpoint: string
          id: number
          identifier: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: number
          identifier: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: number
          identifier?: string
        }
        Relationships: []
      }
      recompensas_fidelidade: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          nome: string
          organization_id: string | null
          pontos_necessarios: number
          produto_id: string | null
          quantidade_disponivel: number | null
          tipo: string
          user_id: string
          valor_desconto: number | null
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          organization_id?: string | null
          pontos_necessarios?: number
          produto_id?: string | null
          quantidade_disponivel?: number | null
          tipo?: string
          user_id: string
          valor_desconto?: number | null
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          organization_id?: string | null
          pontos_necessarios?: number
          produto_id?: string | null
          quantidade_disponivel?: number | null
          tipo?: string
          user_id?: string
          valor_desconto?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "recompensas_fidelidade_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recompensas_fidelidade_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "pecas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recompensas_fidelidade_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "pecas_loja_public"
            referencedColumns: ["id"]
          },
        ]
      }
      revendedoras: {
        Row: {
          ativo: boolean | null
          cep: string | null
          cidade: string | null
          comissao_percentual: number | null
          cpf: string | null
          created_at: string | null
          data_nascimento: string | null
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          nome: string
          observacoes: string | null
          organization_id: string | null
          saldo_comissao: number | null
          senha_portal: string | null
          telefone: string | null
          updated_at: string | null
          user_id: string | null
          usuario_portal: string | null
          whatsapp: string | null
        }
        Insert: {
          ativo?: boolean | null
          cep?: string | null
          cidade?: string | null
          comissao_percentual?: number | null
          cpf?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          organization_id?: string | null
          saldo_comissao?: number | null
          senha_portal?: string | null
          telefone?: string | null
          updated_at?: string | null
          user_id?: string | null
          usuario_portal?: string | null
          whatsapp?: string | null
        }
        Update: {
          ativo?: boolean | null
          cep?: string | null
          cidade?: string | null
          comissao_percentual?: number | null
          cpf?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          organization_id?: string | null
          saldo_comissao?: number | null
          senha_portal?: string | null
          telefone?: string | null
          updated_at?: string | null
          user_id?: string | null
          usuario_portal?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "revendedoras_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      romaneios: {
        Row: {
          cep: string | null
          cidade: string | null
          cliente_telefone: string | null
          codigo_rastreio: string | null
          created_at: string | null
          data_criacao: string | null
          data_entrega: string | null
          data_envio: string | null
          data_previsao: string | null
          endereco_entrega: string | null
          estado: string | null
          id: string
          numero: string | null
          observacoes: string | null
          organization_id: string | null
          revendedora_id: string | null
          status: string | null
          transportadora: string | null
          updated_at: string | null
          valor_frete: number | null
        }
        Insert: {
          cep?: string | null
          cidade?: string | null
          cliente_telefone?: string | null
          codigo_rastreio?: string | null
          created_at?: string | null
          data_criacao?: string | null
          data_entrega?: string | null
          data_envio?: string | null
          data_previsao?: string | null
          endereco_entrega?: string | null
          estado?: string | null
          id?: string
          numero?: string | null
          observacoes?: string | null
          organization_id?: string | null
          revendedora_id?: string | null
          status?: string | null
          transportadora?: string | null
          updated_at?: string | null
          valor_frete?: number | null
        }
        Update: {
          cep?: string | null
          cidade?: string | null
          cliente_telefone?: string | null
          codigo_rastreio?: string | null
          created_at?: string | null
          data_criacao?: string | null
          data_entrega?: string | null
          data_envio?: string | null
          data_previsao?: string | null
          endereco_entrega?: string | null
          estado?: string | null
          id?: string
          numero?: string | null
          observacoes?: string | null
          organization_id?: string | null
          revendedora_id?: string | null
          status?: string | null
          transportadora?: string | null
          updated_at?: string | null
          valor_frete?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "romaneios_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "romaneios_revendedora_id_fkey"
            columns: ["revendedora_id"]
            isOneToOne: false
            referencedRelation: "revendedoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "romaneios_revendedora_id_fkey"
            columns: ["revendedora_id"]
            isOneToOne: false
            referencedRelation: "revendedoras_portal_public"
            referencedColumns: ["id"]
          },
        ]
      }
      romaneios_pecas: {
        Row: {
          created_at: string | null
          id: string
          peca_id: string
          quantidade: number
          romaneio_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          peca_id: string
          quantidade?: number
          romaneio_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          peca_id?: string
          quantidade?: number
          romaneio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "romaneios_pecas_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "romaneios_pecas_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas_loja_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "romaneios_pecas_romaneio_id_fkey"
            columns: ["romaneio_id"]
            isOneToOne: false
            referencedRelation: "romaneios"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          chave: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
          valor: string | null
        }
        Insert: {
          chave: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          valor?: string | null
        }
        Update: {
          chave?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          valor?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendas: {
        Row: {
          cliente_id: string | null
          created_at: string | null
          cupom_desconto: string | null
          data_venda: string | null
          desconto: number | null
          desconto_percentual: number | null
          forma_pagamento: string | null
          id: string
          numero: string | null
          observacoes: string | null
          organization_id: string | null
          parcelas: number | null
          pontos_utilizados: number | null
          revendedora_id: string | null
          status: string | null
          subtotal: number
          updated_at: string | null
          valor_total: number
          vendedor_id: string | null
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string | null
          cupom_desconto?: string | null
          data_venda?: string | null
          desconto?: number | null
          desconto_percentual?: number | null
          forma_pagamento?: string | null
          id?: string
          numero?: string | null
          observacoes?: string | null
          organization_id?: string | null
          parcelas?: number | null
          pontos_utilizados?: number | null
          revendedora_id?: string | null
          status?: string | null
          subtotal?: number
          updated_at?: string | null
          valor_total?: number
          vendedor_id?: string | null
        }
        Update: {
          cliente_id?: string | null
          created_at?: string | null
          cupom_desconto?: string | null
          data_venda?: string | null
          desconto?: number | null
          desconto_percentual?: number | null
          forma_pagamento?: string | null
          id?: string
          numero?: string | null
          observacoes?: string | null
          organization_id?: string | null
          parcelas?: number | null
          pontos_utilizados?: number | null
          revendedora_id?: string | null
          status?: string | null
          subtotal?: number
          updated_at?: string | null
          valor_total?: number
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_revendedora_id_fkey"
            columns: ["revendedora_id"]
            isOneToOne: false
            referencedRelation: "revendedoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_revendedora_id_fkey"
            columns: ["revendedora_id"]
            isOneToOne: false
            referencedRelation: "revendedoras_portal_public"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas_pecas: {
        Row: {
          created_at: string | null
          desconto: number | null
          id: string
          peca_id: string
          preco_unitario: number
          quantidade: number
          subtotal: number
          venda_id: string
        }
        Insert: {
          created_at?: string | null
          desconto?: number | null
          id?: string
          peca_id: string
          preco_unitario: number
          quantidade?: number
          subtotal: number
          venda_id: string
        }
        Update: {
          created_at?: string | null
          desconto?: number | null
          id?: string
          peca_id?: string
          preco_unitario?: number
          quantidade?: number
          subtotal?: number
          venda_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendas_pecas_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_pecas_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas_loja_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_pecas_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_queue: {
        Row: {
          attempts: number
          created_at: string
          headers: Json | null
          id: string
          last_error: string | null
          payload: Json
          processed_at: string | null
          source: string
          status: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          headers?: Json | null
          id?: string
          last_error?: string | null
          payload: Json
          processed_at?: string | null
          source: string
          status?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          headers?: Json | null
          id?: string
          last_error?: string | null
          payload?: Json
          processed_at?: string | null
          source?: string
          status?: string
        }
        Relationships: []
      }
      whatsapp_templates: {
        Row: {
          ativo: boolean | null
          categoria: string | null
          created_at: string | null
          id: string
          mensagem: string
          nome: string
          organization_id: string | null
          updated_at: string | null
          variaveis: Json | null
        }
        Insert: {
          ativo?: boolean | null
          categoria?: string | null
          created_at?: string | null
          id?: string
          mensagem: string
          nome: string
          organization_id?: string | null
          updated_at?: string | null
          variaveis?: Json | null
        }
        Update: {
          ativo?: boolean | null
          categoria?: string | null
          created_at?: string | null
          id?: string
          mensagem?: string
          nome?: string
          organization_id?: string | null
          updated_at?: string | null
          variaveis?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      agente_ia_config_public: {
        Row: {
          ativo: boolean | null
          avatar_url: string | null
          cor_primaria: string | null
          mensagem_boas_vindas: string | null
          nome_agente: string | null
          organization_id: string | null
        }
        Insert: {
          ativo?: boolean | null
          avatar_url?: string | null
          cor_primaria?: string | null
          mensagem_boas_vindas?: string | null
          nome_agente?: string | null
          organization_id?: string | null
        }
        Update: {
          ativo?: boolean | null
          avatar_url?: string | null
          cor_primaria?: string | null
          mensagem_boas_vindas?: string | null
          nome_agente?: string | null
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agente_ia_config_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      catalogos_public: {
        Row: {
          ativo: boolean | null
          banner_url: string | null
          cor_primaria: string | null
          cor_secundaria: string | null
          created_at: string | null
          custo_operacional: number | null
          custo_separacao: number | null
          data_validade: string | null
          descricao: string | null
          email_contato: string | null
          id: string | null
          imagem_capa: string | null
          imagem_url: string | null
          logo_url: string | null
          mensagem_boas_vindas: string | null
          nome: string | null
          organization_id: string | null
          pedido_minimo_pecas: number | null
          slug: string | null
          status: string | null
          taxa_entrega: number | null
          titulo: string | null
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          ativo?: boolean | null
          banner_url?: string | null
          cor_primaria?: string | null
          cor_secundaria?: string | null
          created_at?: string | null
          custo_operacional?: number | null
          custo_separacao?: number | null
          data_validade?: string | null
          descricao?: string | null
          email_contato?: string | null
          id?: string | null
          imagem_capa?: string | null
          imagem_url?: string | null
          logo_url?: string | null
          mensagem_boas_vindas?: string | null
          nome?: string | null
          organization_id?: string | null
          pedido_minimo_pecas?: number | null
          slug?: string | null
          status?: string | null
          taxa_entrega?: number | null
          titulo?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          ativo?: boolean | null
          banner_url?: string | null
          cor_primaria?: string | null
          cor_secundaria?: string | null
          created_at?: string | null
          custo_operacional?: number | null
          custo_separacao?: number | null
          data_validade?: string | null
          descricao?: string | null
          email_contato?: string | null
          id?: string | null
          imagem_capa?: string | null
          imagem_url?: string | null
          logo_url?: string | null
          mensagem_boas_vindas?: string | null
          nome?: string | null
          organization_id?: string | null
          pedido_minimo_pecas?: number | null
          slug?: string | null
          status?: string | null
          taxa_entrega?: number | null
          titulo?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catalogos_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ecommerce_avaliacoes_public: {
        Row: {
          cliente_nome: string | null
          comentario: string | null
          created_at: string | null
          id: string | null
          nota: number | null
          organization_id: string | null
          peca_id: string | null
        }
        Insert: {
          cliente_nome?: string | null
          comentario?: string | null
          created_at?: string | null
          id?: string | null
          nota?: number | null
          organization_id?: string | null
          peca_id?: string | null
        }
        Update: {
          cliente_nome?: string | null
          comentario?: string | null
          created_at?: string | null
          id?: string | null
          nota?: number | null
          organization_id?: string | null
          peca_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ecommerce_avaliacoes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecommerce_avaliacoes_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecommerce_avaliacoes_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas_loja_public"
            referencedColumns: ["id"]
          },
        ]
      }
      ecommerce_config_public: {
        Row: {
          apenas_com_foto: boolean | null
          ativo: boolean | null
          avaliacoes_ativas: boolean | null
          badges_produto: string[] | null
          banner_ativo: boolean | null
          banner_cor: string | null
          banner_link: string | null
          banner_posicao: string | null
          banner_texto: string | null
          banner_url: string | null
          banners_carousel: Json | null
          barra_frete_ativo: boolean | null
          cep_origem: string | null
          colecoes_destaque: Json | null
          colunas_desktop: number | null
          colunas_mobile: number | null
          cor_primaria: string | null
          cor_secundaria: string | null
          countdown_ativo: boolean | null
          countdown_data_fim: string | null
          countdown_produto_ids: Json | null
          countdown_subtitulo: string | null
          countdown_titulo: string | null
          created_at: string | null
          css_personalizado: string | null
          descricao: string | null
          email_contato: string | null
          facebook: string | null
          facebook_pixel_id: string | null
          fonte_corpo: string | null
          fonte_titulos: string | null
          frete_gratis_acima: number | null
          google_analytics_id: string | null
          header_sticky: boolean | null
          header_transparente_hero: boolean | null
          hero_cta_link: string | null
          hero_cta_texto: string | null
          hero_imagem_url: string | null
          hero_overlay_opacity: number | null
          hero_subtitulo: string | null
          hero_titulo: string | null
          horario_funcionamento: Json | null
          id: string | null
          instagram: string | null
          layout_produtos: string | null
          logo_url: string | null
          lookbook_ativo: boolean | null
          lookbook_imagens: Json | null
          lookbook_titulo: string | null
          mais_vendidos_ids: Json | null
          mensagem_whatsapp: string | null
          mercadopago_public_key: string | null
          metodos_entrega: Json | null
          metodos_pagamento: string[] | null
          mostrar_busca: boolean | null
          mostrar_categorias: boolean | null
          mostrar_codigo_produto: boolean | null
          mostrar_estoque: boolean | null
          mostrar_filtros: boolean | null
          mostrar_ordenacao: boolean | null
          mostrar_parcelamento: boolean | null
          mostrar_preco_original: boolean | null
          mostrar_whatsapp_float: boolean | null
          nome_loja: string | null
          organization_id: string | null
          parcelamento_max: number | null
          pedido_minimo: number | null
          pix_chave: string | null
          pix_cidade: string | null
          pix_nome: string | null
          pix_tipo: string | null
          politica_privacidade: string | null
          politica_troca: string | null
          popup_ativo: boolean | null
          popup_cupom: string | null
          popup_delay_segundos: number | null
          popup_imagem_url: string | null
          popup_texto: string | null
          popup_titulo: string | null
          produtos_destaque_ids: Json | null
          produtos_por_pagina: number | null
          produtos_relacionados_ativo: boolean | null
          rodape_coluna1_links: Json | null
          rodape_coluna1_titulo: string | null
          rodape_coluna2_links: Json | null
          rodape_coluna2_titulo: string | null
          rodape_endereco: string | null
          rodape_exibir_mapa: boolean | null
          secoes_homepage: Json | null
          selos_confianca: string[] | null
          slug: string | null
          taxa_entrega: number | null
          tempo_estimado_entrega: string | null
          texto_rodape: string | null
          updated_at: string | null
          whatsapp: string | null
          whatsapp_posicao: string | null
          zoom_imagem_ativo: boolean | null
        }
        Insert: {
          apenas_com_foto?: boolean | null
          ativo?: boolean | null
          avaliacoes_ativas?: boolean | null
          badges_produto?: string[] | null
          banner_ativo?: boolean | null
          banner_cor?: string | null
          banner_link?: string | null
          banner_posicao?: string | null
          banner_texto?: string | null
          banner_url?: string | null
          banners_carousel?: Json | null
          barra_frete_ativo?: boolean | null
          cep_origem?: string | null
          colecoes_destaque?: Json | null
          colunas_desktop?: number | null
          colunas_mobile?: number | null
          cor_primaria?: string | null
          cor_secundaria?: string | null
          countdown_ativo?: boolean | null
          countdown_data_fim?: string | null
          countdown_produto_ids?: Json | null
          countdown_subtitulo?: string | null
          countdown_titulo?: string | null
          created_at?: string | null
          css_personalizado?: string | null
          descricao?: string | null
          email_contato?: string | null
          facebook?: string | null
          facebook_pixel_id?: string | null
          fonte_corpo?: string | null
          fonte_titulos?: string | null
          frete_gratis_acima?: number | null
          google_analytics_id?: string | null
          header_sticky?: boolean | null
          header_transparente_hero?: boolean | null
          hero_cta_link?: string | null
          hero_cta_texto?: string | null
          hero_imagem_url?: string | null
          hero_overlay_opacity?: number | null
          hero_subtitulo?: string | null
          hero_titulo?: string | null
          horario_funcionamento?: Json | null
          id?: string | null
          instagram?: string | null
          layout_produtos?: string | null
          logo_url?: string | null
          lookbook_ativo?: boolean | null
          lookbook_imagens?: Json | null
          lookbook_titulo?: string | null
          mais_vendidos_ids?: Json | null
          mensagem_whatsapp?: string | null
          mercadopago_public_key?: string | null
          metodos_entrega?: Json | null
          metodos_pagamento?: string[] | null
          mostrar_busca?: boolean | null
          mostrar_categorias?: boolean | null
          mostrar_codigo_produto?: boolean | null
          mostrar_estoque?: boolean | null
          mostrar_filtros?: boolean | null
          mostrar_ordenacao?: boolean | null
          mostrar_parcelamento?: boolean | null
          mostrar_preco_original?: boolean | null
          mostrar_whatsapp_float?: boolean | null
          nome_loja?: string | null
          organization_id?: string | null
          parcelamento_max?: number | null
          pedido_minimo?: number | null
          pix_chave?: string | null
          pix_cidade?: string | null
          pix_nome?: string | null
          pix_tipo?: string | null
          politica_privacidade?: string | null
          politica_troca?: string | null
          popup_ativo?: boolean | null
          popup_cupom?: string | null
          popup_delay_segundos?: number | null
          popup_imagem_url?: string | null
          popup_texto?: string | null
          popup_titulo?: string | null
          produtos_destaque_ids?: Json | null
          produtos_por_pagina?: number | null
          produtos_relacionados_ativo?: boolean | null
          rodape_coluna1_links?: Json | null
          rodape_coluna1_titulo?: string | null
          rodape_coluna2_links?: Json | null
          rodape_coluna2_titulo?: string | null
          rodape_endereco?: string | null
          rodape_exibir_mapa?: boolean | null
          secoes_homepage?: Json | null
          selos_confianca?: string[] | null
          slug?: string | null
          taxa_entrega?: number | null
          tempo_estimado_entrega?: string | null
          texto_rodape?: string | null
          updated_at?: string | null
          whatsapp?: string | null
          whatsapp_posicao?: string | null
          zoom_imagem_ativo?: boolean | null
        }
        Update: {
          apenas_com_foto?: boolean | null
          ativo?: boolean | null
          avaliacoes_ativas?: boolean | null
          badges_produto?: string[] | null
          banner_ativo?: boolean | null
          banner_cor?: string | null
          banner_link?: string | null
          banner_posicao?: string | null
          banner_texto?: string | null
          banner_url?: string | null
          banners_carousel?: Json | null
          barra_frete_ativo?: boolean | null
          cep_origem?: string | null
          colecoes_destaque?: Json | null
          colunas_desktop?: number | null
          colunas_mobile?: number | null
          cor_primaria?: string | null
          cor_secundaria?: string | null
          countdown_ativo?: boolean | null
          countdown_data_fim?: string | null
          countdown_produto_ids?: Json | null
          countdown_subtitulo?: string | null
          countdown_titulo?: string | null
          created_at?: string | null
          css_personalizado?: string | null
          descricao?: string | null
          email_contato?: string | null
          facebook?: string | null
          facebook_pixel_id?: string | null
          fonte_corpo?: string | null
          fonte_titulos?: string | null
          frete_gratis_acima?: number | null
          google_analytics_id?: string | null
          header_sticky?: boolean | null
          header_transparente_hero?: boolean | null
          hero_cta_link?: string | null
          hero_cta_texto?: string | null
          hero_imagem_url?: string | null
          hero_overlay_opacity?: number | null
          hero_subtitulo?: string | null
          hero_titulo?: string | null
          horario_funcionamento?: Json | null
          id?: string | null
          instagram?: string | null
          layout_produtos?: string | null
          logo_url?: string | null
          lookbook_ativo?: boolean | null
          lookbook_imagens?: Json | null
          lookbook_titulo?: string | null
          mais_vendidos_ids?: Json | null
          mensagem_whatsapp?: string | null
          mercadopago_public_key?: string | null
          metodos_entrega?: Json | null
          metodos_pagamento?: string[] | null
          mostrar_busca?: boolean | null
          mostrar_categorias?: boolean | null
          mostrar_codigo_produto?: boolean | null
          mostrar_estoque?: boolean | null
          mostrar_filtros?: boolean | null
          mostrar_ordenacao?: boolean | null
          mostrar_parcelamento?: boolean | null
          mostrar_preco_original?: boolean | null
          mostrar_whatsapp_float?: boolean | null
          nome_loja?: string | null
          organization_id?: string | null
          parcelamento_max?: number | null
          pedido_minimo?: number | null
          pix_chave?: string | null
          pix_cidade?: string | null
          pix_nome?: string | null
          pix_tipo?: string | null
          politica_privacidade?: string | null
          politica_troca?: string | null
          popup_ativo?: boolean | null
          popup_cupom?: string | null
          popup_delay_segundos?: number | null
          popup_imagem_url?: string | null
          popup_texto?: string | null
          popup_titulo?: string | null
          produtos_destaque_ids?: Json | null
          produtos_por_pagina?: number | null
          produtos_relacionados_ativo?: boolean | null
          rodape_coluna1_links?: Json | null
          rodape_coluna1_titulo?: string | null
          rodape_coluna2_links?: Json | null
          rodape_coluna2_titulo?: string | null
          rodape_endereco?: string | null
          rodape_exibir_mapa?: boolean | null
          secoes_homepage?: Json | null
          selos_confianca?: string[] | null
          slug?: string | null
          taxa_entrega?: number | null
          tempo_estimado_entrega?: string | null
          texto_rodape?: string | null
          updated_at?: string | null
          whatsapp?: string | null
          whatsapp_posicao?: string | null
          zoom_imagem_ativo?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ecommerce_config_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      maletas_public: {
        Row: {
          cor_primaria: string | null
          cor_secundaria: string | null
          descricao: string | null
          id: string | null
          imagem_capa: string | null
          is_public: boolean | null
          nome: string | null
          sharing_slug: string | null
          status: string | null
        }
        Insert: {
          cor_primaria?: string | null
          cor_secundaria?: string | null
          descricao?: string | null
          id?: string | null
          imagem_capa?: string | null
          is_public?: boolean | null
          nome?: string | null
          sharing_slug?: string | null
          status?: string | null
        }
        Update: {
          cor_primaria?: string | null
          cor_secundaria?: string | null
          descricao?: string | null
          id?: string | null
          imagem_capa?: string | null
          is_public?: boolean | null
          nome?: string | null
          sharing_slug?: string | null
          status?: string | null
        }
        Relationships: []
      }
      pecas_loja_public: {
        Row: {
          categoria: string | null
          codigo: string | null
          descricao: string | null
          estoque: number | null
          id: string | null
          imagem_url: string | null
          material: string | null
          nome: string | null
          organization_id: string | null
          peso: number | null
          preco_venda: number | null
        }
        Insert: {
          categoria?: string | null
          codigo?: string | null
          descricao?: string | null
          estoque?: number | null
          id?: string | null
          imagem_url?: string | null
          material?: string | null
          nome?: string | null
          organization_id?: string | null
          peso?: number | null
          preco_venda?: number | null
        }
        Update: {
          categoria?: string | null
          codigo?: string | null
          descricao?: string | null
          estoque?: number | null
          id?: string | null
          imagem_url?: string | null
          material?: string | null
          nome?: string | null
          organization_id?: string | null
          peso?: number | null
          preco_venda?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pecas_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      revendedoras_portal_public: {
        Row: {
          email: string | null
          id: string | null
          nome: string | null
        }
        Insert: {
          email?: string | null
          id?: string | null
          nome?: string | null
        }
        Update: {
          email?: string | null
          id?: string | null
          nome?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_rate_limit: {
        Args: {
          p_endpoint: string
          p_identifier: string
          p_max_requests?: number
          p_window_seconds?: number
        }
        Returns: boolean
      }
      cleanup_rate_limits: { Args: never; Returns: undefined }
      criar_dados_exemplo: { Args: { p_user_id: string }; Returns: undefined }
      criar_interesse_maleta: {
        Args: {
          p_cliente_email?: string
          p_cliente_nome: string
          p_cliente_telefone?: string
          p_itens?: Json
          p_maleta_id: string
          p_observacoes?: string
        }
        Returns: string
      }
      criar_pedido_catalogo: {
        Args: {
          p_catalogo_id: string
          p_cliente_email?: string
          p_cliente_nome: string
          p_cliente_telefone?: string
          p_itens?: Json
          p_observacoes?: string
          p_valor_total?: number
        }
        Returns: string
      }
      debitar_estoque_ecommerce: {
        Args: { p_peca_id: string; p_quantidade: number }
        Returns: undefined
      }
      fetch_avaliacoes_media: {
        Args: { p_organization_id: string }
        Returns: {
          media_nota: number
          peca_id: string
          total_avaliacoes: number
        }[]
      }
      fetch_avaliacoes_produto: {
        Args: { p_peca_id: string }
        Returns: {
          cliente_nome: string
          comentario: string
          created_at: string
          id: string
          nota: number
        }[]
      }
      fetch_cliente_pedido_itens: {
        Args: { p_pedido_id: string }
        Returns: {
          id: string
          peca_codigo: string
          peca_imagem_url: string
          peca_nome: string
          preco_unitario: number
          quantidade: number
        }[]
      }
      fetch_cliente_pedidos: {
        Args: { p_cliente_email: string; p_organization_id: string }
        Returns: {
          codigo_rastreio: string
          created_at: string
          id: string
          metodo_pagamento: string
          numero_pedido: number
          status: string
          transportadora: string
          valor_desconto: number
          valor_frete: number
          valor_total: number
        }[]
      }
      gerar_codigo_acesso: { Args: never; Returns: string }
      get_user_organization_id: { Args: never; Returns: string }
      get_user_organization_ids: { Args: never; Returns: string[] }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      portal_desfazer_venda: {
        Args: {
          p_maleta_peca_id: string
          p_quantidade_desfazer: number
          p_revendedora_id: string
        }
        Returns: boolean
      }
      portal_fetch_interesse_itens: {
        Args: { p_interesse_id: string; p_revendedora_id: string }
        Returns: {
          id: string
          peca_codigo: string
          peca_id: string
          peca_nome: string
          peca_preco_venda: number
          quantidade: number
        }[]
      }
      portal_fetch_interesses: {
        Args: { p_revendedora_id: string }
        Returns: {
          cliente_email: string
          cliente_nome: string
          cliente_telefone: string
          created_at: string
          id: string
          maleta_id: string
          observacoes: string
          status: string
          updated_at: string
        }[]
      }
      portal_fetch_maleta_pecas: {
        Args: { p_maleta_id: string; p_revendedora_id: string }
        Returns: {
          data_venda: string
          id: string
          peca_codigo: string
          peca_id: string
          peca_imagem_url: string
          peca_nome: string
          peca_preco_venda: number
          preco_unitario: number
          quantidade: number
          quantidade_vendida: number
          vendida: boolean
        }[]
      }
      portal_fetch_maletas: {
        Args: { p_revendedora_id: string }
        Returns: {
          created_at: string
          id: string
          is_public: boolean
          nome: string
          observacoes: string
          slug: string
          status: string
          updated_at: string
        }[]
      }
      portal_login_lookup: {
        Args: { p_email: string }
        Returns: {
          comissao_percentual: number
          email: string
          id: string
          nome: string
          telefone: string
        }[]
      }
      portal_marcar_vendida: {
        Args: {
          p_maleta_peca_id: string
          p_quantidade_venda: number
          p_revendedora_id: string
        }
        Returns: boolean
      }
      portal_update_interesse_status: {
        Args: {
          p_interesse_id: string
          p_revendedora_id: string
          p_status: string
        }
        Returns: boolean
      }
      registrar_cliente_loja: {
        Args: {
          p_email: string
          p_nome: string
          p_organization_id: string
          p_senha: string
          p_telefone: string
        }
        Returns: string
      }
      seed_default_email_templates: {
        Args: { p_organization_id: string }
        Returns: undefined
      }
      submeter_avaliacao: {
        Args: {
          p_cliente_email: string
          p_cliente_nome: string
          p_comentario?: string
          p_nota: number
          p_organization_id: string
          p_peca_id: string
        }
        Returns: string
      }
      usar_cupom: { Args: { p_cupom_id: string }; Returns: undefined }
      user_belongs_to_org: { Args: { _org_id: string }; Returns: boolean }
      user_is_member_of_org: { Args: { org_id: string }; Returns: boolean }
      validar_cupom: {
        Args: {
          p_codigo: string
          p_organization_id: string
          p_valor_pedido: number
        }
        Returns: {
          cupom_id: string
          desconto: number
        }[]
      }
      verify_cliente_login: {
        Args: { p_email: string; p_organization_id: string; p_password: string }
        Returns: {
          cliente_id: string
          cliente_nome: string
        }[]
      }
      verify_cliente_password: {
        Args: { p_email: string; p_organization_id: string }
        Returns: {
          cliente_id: string
          cliente_nome: string
        }[]
      }
      verify_portal_password: {
        Args: { p_email: string; p_password: string }
        Returns: {
          revendedora_id: string
          revendedora_nome: string
        }[]
      }
      verify_portal_password_by_id: {
        Args: { p_password: string; p_revendedora_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "gerente" | "vendedor" | "revendedora"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "gerente", "vendedor", "revendedora"],
    },
  },
} as const
