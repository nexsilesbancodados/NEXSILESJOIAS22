import type { ReactElement } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

/**
 * Teste de fluxo do portal da revendedora depois da migração para sessão por
 * token: renderiza a página de verdade, faz login, confere que as maletas
 * aparecem e que TODA chamada ao banco viajou com o token — nunca com o id da
 * revendedora, que era a credencial falsa de antes.
 */

const dbRpc = vi.fn();
vi.mock("@/lib/supabase-db", () => ({
  dbRpc: (...args: unknown[]) => dbRpc(...args),
  db: {},
  supabase: {},
}));

const navigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useParams: () => ({ revendedoraId: "login" }),
  useNavigate: () => navigate,
}));

vi.mock("@/hooks/usePortalPWA", () => ({
  usePortalPWA: () => ({
    canInstall: false, isInstalled: false, isOnline: true, installApp: vi.fn(),
  }),
}));

const REV = {
  token: "tok-abc",
  id: "rev-1",
  nome: "Maria",
  email: "maria@a.com",
  telefone: "11999",
  comissao_percentual: 30,
};

const MALETA = {
  id: "maleta-1",
  nome: "Maleta Verão",
  status: "aberta",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  is_public: true,
  slug: "slug-a",
  observacoes: null,
};

const PECA = {
  id: "item-1",
  quantidade: 3,
  quantidade_vendida: 1,
  vendida: false,
  preco_unitario: 100,
  data_venda: null,
  peca_id: "peca-1",
  peca_nome: "Anel Solitário",
  peca_codigo: "A001",
  peca_preco_venda: 100,
  peca_imagem_url: null,
};

function respostaPara(fn: string) {
  switch (fn) {
    case "portal_login": return { data: [REV], error: null };
    case "portal_fetch_maletas": return { data: [MALETA], error: null };
    case "portal_fetch_maleta_pecas": return { data: [PECA], error: null };
    case "portal_fetch_interesses": return { data: [], error: null };
    case "portal_fetch_notificacoes": return { data: [], error: null };
    default: return { data: null, error: null };
  }
}

beforeEach(() => {
  dbRpc.mockReset();
  dbRpc.mockImplementation((fn: string) => Promise.resolve(respostaPara(fn)));
  sessionStorage.clear();
  navigate.mockReset();
});

const renderPortal = async (): Promise<ReactElement> => {
  const Page = (await import("@/pages/PortalRevendedoraPage")).default;
  render(<Page />);
  return <Page />;
};

describe("portal da revendedora — fluxo completo", () => {
  it("mostra a tela de login quando não há sessão", async () => {
    await renderPortal();
    expect(await screen.findByText(/Portal da Revendedora/i)).toBeInTheDocument();
    expect(dbRpc).not.toHaveBeenCalled();
  });

  it("faz login, lista a maleta e usa sempre o token nas chamadas", async () => {
    await renderPortal();

    fireEvent.change(await screen.findByLabelText(/e-mail/i), { target: { value: "maria@a.com" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "segredo123" } });
    fireEvent.click(screen.getByRole("button", { name: /entrar no portal/i }));

    // a maleta aparece na tela
    expect((await screen.findAllByText("Maleta Verão")).length).toBeGreaterThan(0);
    // e a peça da maleta selecionada também
    expect((await screen.findAllByText("Anel Solitário")).length).toBeGreaterThan(0);

    const chamadas = dbRpc.mock.calls as [string, Record<string, unknown>][];

    // login recebeu e-mail/senha
    expect(chamadas[0][0]).toBe("portal_login");
    expect(chamadas[0][1]).toEqual({ p_email: "maria@a.com", p_senha: "segredo123" });

    // todas as demais viajaram com o token e NENHUMA com id de revendedora
    const depoisDoLogin = chamadas.slice(1);
    expect(depoisDoLogin.length).toBeGreaterThan(0);
    for (const [fn, params] of depoisDoLogin) {
      expect(params.p_token, `${fn} sem token`).toBe("tok-abc");
      expect(params).not.toHaveProperty("p_revendedora_id");
    }

    // e a sessão ficou guardada com o token (não com o id como credencial)
    expect(JSON.parse(sessionStorage.getItem("portal_session")!).token).toBe("tok-abc");
  });

  it("credencial errada não entra e não guarda sessão", async () => {
    dbRpc.mockImplementation((fn: string) =>
      Promise.resolve(fn === "portal_login" ? { data: [], error: null } : respostaPara(fn))
    );
    await renderPortal();

    fireEvent.change(await screen.findByLabelText(/e-mail/i), { target: { value: "maria@a.com" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "errada" } });
    fireEvent.click(screen.getByRole("button", { name: /entrar no portal/i }));

    await waitFor(() => expect(dbRpc).toHaveBeenCalledWith("portal_login", expect.anything()));
    expect(sessionStorage.getItem("portal_session")).toBeNull();
    expect(screen.getByLabelText("Senha")).toBeInTheDocument(); // continua no login
  });

  it("sessão restaurada do sessionStorage entra direto", async () => {
    sessionStorage.setItem("portal_session", JSON.stringify({
      token: "tok-abc",
      revendedora: { id: "rev-1", nome: "Maria", comissao_percentual: 30 },
    }));

    await renderPortal();

    expect((await screen.findAllByText("Maleta Verão")).length).toBeGreaterThan(0);
    expect(navigate).toHaveBeenCalledWith("/portal/rev-1", { replace: true });
  });

  it("token expirado no banco volta para o login", async () => {
    sessionStorage.setItem("portal_session", JSON.stringify({
      token: "tok-velho",
      revendedora: { id: "rev-1", nome: "Maria", comissao_percentual: 30 },
    }));
    dbRpc.mockImplementation(() =>
      Promise.resolve({ data: null, error: { message: "SESSAO_INVALIDA" } })
    );

    await renderPortal();

    await waitFor(() => expect(sessionStorage.getItem("portal_session")).toBeNull());
    expect(navigate).toHaveBeenCalledWith("/portal/login", { replace: true });
  });
});
