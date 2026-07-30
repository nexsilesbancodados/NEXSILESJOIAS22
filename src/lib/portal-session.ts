/**
 * Sessão do portal da revendedora.
 *
 * O portal não usa Supabase Auth: a revendedora entra com e-mail + senha
 * (bcrypt em revendedoras.senha_portal) e o banco devolve um token opaco de
 * sessão (tabela public_sessions, TTL de 12h). Todas as RPCs do portal recebem
 * esse token e derivam a revendedora dele — o cliente nunca informa qual
 * revendedora está acessando.
 *
 * Antes desta versão as RPCs recebiam p_revendedora_id e confiavam nele, então
 * qualquer pessoa com a chave anon podia ler e escrever dados de qualquer
 * revendedora. Não guarde o id da revendedora como se fosse credencial.
 */
import { dbRpc } from '@/lib/supabase-db';

const STORAGE_KEY = 'portal_session';

export interface PortalRevendedora {
  id: string;
  nome: string;
  comissao_percentual: number;
  telefone?: string;
  email?: string;
}

interface StoredSession {
  token: string;
  revendedora: PortalRevendedora;
}

export class PortalSessionExpired extends Error {
  constructor() {
    super('Sessão expirada');
    this.name = 'PortalSessionExpired';
  }
}

/** Linhas devolvidas pelas RPCs do portal (formato plano, vindo do banco). */
export interface PortalMaletaRow {
  id: string;
  nome: string;
  status: string;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  slug: string | null;
  observacoes: string | null;
}

export interface PortalMaletaPecaRow {
  id: string;
  quantidade: number;
  quantidade_vendida: number;
  vendida: boolean;
  preco_unitario: number | null;
  data_venda: string | null;
  peca_id: string;
  peca_nome: string;
  peca_codigo: string;
  peca_preco_venda: number | null;
  peca_imagem_url: string | null;
}

export interface PortalInteresseRow {
  id: string;
  maleta_id: string;
  cliente_nome: string;
  cliente_telefone: string | null;
  cliente_email: string | null;
  status: string;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PortalInteresseItemRow {
  id: string;
  quantidade: number;
  peca_id: string;
  peca_nome: string;
  peca_codigo: string;
  peca_preco_venda: number | null;
}

export interface PortalNotificacaoRow {
  id: string;
  cliente_nome: string;
  status: string;
  created_at: string;
  maleta_id: string;
  maleta_nome: string;
}

export function getPortalSession(): StoredSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Sessões do formato antigo (sem token) não são mais válidas.
    if (!parsed?.token || !parsed?.revendedora?.id) return null;
    return parsed as StoredSession;
  } catch {
    return null;
  }
}

export function setPortalSession(session: StoredSession) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearPortalSession() {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function getPortalToken(): string | null {
  return getPortalSession()?.token ?? null;
}

const isSessionError = (error: unknown): boolean => {
  const msg = (error as { message?: string } | null)?.message ?? '';
  return msg.includes('SESSAO_INVALIDA') || msg.includes('28000');
};

/**
 * Chama uma RPC do portal injetando o token da sessão.
 * Quando o token expira ou é inválido, limpa a sessão e lança
 * PortalSessionExpired para a tela voltar ao login.
 */
export async function portalRpc<T = unknown>(
  fn: string,
  params: Record<string, unknown> = {}
): Promise<T> {
  const token = getPortalToken();
  if (!token) {
    clearPortalSession();
    throw new PortalSessionExpired();
  }

  const { data, error } = await dbRpc(fn, { p_token: token, ...params });

  if (error) {
    if (isSessionError(error)) {
      clearPortalSession();
      throw new PortalSessionExpired();
    }
    throw error;
  }

  return data as T;
}

/** Login: devolve token + dados da revendedora, ou null se as credenciais não conferem. */
export async function portalLogin(
  email: string,
  senha: string
): Promise<StoredSession | null> {
  const { data, error } = await dbRpc('portal_login', {
    p_email: email.trim().toLowerCase(),
    p_senha: senha,
  });

  if (error) {
    if ((error.message ?? '').includes('MUITAS_TENTATIVAS')) {
      throw new Error('Muitas tentativas. Aguarde alguns minutos e tente de novo.');
    }
    throw error;
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.token) return null;

  const session: StoredSession = {
    token: row.token,
    revendedora: {
      id: row.id,
      nome: row.nome,
      email: row.email ?? undefined,
      telefone: row.telefone ?? undefined,
      comissao_percentual: Number(row.comissao_percentual) || 30,
    },
  };
  setPortalSession(session);
  return session;
}

export async function portalLogout() {
  const token = getPortalToken();
  clearPortalSession();
  if (token) {
    try {
      await dbRpc('session_close', { p_token: token });
    } catch {
      /* logout local já aconteceu; falha de rede aqui é irrelevante */
    }
  }
}
