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
      banhos: {
        Row: {
          cor: string | null
          created_at: string
          custo: number | null
          descricao: string | null
          id: string
          nome: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cor?: string | null
          created_at?: string
          custo?: number | null
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cor?: string | null
          created_at?: string
          custo?: number | null
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      caixa_sessoes: {
        Row: {
          created_at: string
          data_abertura: string | null
          data_fechamento: string | null
          id: string
          observacoes: string | null
          status: string | null
          user_id: string
          valor_final: number | null
          valor_inicial: number | null
        }
        Insert: {
          created_at?: string
          data_abertura?: string | null
          data_fechamento?: string | null
          id?: string
          observacoes?: string | null
          status?: string | null
          user_id: string
          valor_final?: number | null
          valor_inicial?: number | null
        }
        Update: {
          created_at?: string
          data_abertura?: string | null
          data_fechamento?: string | null
          id?: string
          observacoes?: string | null
          status?: string | null
          user_id?: string
          valor_final?: number | null
          valor_inicial?: number | null
        }
        Relationships: []
      }
      campanhas: {
        Row: {
          ativo: boolean | null
          categorias: string[] | null
          codigo_cupom: string | null
          created_at: string | null
          data_fim: string | null
          data_inicio: string | null
          descricao: string | null
          id: string
          limite_uso: number | null
          nome: string
          pecas_ids: string[] | null
          tipo: string
          updated_at: string | null
          user_id: string
          usos_atuais: number | null
          valor: number | null
        }
        Insert: {
          ativo?: boolean | null
          categorias?: string[] | null
          codigo_cupom?: string | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          limite_uso?: number | null
          nome: string
          pecas_ids?: string[] | null
          tipo: string
          updated_at?: string | null
          user_id: string
          usos_atuais?: number | null
          valor?: number | null
        }
        Update: {
          ativo?: boolean | null
          categorias?: string[] | null
          codigo_cupom?: string | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          limite_uso?: number | null
          nome?: string
          pecas_ids?: string[] | null
          tipo?: string
          updated_at?: string | null
          user_id?: string
          usos_atuais?: number | null
          valor?: number | null
        }
        Relationships: []
      }
      catalogo_pecas: {
        Row: {
          catalogo_id: string
          created_at: string
          destaque: boolean | null
          id: string
          peca_id: string
          preco_catalogo: number | null
        }
        Insert: {
          catalogo_id: string
          created_at?: string
          destaque?: boolean | null
          id?: string
          peca_id: string
          preco_catalogo?: number | null
        }
        Update: {
          catalogo_id?: string
          created_at?: string
          destaque?: boolean | null
          id?: string
          peca_id?: string
          preco_catalogo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "catalogo_pecas_catalogo_id_fkey"
            columns: ["catalogo_id"]
            isOneToOne: false
            referencedRelation: "catalogos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalogo_pecas_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas"
            referencedColumns: ["id"]
          },
        ]
      }
      catalogos: {
        Row: {
          ativo: boolean | null
          created_at: string
          descricao: string | null
          id: string
          nome: string
          slug: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          slug?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          slug?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      clientes: {
        Row: {
          cep: string | null
          cidade: string | null
          cpf: string | null
          created_at: string
          data_nascimento: string | null
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cep?: string | null
          cidade?: string | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cep?: string | null
          cidade?: string | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      configuracoes: {
        Row: {
          chave: string
          created_at: string
          id: string
          updated_at: string
          user_id: string | null
          valor: string | null
        }
        Insert: {
          chave: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string | null
          valor?: string | null
        }
        Update: {
          chave?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string | null
          valor?: string | null
        }
        Relationships: []
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
        ]
      }
      envios_galvanica: {
        Row: {
          created_at: string
          data_envio: string
          data_retorno: string | null
          id: string
          observacoes: string | null
          peso_total: number | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data_envio?: string
          data_retorno?: string | null
          id?: string
          observacoes?: string | null
          peso_total?: number | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data_envio?: string
          data_retorno?: string | null
          id?: string
          observacoes?: string | null
          peso_total?: number | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      fornecedores: {
        Row: {
          cep: string | null
          cidade: string | null
          cnpj: string | null
          contato: string | null
          created_at: string
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          contato?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          contato?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      historico_atividades: {
        Row: {
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          descricao: string
          entidade: string | null
          entidade_id: string | null
          id: string
          tipo: string
          user_id: string | null
          usuario_id: string | null
          usuario_nome: string | null
          valor: number | null
        }
        Insert: {
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          descricao: string
          entidade?: string | null
          entidade_id?: string | null
          id?: string
          tipo: string
          user_id?: string | null
          usuario_id?: string | null
          usuario_nome?: string | null
          valor?: number | null
        }
        Update: {
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          descricao?: string
          entidade?: string | null
          entidade_id?: string | null
          id?: string
          tipo?: string
          user_id?: string | null
          usuario_id?: string | null
          usuario_nome?: string | null
          valor?: number | null
        }
        Relationships: []
      }
      maleta_itens: {
        Row: {
          created_at: string
          id: string
          maleta_id: string
          peca_id: string | null
          preco_unitario: number | null
          quantidade: number | null
          status: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          maleta_id: string
          peca_id?: string | null
          preco_unitario?: number | null
          quantidade?: number | null
          status?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          maleta_id?: string
          peca_id?: string | null
          preco_unitario?: number | null
          quantidade?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maleta_itens_maleta_id_fkey"
            columns: ["maleta_id"]
            isOneToOne: false
            referencedRelation: "maletas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maleta_itens_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas"
            referencedColumns: ["id"]
          },
        ]
      }
      maletas: {
        Row: {
          codigo: string | null
          created_at: string
          data_devolucao: string | null
          data_devolucao_prevista: string | null
          data_emprestimo: string | null
          id: string
          observacoes: string | null
          revendedora_id: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          codigo?: string | null
          created_at?: string
          data_devolucao?: string | null
          data_devolucao_prevista?: string | null
          data_emprestimo?: string | null
          id?: string
          observacoes?: string | null
          revendedora_id?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          codigo?: string | null
          created_at?: string
          data_devolucao?: string | null
          data_devolucao_prevista?: string | null
          data_emprestimo?: string | null
          id?: string
          observacoes?: string | null
          revendedora_id?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maletas_revendedora_id_fkey"
            columns: ["revendedora_id"]
            isOneToOne: false
            referencedRelation: "revendedoras"
            referencedColumns: ["id"]
          },
        ]
      }
      metas: {
        Row: {
          ano: number
          created_at: string
          id: string
          mes: number
          tipo: string
          updated_at: string
          user_id: string
          valor: number | null
        }
        Insert: {
          ano: number
          created_at?: string
          id?: string
          mes: number
          tipo?: string
          updated_at?: string
          user_id: string
          valor?: number | null
        }
        Update: {
          ano?: number
          created_at?: string
          id?: string
          mes?: number
          tipo?: string
          updated_at?: string
          user_id?: string
          valor?: number | null
        }
        Relationships: []
      }
      modelos_etiquetas: {
        Row: {
          altura: number
          ativo: boolean | null
          campos: Json | null
          created_at: string
          id: string
          largura: number
          nome: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          altura?: number
          ativo?: boolean | null
          campos?: Json | null
          created_at?: string
          id?: string
          largura?: number
          nome: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          altura?: number
          ativo?: boolean | null
          campos?: Json | null
          created_at?: string
          id?: string
          largura?: number
          nome?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      movimentos_caixa: {
        Row: {
          caixa_sessao_id: string | null
          created_at: string
          descricao: string | null
          id: string
          tipo: string
          user_id: string | null
          valor: number
        }
        Insert: {
          caixa_sessao_id?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          tipo: string
          user_id?: string | null
          valor?: number
        }
        Update: {
          caixa_sessao_id?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          tipo?: string
          user_id?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "movimentos_caixa_caixa_sessao_id_fkey"
            columns: ["caixa_sessao_id"]
            isOneToOne: false
            referencedRelation: "caixa_sessoes"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          created_at: string
          dados: Json | null
          entidade_id: string | null
          entidade_tipo: string | null
          id: string
          lida: boolean | null
          mensagem: string | null
          tipo: string | null
          titulo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dados?: Json | null
          entidade_id?: string | null
          entidade_tipo?: string | null
          id?: string
          lida?: boolean | null
          mensagem?: string | null
          tipo?: string | null
          titulo: string
          user_id: string
        }
        Update: {
          created_at?: string
          dados?: Json | null
          entidade_id?: string | null
          entidade_tipo?: string | null
          id?: string
          lida?: boolean | null
          mensagem?: string | null
          tipo?: string | null
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
      pecas: {
        Row: {
          ativo: boolean | null
          banho_id: string | null
          categoria: string | null
          codigo: string | null
          created_at: string
          custo: number | null
          descricao: string | null
          estoque: number | null
          estoque_minimo: number | null
          fornecedor_id: string | null
          id: string
          imagem_url: string | null
          material: string | null
          nome: string
          peso: number | null
          preco: number | null
          preco_atacado: number | null
          preco_promocional: number | null
          preco_revenda: number | null
          qtd_min_atacado: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          banho_id?: string | null
          categoria?: string | null
          codigo?: string | null
          created_at?: string
          custo?: number | null
          descricao?: string | null
          estoque?: number | null
          estoque_minimo?: number | null
          fornecedor_id?: string | null
          id?: string
          imagem_url?: string | null
          material?: string | null
          nome: string
          peso?: number | null
          preco?: number | null
          preco_atacado?: number | null
          preco_promocional?: number | null
          preco_revenda?: number | null
          qtd_min_atacado?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean | null
          banho_id?: string | null
          categoria?: string | null
          codigo?: string | null
          created_at?: string
          custo?: number | null
          descricao?: string | null
          estoque?: number | null
          estoque_minimo?: number | null
          fornecedor_id?: string | null
          id?: string
          imagem_url?: string | null
          material?: string | null
          nome?: string
          peso?: number | null
          preco?: number | null
          preco_atacado?: number | null
          preco_promocional?: number | null
          preco_revenda?: number | null
          qtd_min_atacado?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pecas_banho_id_fkey"
            columns: ["banho_id"]
            isOneToOne: false
            referencedRelation: "banhos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pecas_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
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
          created_at: string
          endereco: string | null
          id: string
          observacoes: string | null
          status: string | null
          total: number | null
          updated_at: string
        }
        Insert: {
          catalogo_id?: string | null
          cliente_email?: string | null
          cliente_nome: string
          cliente_telefone?: string | null
          created_at?: string
          endereco?: string | null
          id?: string
          observacoes?: string | null
          status?: string | null
          total?: number | null
          updated_at?: string
        }
        Update: {
          catalogo_id?: string | null
          cliente_email?: string | null
          cliente_nome?: string
          cliente_telefone?: string | null
          created_at?: string
          endereco?: string | null
          id?: string
          observacoes?: string | null
          status?: string | null
          total?: number | null
          updated_at?: string
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
          created_at: string
          id: string
          peca_id: string | null
          peca_nome: string | null
          pedido_id: string
          preco_unitario: number | null
          quantidade: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          peca_id?: string | null
          peca_nome?: string | null
          pedido_id: string
          preco_unitario?: number | null
          quantidade?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          peca_id?: string | null
          peca_nome?: string | null
          pedido_id?: string
          preco_unitario?: number | null
          quantidade?: number | null
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
      permissoes: {
        Row: {
          created_at: string
          id: string
          modulo: string
          pode_criar: boolean | null
          pode_editar: boolean | null
          pode_excluir: boolean | null
          pode_ver: boolean | null
          profile_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          modulo: string
          pode_criar?: boolean | null
          pode_editar?: boolean | null
          pode_excluir?: boolean | null
          pode_ver?: boolean | null
          profile_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          modulo?: string
          pode_criar?: boolean | null
          pode_editar?: boolean | null
          pode_excluir?: boolean | null
          pode_ver?: boolean | null
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "permissoes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ativo: boolean | null
          avatar_url: string | null
          comissao: number | null
          created_at: string
          email: string | null
          id: string
          nome: string | null
          role: string | null
          senha_portal: string | null
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          avatar_url?: string | null
          comissao?: number | null
          created_at?: string
          email?: string | null
          id?: string
          nome?: string | null
          role?: string | null
          senha_portal?: string | null
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean | null
          avatar_url?: string | null
          comissao?: number | null
          created_at?: string
          email?: string | null
          id?: string
          nome?: string | null
          role?: string | null
          senha_portal?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      revendedoras: {
        Row: {
          ativa: boolean | null
          cidade: string | null
          comissao: number | null
          cpf: string | null
          created_at: string
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          nome: string
          profile_id: string | null
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ativa?: boolean | null
          cidade?: string | null
          comissao?: number | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome: string
          profile_id?: string | null
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ativa?: boolean | null
          cidade?: string | null
          comissao?: number | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome?: string
          profile_id?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "revendedoras_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      romaneio_itens: {
        Row: {
          created_at: string
          id: string
          peca_id: string | null
          peca_nome: string | null
          preco_unitario: number | null
          quantidade: number | null
          romaneio_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          peca_id?: string | null
          peca_nome?: string | null
          preco_unitario?: number | null
          quantidade?: number | null
          romaneio_id: string
        }
        Update: {
          created_at?: string
          id?: string
          peca_id?: string | null
          peca_nome?: string | null
          preco_unitario?: number | null
          quantidade?: number | null
          romaneio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "romaneio_itens_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "romaneio_itens_romaneio_id_fkey"
            columns: ["romaneio_id"]
            isOneToOne: false
            referencedRelation: "romaneios"
            referencedColumns: ["id"]
          },
        ]
      }
      romaneios: {
        Row: {
          cliente_nome: string | null
          comissao: number | null
          created_at: string
          data: string | null
          id: string
          maleta_id: string | null
          observacoes: string | null
          reseller_id: string | null
          reseller_nome: string | null
          status: string | null
          total: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cliente_nome?: string | null
          comissao?: number | null
          created_at?: string
          data?: string | null
          id?: string
          maleta_id?: string | null
          observacoes?: string | null
          reseller_id?: string | null
          reseller_nome?: string | null
          status?: string | null
          total?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cliente_nome?: string | null
          comissao?: number | null
          created_at?: string
          data?: string | null
          id?: string
          maleta_id?: string | null
          observacoes?: string | null
          reseller_id?: string | null
          reseller_nome?: string | null
          status?: string | null
          total?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "romaneios_maleta_id_fkey"
            columns: ["maleta_id"]
            isOneToOne: false
            referencedRelation: "maletas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "romaneios_reseller_id_fkey"
            columns: ["reseller_id"]
            isOneToOne: false
            referencedRelation: "revendedoras"
            referencedColumns: ["id"]
          },
        ]
      }
      venda_itens: {
        Row: {
          created_at: string
          id: string
          peca_id: string | null
          peca_nome: string | null
          preco_unitario: number | null
          quantidade: number | null
          venda_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          peca_id?: string | null
          peca_nome?: string | null
          preco_unitario?: number | null
          quantidade?: number | null
          venda_id: string
        }
        Update: {
          created_at?: string
          id?: string
          peca_id?: string | null
          peca_nome?: string | null
          preco_unitario?: number | null
          quantidade?: number | null
          venda_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venda_itens_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venda_itens_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas: {
        Row: {
          caixa_sessao_id: string | null
          cliente_id: string | null
          cliente_nome: string | null
          created_at: string
          desconto: number | null
          forma_pagamento: string | null
          id: string
          observacoes: string | null
          status: string | null
          total: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          caixa_sessao_id?: string | null
          cliente_id?: string | null
          cliente_nome?: string | null
          created_at?: string
          desconto?: number | null
          forma_pagamento?: string | null
          id?: string
          observacoes?: string | null
          status?: string | null
          total?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          caixa_sessao_id?: string | null
          cliente_id?: string | null
          cliente_nome?: string | null
          created_at?: string
          desconto?: number | null
          forma_pagamento?: string | null
          id?: string
          observacoes?: string | null
          status?: string | null
          total?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendas_caixa_sessao_id_fkey"
            columns: ["caixa_sessao_id"]
            isOneToOne: false
            referencedRelation: "caixa_sessoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_config: {
        Row: {
          ativo: boolean | null
          automacao_aniversario: boolean | null
          automacao_maleta_vencendo: boolean | null
          automacao_pedido_confirmacao: boolean | null
          created_at: string | null
          horario_fim: string | null
          horario_inicio: string | null
          id: string
          mensagem_aniversario: string | null
          mensagem_maleta: string | null
          mensagem_pedido: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          automacao_aniversario?: boolean | null
          automacao_maleta_vencendo?: boolean | null
          automacao_pedido_confirmacao?: boolean | null
          created_at?: string | null
          horario_fim?: string | null
          horario_inicio?: string | null
          id?: string
          mensagem_aniversario?: string | null
          mensagem_maleta?: string | null
          mensagem_pedido?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ativo?: boolean | null
          automacao_aniversario?: boolean | null
          automacao_maleta_vencendo?: boolean | null
          automacao_pedido_confirmacao?: boolean | null
          created_at?: string | null
          horario_fim?: string | null
          horario_inicio?: string | null
          id?: string
          mensagem_aniversario?: string | null
          mensagem_maleta?: string | null
          mensagem_pedido?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_mensagens: {
        Row: {
          created_at: string | null
          entidade_id: string | null
          entidade_tipo: string | null
          erro: string | null
          id: string
          mensagem: string
          status: string | null
          telefone: string
          tipo: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          entidade_id?: string | null
          entidade_tipo?: string | null
          erro?: string | null
          id?: string
          mensagem: string
          status?: string | null
          telefone: string
          tipo: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          entidade_id?: string | null
          entidade_tipo?: string | null
          erro?: string | null
          id?: string
          mensagem?: string
          status?: string | null
          telefone?: string
          tipo?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      criar_notificacao: {
        Args: {
          p_dados?: Json
          p_entidade_id?: string
          p_entidade_tipo?: string
          p_mensagem: string
          p_tipo: string
          p_titulo: string
          p_user_id: string
        }
        Returns: string
      }
      get_user_role: { Args: { user_uuid: string }; Returns: string }
      hash_portal_password: { Args: { password: string }; Returns: string }
      usar_cupom: { Args: { p_campanha_id: string }; Returns: undefined }
      validar_cupom: {
        Args: { p_codigo: string; p_user_id: string }
        Returns: {
          id: string
          mensagem: string
          nome: string
          tipo: string
          valido: boolean
          valor: number
        }[]
      }
      verify_portal_password: {
        Args: { p_password: string; p_user_id: string }
        Returns: {
          is_valid: boolean
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
