import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { lazy, ReactNode, Suspense } from "react";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { Footer } from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { isCanvaOnlyMode, isRestrictedToCoreViews } from "@/lib/accessPolicy";
import { getUserFromToken } from "@/services/authService";
import AgentMonitoringPage from "@/pages/AgentMonitoringPage";
import ProfilePage from "@/pages/Profile";

const queryClient = new QueryClient();

// Rotas principais carregadas sob demanda para a primeira abertura ficar mais leve.
// Bloco de rotas lazy (carrega telas apenas quando precisa).
const LazyIndex = lazy(() => import("./pages/Index"));
const LazyLogin = lazy(() => import("./pages/Login"));
const LazyNotFound = lazy(() => import("./pages/NotFound"));
const LazyCanvaDashboard = lazy(() => import("@/components/canva/CanvaDashboard"));
const LazyVoucherDashboard = lazy(
  () => import("@/components/vouchers/VoucherDashboard")
);
const LazyVoucher2026Dashboard = lazy(
  () => import("@/components/vouchers/Voucher2026Dashboard")
);
const LazyInsightsAnalytics = lazy(
  () => import("@/components/insights/InsightsAnalytics")
);
const LazyMonitoringPortal = lazy(
  () => import("@/components/monitoring/MonitoringPortal")
);
const LazyTicketsPage = lazy(() => import("@/pages/TicketsPage"));
const LazyAdminPage = lazy(() => import("@/pages/AdminPage"));
const LazyKnowledgeBasePage = lazy(() => import("@/pages/KnowledgeBasePage"));
const LazyAssetsPage = lazy(() => import("@/pages/AssetsPage"));
const LazyAssetDetailPage = lazy(() => import("@/pages/AssetDetailPage"));
const LazyAssetSchoolPage = lazy(() => import("@/pages/AssetSchoolPage"));
const LazyAccessControl = lazy(() => import("@/components/auth/AccessControl"));

// ====== Layout protegido: cabecalho, rota filha e rodape ======
const ProtectedShell = () => (
  <ProtectedRoute>
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      {/* Espaamento menor de margem para o rodape nao colar no fim da tela */}
      <main className="flex-1 w-full pb-20 md:pb-28">
        <Outlet />
      </main>
      <Footer />
    </div>
  </ProtectedRoute>
);

const App = () => {
  const currentUserRole = getUserFromToken()?.role;
  const canvaOnlyMode = isCanvaOnlyMode(currentUserRole);
  const restrictToCoreViews = isRestrictedToCoreViews(currentUserRole);

  // Regras de acesso por perfil:
  // Se estiver no modo restrito, manda as rotas extras para o fluxo principal do Canva.
  const renderRestrictedRoute = (element: ReactNode) =>
    restrictToCoreViews ? <Navigate to="/dashboard/canva" replace /> : element;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<Skeleton className="h-screen w-full" />}>
            <Routes>
              <Route path="/login" element={<LazyLogin />} />
              {/* Bloco protegido: sÃ³ entra aqui apÃ³s autenticaÃ§Ã£o */}
              <Route element={<ProtectedShell />}>
                <Route
                  path="/dashboard"
                  element={
                    canvaOnlyMode ? (
                      <Navigate to="/dashboard/canva" replace />
                    ) : (
                      <LazyIndex />
                    )
                  }
                />
                <Route path="/dashboard/canva" element={<LazyCanvaDashboard />} />
                <Route
                  path="/dashboard/canva/escolas"
                  element={<LazyCanvaDashboard />}
                />
                <Route
                  path="/dashboard/canva/usos"
                  element={<LazyCanvaDashboard />}
                />
                <Route
                  path="/dashboard/canva/modelos"
                  element={<LazyCanvaDashboard />}
                />
                <Route
                  path="/dashboard/canva/criadores"
                  element={<LazyCanvaDashboard />}
                />
                <Route
                  path="/dashboard/canva/usos/escolas"
                  element={<LazyCanvaDashboard />}
                />
                <Route
                  path="/dashboard/canva/custos"
                  element={<LazyCanvaDashboard />}
                />
                <Route
                  path="/dashboard/vouchers"
                  element={renderRestrictedRoute(<LazyVoucherDashboard />)}
                />
                <Route
                  path="/dashboard/vouchers-2026"
                  element={renderRestrictedRoute(<LazyVoucher2026Dashboard />)}
                />
                <Route
                  path="/insights"
                  element={renderRestrictedRoute(<LazyInsightsAnalytics />)}
                />
                <Route
                  path="/monitoring"
                  element={renderRestrictedRoute(<LazyMonitoringPortal />)}
                />
                <Route
                  path="/tickets"
                  element={renderRestrictedRoute(<LazyTicketsPage />)}
                />
                <Route
                  path="/admin"
                  element={renderRestrictedRoute(<LazyAdminPage />)}
                />
                <Route path="/profile" element={<ProfilePage />} />
                <Route
                  path="/monitoria-agentes"
                  element={renderRestrictedRoute(<AgentMonitoringPage />)}
                />
                <Route
                  path="/knowledge-base"
                  element={renderRestrictedRoute(<LazyKnowledgeBasePage />)}
                />
                <Route
                  path="/saf/ativos"
                  element={renderRestrictedRoute(<LazyAssetsPage />)}
                />
                <Route
                  path="/dashboard/ativos"
                  element={renderRestrictedRoute(
                    <Navigate to="/saf/ativos" replace />
                  )}
                />
                <Route
                  path="/saf/ativos/:assetId"
                  element={renderRestrictedRoute(<LazyAssetDetailPage />)}
                />
                <Route
                  path="/saf/ativos/:assetId/escola/:schoolId"
                  element={renderRestrictedRoute(<LazyAssetSchoolPage />)}
                />
                <Route
                  path="/access-control"
                  element={renderRestrictedRoute(<LazyAccessControl />)}
                />
              </Route>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              {/* Mantenha as rotas novas acima do catch-all "*" */}
              <Route path="*" element={<LazyNotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

