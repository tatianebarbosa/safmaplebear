import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { lazy, ReactNode, Suspense } from "react";
import Header from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { useAuthStore } from "@/stores/authStore";
import { isCanvaOnlyMode, isRestrictedToCoreViews } from "@/lib/accessPolicy";

const queryClient = new QueryClient();

// Carregamento preguiçoso das páginas para deixar a navegação mais leve
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AccessControl = lazy(() => import("@/components/auth/AccessControl"));
const CanvaDashboard = lazy(() => import("@/components/canva/CanvaDashboard"));
const VoucherDashboard = lazy(
  () => import("@/components/vouchers/VoucherDashboard")
);
const Voucher2026Dashboard = lazy(
  () => import("@/components/vouchers/Voucher2026Dashboard")
);
const InsightsAnalytics = lazy(
  () => import("@/components/insights/InsightsAnalytics")
);
const MonitoringPortal = lazy(
  () => import("@/components/monitoring/MonitoringPortal")
);
const TicketsPage = lazy(() => import("@/pages/TicketsPage"));
const AdminPage = lazy(() => import("@/pages/AdminPage"));
const KnowledgeBasePage = lazy(() => import("@/pages/KnowledgeBasePage"));
const AssetsPage = lazy(() => import("@/pages/AssetsPage"));
const AssetDetailPage = lazy(() => import("@/pages/AssetDetailPage"));
const AssetSchoolPage = lazy(() => import("@/pages/AssetSchoolPage"));
import ProfilePage from "@/pages/Profile";
import AgentMonitoringPage from "@/pages/AgentMonitoringPage";

const ProtectedShell = () => (
  <ProtectedRoute>
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      {/* AQUI: mais espaço entre conteúdo e rodapé para todas as páginas */}
      <main className="flex-1 w-full pb-20 md:pb-28">
        <Outlet />
      </main>

      <Footer />
    </div>
  </ProtectedRoute>
);

const App = () => {
  const currentUserRole = useAuthStore((state) => state.currentUser?.role);
  const canvaOnlyMode = isCanvaOnlyMode(currentUserRole);
  const restrictToCoreViews = isRestrictedToCoreViews(currentUserRole);

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
              <Route path="/login" element={<Login />} />
              <Route element={<ProtectedShell />}>
                <Route
                  path="/dashboard"
                  element={canvaOnlyMode ? <Navigate to="/dashboard/canva" replace /> : <Index />}
                />
                <Route path="/dashboard/canva" element={<CanvaDashboard />} />
                <Route path="/dashboard/canva/escolas" element={<CanvaDashboard />} />
                <Route path="/dashboard/canva/usos" element={<CanvaDashboard />} />
                <Route path="/dashboard/canva/modelos" element={<CanvaDashboard />} />
                <Route path="/dashboard/canva/criadores" element={<CanvaDashboard />} />
                <Route path="/dashboard/canva/usos/escolas" element={<CanvaDashboard />} />
                <Route path="/dashboard/canva/custos" element={<CanvaDashboard />} />
                <Route
                  path="/dashboard/vouchers"
                  element={renderRestrictedRoute(<VoucherDashboard />)}
                />
                <Route
                  path="/dashboard/vouchers-2026"
                  element={renderRestrictedRoute(<Voucher2026Dashboard />)}
                />
                <Route
                  path="/insights"
                  element={renderRestrictedRoute(<InsightsAnalytics />)}
                />
                <Route
                  path="/monitoring"
                  element={renderRestrictedRoute(<MonitoringPortal />)}
                />
                <Route
                  path="/tickets"
                  element={renderRestrictedRoute(<TicketsPage />)}
                />
                <Route
                  path="/admin"
                  element={renderRestrictedRoute(<AdminPage />)}
                />
                <Route path="/profile" element={<ProfilePage />} />
                <Route
                  path="/monitoria-agentes"
                  element={renderRestrictedRoute(<AgentMonitoringPage />)}
                />
                <Route
                  path="/knowledge-base"
                  element={renderRestrictedRoute(<KnowledgeBasePage />)}
                />
                <Route
                  path="/saf/ativos"
                  element={renderRestrictedRoute(<AssetsPage />)}
                />
                <Route
                  path="/dashboard/ativos"
                  element={renderRestrictedRoute(<Navigate to="/saf/ativos" replace />)}
                />
                <Route
                  path="/saf/ativos/:assetId"
                  element={renderRestrictedRoute(<AssetDetailPage />)}
                />
                <Route
                  path="/saf/ativos/:assetId/escola/:schoolId"
                  element={renderRestrictedRoute(<AssetSchoolPage />)}
                />
                <Route
                  path="/access-control"
                  element={renderRestrictedRoute(<AccessControl />)}
                />
              </Route>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              {/* Sempre deixe as rotas novas acima do catch-all "*" */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
