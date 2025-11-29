import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { lazy, Suspense } from "react";
import Header from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import ProtectedRoute from "./components/auth/ProtectedRoute";

const queryClient = new QueryClient();

// Lazy load page components for better performance
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

const ProtectedShell = () => (
  <ProtectedRoute>
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1 w-full">
        <Outlet />
      </main>

      <Footer />
    </div>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<Skeleton className="h-screen w-full" />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedShell />}>
              <Route path="/dashboard" element={<Index />} />
              <Route path="/dashboard/canva" element={<CanvaDashboard />} />
              <Route path="/dashboard/vouchers" element={<VoucherDashboard />} />
              <Route
                path="/dashboard/vouchers-2026"
                element={<Voucher2026Dashboard />}
              />
              <Route path="/insights" element={<InsightsAnalytics />} />
              <Route path="/monitoring" element={<MonitoringPortal />} />
              <Route path="/tickets" element={<TicketsPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route
                path="/knowledge-base"
                element={<KnowledgeBasePage />}
              />
              <Route path="/saf/ativos" element={<AssetsPage />} />
              <Route path="/saf/ativos/:assetId" element={<AssetDetailPage />} />
              <Route
                path="/saf/ativos/:assetId/escola/:schoolId"
                element={<AssetSchoolPage />}
              />
              <Route path="/access-control" element={<AccessControl />} />
            </Route>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
