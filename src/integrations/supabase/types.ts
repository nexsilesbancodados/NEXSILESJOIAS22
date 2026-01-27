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
      assinaturas: {
        Row: {
          created_at: string
          data_inicio: string
          data_vencimento: string
          id: string
          notificacao_3dias_enviada: boolean | null
          notificacao_vencimento_enviada: boolean | null
          plano: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
          valor_mensal: number
        }
        Insert: {
          created_at?: string
          data_inicio?: string
          data_vencimento: string
          id?: string
          notificacao_3dias_enviada?: boolean | null
          notificacao_vencimento_enviada?: boolean | null
          plano: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
          valor_mensal: number
        }
        Update: {
          created_at?: string
          data_inicio?: string
          data_vencimento?: string
          id?: string
          notificacao_3dias_enviada?: boolean | null
          notificacao_vencimento_enviada?: boolean | null
          plano?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
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
            foreignKeyName: "catalogos_pecas_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas"
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
        ]
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
            foreignKeyName: "maletas_pecas_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas"
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
            foreignKeyName: "pedidos_catalogo_itens_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos_catalogo"
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
          nome?: string
          telefone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
          telefone: string | null
          updated_at: string | null
          user_id: string | null
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
          telefone?: string | null
          updated_at?: string | null
          user_id?: string | null
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
          telefone?: string | null
          updated_at?: string | null
          user_id?: string | null
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
            foreignKeyName: "vendas_pecas_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
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
      [_ in never]: never
    }
    Functions: {
      criar_dados_exemplo: { Args: { p_user_id: string }; Returns: undefined }
      get_user_organization_id: { Args: never; Returns: string }
      get_user_organization_ids: { Args: never; Returns: string[] }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      user_belongs_to_org: { Args: { _org_id: string }; Returns: boolean }
      user_is_member_of_org: { Args: { org_id: string }; Returns: boolean }
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
