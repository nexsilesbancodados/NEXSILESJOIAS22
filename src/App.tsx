import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MainLayout } from "@/components/layout/MainLayout";
import { useRealtimeOrders } from "@/hooks/useRealtimeOrders";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { QueryErrorHandler } from "@/components/QueryErrorHandler";

// Lazy load all pages for code-splitting
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const PecasPage = lazy(() => import("./pages/PecasPage"));
const PDVPage = lazy(() => import("./pages/PDVPage"));
const CatalogosPage = lazy(() => import("./pages/CatalogosPage"));
const CatalogoPublicoPage = lazy(() => import("./pages/CatalogoPublicoPage"));
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
const FuncionariosPage = lazy(() => import("./pages/FuncionariosPage"));
const DesempenhoRevendedorasPage = lazy(() => import("./pages/DesempenhoRevendedorasPage"));
const CampanhasPage = lazy(() => import("./pages/CampanhasPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - data stays fresh
      gcTime: 1000 * 60 * 30, // 30 minutes - cache retention
      refetchOnWindowFocus: false, // Prevent refetch on tab focus
      refetchOnReconnect: false, // Prevent refetch on reconnect
      retry: 1, // Only retry once on failure
    },
  },
});

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

function RealtimeNotifications() {
  useRealtimeOrders();
  return null;
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Auth page - Public */}
        <Route path="/auth" element={<AuthPage />} />
        
        {/* Catálogo Público - Public page */}
        <Route path="/catalogo/:catalogoId" element={<CatalogoPublicoPage />} />
        
        {/* Portal da Revendedora - Public page without MainLayout */}
        <Route path="/portal/:revendedoraId" element={<PortalRevendedoraPage />} />
        
        {/* Admin pages with MainLayout - Protected */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <RealtimeNotifications />
              <MainLayout>
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
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </MainLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <QueryErrorHandler />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <AppRoutes />
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
