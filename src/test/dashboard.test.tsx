import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock all heavy dependencies
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "test-user" },
    profile: { nome: "Test User" },
    isAdmin: true,
  }),
}));

vi.mock("@/hooks/useSupabaseData", () => ({
  usePecas: () => ({ data: [{ id: "1", nome: "Anel", codigo: "A001", preco_venda: 100, estoque: 10, categoria: "Aneis" }], isLoading: false }),
  useVendas: () => ({ data: [{ id: "v1", valor_total: 250, created_at: new Date().toISOString() }], isLoading: false }),
  useRevendedoras: () => ({ data: [{ id: "r1", nome: "Maria", ativo: true }], isLoading: false }),
  useRomaneios: () => ({ data: [], isLoading: false }),
  useCaixaAtual: () => ({ data: null, isLoading: false }),
}));

vi.mock("@/hooks/useTourManager", () => ({
  useTourManager: () => ({ showTour: false, endTour: vi.fn(), startTour: vi.fn() }),
  DASHBOARD_TOUR_STEPS: [],
}));

vi.mock("@/components/onboarding/SetupWizard", () => ({
  SetupWizard: () => null,
  useSetupWizard: () => ({ showWizard: false, setShowWizard: vi.fn(), isLoading: false }),
}));

vi.mock("@/hooks/useRealtimeOrders", () => ({
  useRealtimeOrders: () => {},
}));

vi.mock("@/components/dashboard/MetaProgress", () => ({
  MetaProgress: () => <div data-testid="meta-progress" />,
}));

vi.mock("@/components/dashboard/AniversariantesCard", () => ({
  AniversariantesCard: () => <div data-testid="aniversariantes" />,
}));

vi.mock("@/components/dashboard/PedidosPendentesCard", () => ({
  PedidosPendentesCard: () => <div data-testid="pedidos-pendentes" />,
}));

vi.mock("@/components/dashboard/DashboardCharts", () => ({
  DashboardCharts: () => <div data-testid="charts" />,
}));

vi.mock("@/components/dashboard/InsightsCard", () => ({
  InsightsCard: () => <div data-testid="insights" />,
}));

vi.mock("@/components/dashboard/TopVendedorasCard", () => ({
  TopVendedorasCard: () => <div data-testid="top-vendedoras" />,
}));

vi.mock("@/components/dashboard/RecentActivityCard", () => ({
  RecentActivityCard: () => <div data-testid="recent-activity" />,
}));

vi.mock("react-router-dom", () => ({
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));

describe("DashboardPage", () => {
  it("renders stat cards with correct data", async () => {
    const DashboardPage = (await import("@/pages/DashboardPage")).default;
    render(<DashboardPage />);

    expect(screen.getByText("Vendas Hoje")).toBeInTheDocument();
    expect(screen.getByText("Total Vendas")).toBeInTheDocument();
    expect(screen.getByText("Peças Estoque")).toBeInTheDocument();
    expect(screen.getAllByText("Revendedoras").length).toBeGreaterThanOrEqual(1);
  });

  it("renders quick action buttons", async () => {
    const DashboardPage = (await import("@/pages/DashboardPage")).default;
    render(<DashboardPage />);

    expect(screen.getByText("Peças")).toBeInTheDocument();
    expect(screen.getByText("PDV")).toBeInTheDocument();
    expect(screen.getAllByText("Revendedoras").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Relatórios")).toBeInTheDocument();
  });

  it("shows 'Abrir Caixa' when no active session", async () => {
    const DashboardPage = (await import("@/pages/DashboardPage")).default;
    render(<DashboardPage />);

    expect(screen.getAllByText("Abrir Caixa").length).toBeGreaterThanOrEqual(1);
  });

  it("renders greeting based on time of day", async () => {
    const DashboardPage = (await import("@/pages/DashboardPage")).default;
    render(<DashboardPage />);

    const hour = new Date().getHours();
    const expectedGreeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
    expect(screen.getByText(new RegExp(expectedGreeting))).toBeInTheDocument();
  });
});
