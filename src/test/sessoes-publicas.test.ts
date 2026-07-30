import { describe, it, expect, vi, beforeEach } from "vitest";

// dbRpc é o único ponto de contato com o banco nos helpers de sessão.
const dbRpc = vi.fn();
vi.mock("@/lib/supabase-db", () => ({
  dbRpc: (...args: unknown[]) => dbRpc(...args),
  db: {},
  supabase: {},
}));

import {
  PortalSessionExpired,
  clearPortalSession,
  getPortalSession,
  portalLogin,
  portalLogout,
  portalRpc,
  setPortalSession,
} from "@/lib/portal-session";
import {
  ClienteSessionExpired,
  clienteLogin,
  clienteRpc,
  getClienteSession,
} from "@/lib/cliente-session";
import { ajustarEstoque } from "@/lib/estoque";

const ORG = "org-1";

beforeEach(() => {
  dbRpc.mockReset();
  sessionStorage.clear();
  localStorage.clear();
});

describe("sessão do portal da revendedora", () => {
  it("login guarda o token e devolve os dados da revendedora", async () => {
    dbRpc.mockResolvedValue({
      data: [{
        token: "tok-123", id: "rev-1", nome: "Maria",
        email: "maria@x.com", telefone: "11999", comissao_percentual: 30,
      }],
      error: null,
    });

    const sessao = await portalLogin(" Maria@X.com ", "senha");

    expect(dbRpc).toHaveBeenCalledWith("portal_login", {
      p_email: "maria@x.com", // normaliza antes de enviar
      p_senha: "senha",
    });
    expect(sessao?.revendedora.id).toBe("rev-1");
    expect(getPortalSession()?.token).toBe("tok-123");
  });

  it("credencial inválida devolve null e não cria sessão", async () => {
    dbRpc.mockResolvedValue({ data: [], error: null });
    expect(await portalLogin("maria@x.com", "errada")).toBeNull();
    expect(getPortalSession()).toBeNull();
  });

  it("traduz o rate limit do banco em mensagem para a tela", async () => {
    dbRpc.mockResolvedValue({ data: null, error: { message: "MUITAS_TENTATIVAS" } });
    await expect(portalLogin("maria@x.com", "x")).rejects.toThrow(/Muitas tentativas/i);
  });

  it("toda chamada do portal viaja com o token da sessão", async () => {
    setPortalSession({
      token: "tok-123",
      revendedora: { id: "rev-1", nome: "Maria", comissao_percentual: 30 },
    });
    dbRpc.mockResolvedValue({ data: [{ id: "maleta-1" }], error: null });

    const maletas = await portalRpc("portal_fetch_maletas");

    expect(dbRpc).toHaveBeenCalledWith("portal_fetch_maletas", { p_token: "tok-123" });
    expect(maletas).toEqual([{ id: "maleta-1" }]);
  });

  it("sem sessão não chega a chamar o banco", async () => {
    await expect(portalRpc("portal_fetch_maletas")).rejects.toBeInstanceOf(PortalSessionExpired);
    expect(dbRpc).not.toHaveBeenCalled();
  });

  it("token expirado no banco limpa a sessão local", async () => {
    setPortalSession({
      token: "tok-velho",
      revendedora: { id: "rev-1", nome: "Maria", comissao_percentual: 30 },
    });
    dbRpc.mockResolvedValue({ data: null, error: { message: "SESSAO_INVALIDA" } });

    await expect(portalRpc("portal_fetch_maletas")).rejects.toBeInstanceOf(PortalSessionExpired);
    expect(getPortalSession()).toBeNull();
  });

  it("sessão do formato antigo (sem token) é descartada", () => {
    // Antes da correção o portal guardava só { revendedora: {...} } e usava o id
    // como credencial. Um payload assim não pode mais ser aceito.
    sessionStorage.setItem("portal_session", JSON.stringify({ revendedora: { id: "rev-1" } }));
    expect(getPortalSession()).toBeNull();
  });

  it("logout encerra a sessão no banco e localmente", async () => {
    setPortalSession({
      token: "tok-123",
      revendedora: { id: "rev-1", nome: "Maria", comissao_percentual: 30 },
    });
    dbRpc.mockResolvedValue({ data: null, error: null });

    await portalLogout();

    expect(dbRpc).toHaveBeenCalledWith("session_close", { p_token: "tok-123" });
    expect(getPortalSession()).toBeNull();
  });

  it("erro comum do banco é repassado sem derrubar a sessão", async () => {
    setPortalSession({
      token: "tok-123",
      revendedora: { id: "rev-1", nome: "Maria", comissao_percentual: 30 },
    });
    dbRpc.mockResolvedValue({ data: null, error: { message: "deu ruim" } });

    await expect(portalRpc("portal_fetch_maletas")).rejects.toMatchObject({ message: "deu ruim" });
    expect(getPortalSession()?.token).toBe("tok-123");
  });

  it("clearPortalSession remove o token", () => {
    setPortalSession({
      token: "tok-123",
      revendedora: { id: "rev-1", nome: "Maria", comissao_percentual: 30 },
    });
    clearPortalSession();
    expect(getPortalSession()).toBeNull();
  });
});

describe("sessão do cliente da loja", () => {
  it("login guarda a sessão por organização", async () => {
    dbRpc.mockResolvedValue({
      data: [{ token: "tok-cli", cliente_id: "cli-1", cliente_nome: "Ana", cliente_email: "ana@x.com" }],
      error: null,
    });

    const s = await clienteLogin(ORG, "Ana@X.com", "loja123");

    expect(dbRpc).toHaveBeenCalledWith("cliente_login", {
      p_email: "ana@x.com",
      p_senha: "loja123",
      p_organization_id: ORG,
    });
    expect(s?.cliente.nome).toBe("Ana");
    expect(getClienteSession(ORG)?.token).toBe("tok-cli");
    expect(getClienteSession("outra-org")).toBeNull();
  });

  it("pedidos são buscados pelo token, nunca pelo e-mail", async () => {
    dbRpc.mockResolvedValueOnce({
      data: [{ token: "tok-cli", cliente_id: "cli-1", cliente_nome: "Ana", cliente_email: "ana@x.com" }],
      error: null,
    });
    await clienteLogin(ORG, "ana@x.com", "loja123");

    dbRpc.mockResolvedValueOnce({ data: [{ id: "ped-1" }], error: null });
    await clienteRpc(ORG, "cliente_fetch_pedidos");

    expect(dbRpc).toHaveBeenLastCalledWith("cliente_fetch_pedidos", { p_token: "tok-cli" });
  });

  it("sessão antiga (só e-mail) é descartada", () => {
    localStorage.setItem(`cliente_session_${ORG}`, JSON.stringify({ id: "cli-1", email: "ana@x.com" }));
    expect(getClienteSession(ORG)).toBeNull();
  });

  it("sem sessão, a área de pedidos não consulta o banco", async () => {
    await expect(clienteRpc(ORG, "cliente_fetch_pedidos")).rejects.toBeInstanceOf(ClienteSessionExpired);
    expect(dbRpc).not.toHaveBeenCalled();
  });
});

describe("estoque atômico", () => {
  it("delega a soma para o banco em vez de calcular no cliente", async () => {
    dbRpc.mockResolvedValue({ data: 7, error: null });

    const novo = await ajustarEstoque("peca-1", -3);

    expect(dbRpc).toHaveBeenCalledWith("ajustar_estoque_peca", {
      p_peca_id: "peca-1",
      p_delta: -3,
    });
    expect(novo).toBe(7);
  });

  it("delta zero não gera chamada", async () => {
    expect(await ajustarEstoque("peca-1", 0)).toBeNull();
    expect(dbRpc).not.toHaveBeenCalled();
  });

  it("propaga erro para o chamador tratar", async () => {
    dbRpc.mockResolvedValue({ data: null, error: { message: "sem permissão" } });
    await expect(ajustarEstoque("peca-1", -1)).rejects.toMatchObject({ message: "sem permissão" });
  });
});
