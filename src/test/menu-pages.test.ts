import { describe, expect, it } from 'vitest';

const menuPages = [
  { route: '/', name: 'Dashboard', load: () => import('@/pages/DashboardPage') },
  { route: '/pecas', name: 'Peças', load: () => import('@/pages/PecasPage') },
  { route: '/etiquetas', name: 'Etiquetas', load: () => import('@/pages/EtiquetasPage') },
  { route: '/banhos', name: 'Banhos', load: () => import('@/pages/BanhosPage') },
  { route: '/pdv', name: 'Caixa / PDV', load: () => import('@/pages/PDVPage') },
  { route: '/catalogos', name: 'Catálogos', load: () => import('@/pages/CatalogosPage') },
  { route: '/clientes', name: 'Clientes', load: () => import('@/pages/ClientesPage') },
  { route: '/revendedoras', name: 'Revendedoras', load: () => import('@/pages/RevendedorasPage') },
  { route: '/fornecedores', name: 'Fornecedores', load: () => import('@/pages/FornecedoresPage') },
  { route: '/romaneios', name: 'Romaneios', load: () => import('@/pages/RomaneiosPage') },
  { route: '/relatorios', name: 'Relatórios', load: () => import('@/pages/RelatoriosPage') },
  { route: '/historico', name: 'Histórico', load: () => import('@/pages/HistoricoPage') },
  { route: '/configuracoes', name: 'Configurações', load: () => import('@/pages/ConfiguracoesPage') },
] as const;

const secondaryPages = [
  { route: '/revendedoras/desempenho', name: 'Desempenho Revendedoras', load: () => import('@/pages/DesempenhoRevendedorasPage') },
  { route: '/funcionarios', name: 'Funcionários', load: () => import('@/pages/FuncionariosPage') },
  { route: '/campanhas', name: 'Campanhas', load: () => import('@/pages/CampanhasPage') },
  { route: '/tutorial', name: 'Tutorial', load: () => import('@/pages/TutorialPage') },
  { route: '/crm', name: 'CRM', load: () => import('@/pages/CRMPage') },
  { route: '/fiado', name: 'Fiado', load: () => import('@/pages/FiadoPage') },
  { route: '/entregas', name: 'Entregas', load: () => import('@/pages/EntregasPage') },
  { route: '/fidelidade', name: 'Fidelidade', load: () => import('@/pages/FidelidadePage') },
  { route: '/historico-precos', name: 'Histórico de Preços', load: () => import('@/pages/HistoricoPrecosPage') },
  { route: '/pedidos-loja', name: 'Pedidos da Loja', load: () => import('@/pages/PedidosLojaPage') },
  { route: '/minha-assinatura', name: 'Minha Assinatura', load: () => import('@/pages/MinhaAssinaturaPage') },
  { route: '/meus-dados', name: 'Meus Dados', load: () => import('@/pages/MeusDadosPage') },
  { route: '/planos', name: 'Planos', load: () => import('@/pages/PlanosPage') },
  { route: '/atendimento', name: 'Atendimento IA', load: () => import('@/pages/AtendimentoPage') },
  { route: '/loja-virtual', name: 'Loja Virtual', load: () => import('@/pages/LojaVirtualPage') },
  { route: '/super-admin', name: 'Super Admin', load: () => import('@/pages/SuperAdminPage') },
  { route: '/observabilidade', name: 'Observabilidade', load: () => import('@/pages/ObservabilityPage') },
] as const;

const publicPages = [
  { route: '/loja-virtual', name: 'Editor da Loja Virtual', load: () => import('@/pages/LojaVirtualPage') },
  { route: '/loja/:slug', name: 'Loja Pública', load: () => import('@/pages/LojaPublicaPage') },
  { route: '/catalogo/:catalogoId', name: 'Catálogo Público', load: () => import('@/pages/CatalogoPublicoPage') },
  { route: '/maleta/:maletaId', name: 'Maleta Pública', load: () => import('@/pages/MaletaPublicaPage') },
  { route: '/portal/:revendedoraId', name: 'Portal da Revendedora', load: () => import('@/pages/PortalRevendedoraPage') },
  { route: '/landing', name: 'Landing', load: () => import('@/pages/LandingPage') },
  { route: '/planos', name: 'Planos Públicos', load: () => import('@/pages/PlanosPage') },
  { route: '/auth', name: 'Autenticação', load: () => import('@/pages/AuthPage') },
  { route: '/reset-password', name: 'Redefinição de Senha', load: () => import('@/pages/ResetPasswordPage') },
  { route: '/politica-privacidade', name: 'Política de Privacidade', load: () => import('@/pages/PoliticaPrivacidadePage') },
  { route: '/termos-de-uso', name: 'Termos de Uso', load: () => import('@/pages/TermosDeUsoPage') },
  { route: '/cookies', name: 'Cookies', load: () => import('@/pages/CookiesPage') },
] as const;

async function expectPagesToLoad(pages: readonly { route: string; name: string; load: () => Promise<{ default: unknown }> }[]) {
  for (const { load, name, route } of pages) {
    const page = await load();
    expect(page.default, `${name} (${route})`).toBeTypeOf('function');
  }
}

describe('telas do menu principal', () => {
  it('carrega cada tela na ordem do menu sem erro de módulo', async () => {
    await expectPagesToLoad(menuPages);
  }, 60_000);

  it('carrega as telas secundárias protegidas sem erro de módulo', async () => {
    await expectPagesToLoad(secondaryPages);
  }, 90_000);

  it('carrega as áreas públicas e e-commerce sem erro de módulo', async () => {
    await expectPagesToLoad(publicPages);
  }, 90_000);
});
