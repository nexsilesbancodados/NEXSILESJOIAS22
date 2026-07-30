/**
 * Sessão do cliente da loja virtual.
 *
 * Mesmo desenho do portal da revendedora: o banco valida a senha (bcrypt em
 * clientes.senha) e devolve um token opaco (public_sessions). As RPCs de
 * pedidos recebem o token e derivam o cliente dele.
 *
 * Antes, `fetch_cliente_pedidos(email, org)` devolvia o histórico de compras de
 * qualquer pessoa a quem se soubesse o e-mail, e `fetch_cliente_pedido_itens`
 * aceitava qualquer id de pedido sem checar dono.
 */
import { dbRpc } from '@/lib/supabase-db';

export interface ClienteSession {
  id: string;
  nome: string;
  email: string;
}

interface StoredSession {
  token: string;
  cliente: ClienteSession;
}

export class ClienteSessionExpired extends Error {
  constructor() {
    super('Sessão expirada');
    this.name = 'ClienteSessionExpired';
  }
}

const key = (organizationId: string) => `cliente_session_${organizationId}`;

export function getClienteSession(organizationId: string): StoredSession | null {
  try {
    const raw = localStorage.getItem(key(organizationId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Sessões do formato antigo (só e-mail, sem token) não valem mais.
    if (!parsed?.token || !parsed?.cliente?.id) return null;
    return parsed as StoredSession;
  } catch {
    return null;
  }
}

export function setClienteSession(organizationId: string, session: StoredSession) {
  localStorage.setItem(key(organizationId), JSON.stringify(session));
}

export function clearClienteSession(organizationId: string) {
  localStorage.removeItem(key(organizationId));
}

const isSessionError = (error: unknown): boolean => {
  const msg = (error as { message?: string } | null)?.message ?? '';
  return msg.includes('SESSAO_INVALIDA') || msg.includes('28000');
};

export async function clienteRpc<T = unknown>(
  organizationId: string,
  fn: string,
  params: Record<string, unknown> = {}
): Promise<T> {
  const token = getClienteSession(organizationId)?.token;
  if (!token) {
    clearClienteSession(organizationId);
    throw new ClienteSessionExpired();
  }

  const { data, error } = await dbRpc(fn, { p_token: token, ...params });

  if (error) {
    if (isSessionError(error)) {
      clearClienteSession(organizationId);
      throw new ClienteSessionExpired();
    }
    throw error;
  }

  return data as T;
}

export async function clienteLogin(
  organizationId: string,
  email: string,
  senha: string
): Promise<StoredSession | null> {
  const { data, error } = await dbRpc('cliente_login', {
    p_email: email.trim().toLowerCase(),
    p_senha: senha,
    p_organization_id: organizationId,
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
    cliente: { id: row.cliente_id, nome: row.cliente_nome, email: row.cliente_email },
  };
  setClienteSession(organizationId, session);
  return session;
}

export async function clienteRegistrar(
  organizationId: string,
  dados: { nome: string; email: string; senha: string; telefone?: string | null }
): Promise<StoredSession> {
  const { data, error } = await dbRpc('cliente_registrar_com_sessao', {
    p_nome: dados.nome,
    p_email: dados.email,
    p_senha: dados.senha,
    p_telefone: dados.telefone || null,
    p_organization_id: organizationId,
  });

  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : data;
  const session: StoredSession = {
    token: row.token,
    cliente: {
      id: row.cliente_id,
      nome: dados.nome,
      email: dados.email.trim().toLowerCase(),
    },
  };
  setClienteSession(organizationId, session);
  return session;
}

export async function clienteLogout(organizationId: string) {
  const token = getClienteSession(organizationId)?.token;
  clearClienteSession(organizationId);
  if (token) {
    try {
      await dbRpc('session_close', { p_token: token });
    } catch {
      /* logout local já feito */
    }
  }
}
