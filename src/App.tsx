import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useParams, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MainLayout } from "@/components/layout/MainLayout";
import { useRealtimeOrders } from "@/hooks/useRealtimeOrders";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { QueryErrorHandler } from "@/components/QueryErrorHandler";
import { ReadOnlyBanner } from "@/components/subscription/ReadOnlyBanner";
import { OrganizationGuard } from "@/components/OrganizationGuard";
import { SubscriptionGuard } from "@/components/subscription/SubscriptionGuard";
import { supabase } from "@/integrations/supabase/client";
import { useActivateSubscription } from "@/hooks/useActivateSubscription";

// Lazy load all pages for code-splitting
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const PecasPage = lazy(() => import("./pages/PecasPage"));
const PDVPage = lazy(() => import("./pages/PDVPage"));
const CatalogosPage = lazy(() => import("./pages/CatalogosPage"));
const CatalogoPublicoPage = lazy(() => import("./pages/CatalogoPublicoPage"));
const MaletaPublicaPage = lazy(() => import("./pages/MaletaPublicaPage"));
const RevendedorasPage = lazy(() => import("./pages/RevendedorasPage"));
const RomaneiosPage = lazy(() => import("./pages/RomaneiosPage"));
const RelatoriosPage = lazy(() => import("./pages/RelatoriosPage"));
const HistoricoPage = lazy(() => import("./pages/HistoricoPage"));
const ConfiguracoesPage = lazy(() => import("./pages/ConfiguracoesPage"));
const PortalRevendedoraPage = lazy(() => import("./pages/PortalRevendedoraPage"));
const ClientesPage = lazy(() => import("./pages/ClientesPage"));
const EtiquetasPage = lazy(() => import("./pages/EtiquetasPage"));
const BanhosPage = lazy(() => import("./pages/BanhosPage"));
const FornecedoresPage = lazy(() => import("./pages/FornecedoresPage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const FuncionariosPage = lazy(() => import("./pages/FuncionariosPage"));
const DesempenhoRevendedorasPage = lazy(() => import("./pages/DesempenhoRevendedorasPage"));
const CampanhasPage = lazy(() => import("./pages/CampanhasPage"));
const PlanosPage = lazy(() => import("./pages/PlanosPage"));
const LandingPlanosPage = lazy(() => import("./pages/LandingPlanosPage"));
const LandingPage = lazy(() => import("./pages/LandingPage"));

const AtendimentoPage = lazy(() => import("./pages/AtendimentoPage"));
const TutorialPage = lazy(() => import("./pages/TutorialPage"));
const SuperAdminPage = lazy(() => import("./pages/SuperAdminPage"));
const FiadoPage = lazy(() => import("./pages/FiadoPage"));
const EntregasPage = lazy(() => import("./pages/EntregasPage"));
const FidelidadePage = lazy(() => import("./pages/FidelidadePage"));
const HistoricoPrecosPage = lazy(() => import("./pages/HistoricoPrecosPage"));
const LojaPublicaPage = lazy(() => import("./pages/LojaPublicaPage"));
const PedidosLojaPage = lazy(() => import("./pages/PedidosLojaPage"));
const LojaVirtualPage = lazy(() => import("./pages/LojaVirtualPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PoliticaPrivacidadePage = lazy(() => import("./pages/PoliticaPrivacidadePage"));
const TermosDeUsoPage = lazy(() => import("./pages/TermosDeUsoPage"));

// Detecta subdomínio loja.* e serve a loja pública
function LojaSubdomainRedirect() {
  const { slug } = useParams();
  const isLojaSubdomain = typeof window !== 'undefined' && window.location.hostname.startsWith('loja.');
  if (isLojaSubdomain && slug) {
    return <Navigate to={`/loja/${slug}`} replace />;
  }
  return <Navigate to="/" replace />;
}

// Wrapper que detecta subdomínio loja.* na raiz — mostra 404 se sem slug
function LojaRootRedirect() {
  return null;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10, // 10 minutes - data stays fresh longer
      gcTime: 1000 * 60 * 60, // 60 minutes - longer cache retention
      refetchOnWindowFocus: false, // Prevent refetch on tab focus
      refetchOnReconnect: false, // Prevent refetch on reconnect
      retry: 1, // Only retry once on failure
      networkMode: 'offlineFirst', // Use cache first for faster initial load
    },
    mutations: {
      networkMode: 'offlineFirst',
    },
  },
});

// Lightweight loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

function RealtimeNotifications() {
  useRealtimeOrders();
  return null;
}

function SubscriptionActivator() {
  useActivateSubscription();
  return null;
}

// Prefetch critical data after initial load for faster navigation
function CriticalDataPrefetcher() {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    // Delay prefetching to not block initial render
    const timer = setTimeout(async () => {
      // Prefetch pecas - most commonly used data
      queryClient.prefetchQuery({
        queryKey: ['pecas', { includeCatalogOnly: false }],
        queryFn: async () => {
          const { data } = await supabase
            .from('pecas')
            .select('id, nome, codigo, preco_venda, preco_revenda, estoque, categoria, imagem_url, ativo')
            .or('catalogo_only.is.null,catalogo_only.eq.false')
            .order('nome');
          return data;
        },
        staleTime: 1000 * 60 * 10,
      });
      
      // Prefetch revendedoras
      queryClient.prefetchQuery({
        queryKey: ['revendedoras'],
        queryFn: async () => {
          const { data } = await supabase
            .from('revendedoras')
            .select('id, nome, telefone, email, ativo, comissao_percentual')
            .order('nome');
          return data;
        },
        staleTime: 1000 * 60 * 10,
      });
    }, 500);
    
    return () => clearTimeout(timer);
  }, [queryClient]);
  
  return null;
}

function AppRoutes() {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isLojaSubdomain = hostname.startsWith('loja.');
  const isCatalogoSubdomain = hostname.startsWith('catalogo.');
  const isPortalSubdomain = hostname.startsWith('portal.');
  const isMaletaSubdomain = hostname.startsWith('maleta.');
  
  // Subdomínio loja.* → renderiza loja pública
  if (isLojaSubdomain) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/:slug" element={<LojaPublicaPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    );
  }

  // Subdomínio catalogo.* → renderiza catálogo público
  if (isCatalogoSubdomain) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/:catalogoId" element={<CatalogoPublicoPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    );
  }

  // Subdomínio portal.* → renderiza portal da revendedora
  if (isPortalSubdomain) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<PortalRevendedoraPage />} />
          <Route path="/:revendedoraId" element={<PortalRevendedoraPage />} />
          <Route path="*" element={<PortalRevendedoraPage />} />
        </Routes>
      </Suspense>
    );
  }

  // Subdomínio maleta.* → renderiza vitrine pública da maleta
  if (isMaletaSubdomain) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/:maletaId" element={<MaletaPublicaPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Landing Page - Public */}
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/politica-privacidade" element={<PoliticaPrivacidadePage />} />
        <Route path="/termos-de-uso" element={<TermosDeUsoPage />} />
        
        {/* Auth pages - Public */}
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Catálogo Público - Public page */}
        <Route path="/catalogo/:catalogoId" element={<CatalogoPublicoPage />} />
        
        {/* Loja Pública - E-commerce */}
        <Route path="/loja/:slug" element={<LojaPublicaPage />} />
        {/* Loja via subdomínio dedicado - removido /:slug pois conflita com rotas internas */}
        
        {/* Maleta Pública - Public page for reseller customers */}
        <Route path="/maleta/:maletaId" element={<MaletaPublicaPage />} />
        
        {/* Portal da Revendedora - Public page without MainLayout */}
        <Route path="/portal" element={<PortalRevendedoraPage />} />
        <Route path="/portal/login" element={<PortalRevendedoraPage />} />
        <Route path="/portal/:revendedoraId" element={<PortalRevendedoraPage />} />
        
        {/* Atendimento IA - Standalone app (no MainLayout) */}
        <Route
          path="/atendimento"
          element={
            <ProtectedRoute>
              <OrganizationGuard>
                <SubscriptionActivator />
                <SubscriptionProvider>
                  <Suspense fallback={<PageLoader />}>
                    <AtendimentoPage />
                  </Suspense>
                </SubscriptionProvider>
              </OrganizationGuard>
            </ProtectedRoute>
          }
        />

        {/* Loja Virtual - Standalone app (no MainLayout) */}
        <Route
          path="/loja-virtual"
          element={
            <ProtectedRoute>
              <OrganizationGuard>
                <SubscriptionActivator />
                <SubscriptionProvider>
                  <Suspense fallback={<PageLoader />}>
                    <LojaVirtualPage />
                  </Suspense>
                </SubscriptionProvider>
              </OrganizationGuard>
            </ProtectedRoute>
          }
        />

        {/* Admin pages with MainLayout - Protected */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <OrganizationGuard>
              <SubscriptionActivator />
                <SubscriptionProvider>
                  <RealtimeNotifications />
                  <CriticalDataPrefetcher />
                  <ReadOnlyBanner />
                  <MainLayout>
                  <SubscriptionGuard>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<DashboardPage />} />
                      <Route path="/pecas" element={<PecasPage />} />
                      <Route path="/etiquetas" element={<EtiquetasPage />} />
                      <Route path="/banhos" element={<BanhosPage />} />
                      <Route path="/pdv" element={<PDVPage />} />
                      <Route path="/catalogos" element={<CatalogosPage />} />
                      <Route path="/revendedoras" element={<RevendedorasPage />} />
                      <Route path="/revendedoras/desempenho" element={<DesempenhoRevendedorasPage />} />
                      <Route path="/fornecedores" element={<FornecedoresPage />} />
                      <Route path="/romaneios" element={<RomaneiosPage />} />
                      <Route path="/relatorios" element={<RelatoriosPage />} />
                      <Route path="/historico" element={<HistoricoPage />} />
                      <Route path="/clientes" element={<ClientesPage />} />
                      <Route path="/configuracoes" element={<ConfiguracoesPage />} />
                      <Route path="/funcionarios" element={<FuncionariosPage />} />
                      <Route path="/campanhas" element={<CampanhasPage />} />
                      <Route path="/planos" element={<PlanosPage />} />
                      <Route path="/tutorial" element={<TutorialPage />} />
                      <Route path="/super-admin" element={<SuperAdminPage />} />
                      <Route path="/fiado" element={<FiadoPage />} />
                      <Route path="/entregas" element={<EntregasPage />} />
                      <Route path="/fidelidade" element={<FidelidadePage />} />
                      <Route path="/historico-precos" element={<HistoricoPrecosPage />} />
                      <Route path="/pedidos-loja" element={<PedidosLojaPage />} />
                      {/* Loja Virtual moved to standalone route above */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                  </SubscriptionGuard>
                  </MainLayout>
                </SubscriptionProvider>
              </OrganizationGuard>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            <QueryErrorHandler />
            <Toaster />
            <Sonner />
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <AuthProvider>
                <AppRoutes />
              </AuthProvider>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
