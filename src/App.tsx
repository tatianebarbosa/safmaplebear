import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { lazy, Suspense } from "react";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Header from "@/components/layout/Header";

const queryClient = new QueryClient();

// Lazy load page components for better performance
const Index = lazy(() => import("@/pages/Index"));
const Login = lazy(() => import("@/pages/Login"));
const NotFound = lazy(() => import("@/pages/NotFound"));
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
const AgendaSafPage = lazy(() => import("@/pages/AgendaSafPage"));

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<Skeleton className="h-screen w-full" />}>
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route
                element={
                  <ProtectedRoute>
                    <div className="flex min-h-screen flex-col bg-background">
                      <Header />
                      <main className="flex-1 w-full pb-8">
                        <div className="layout-wide">
                          <Outlet />
                        </div>
                      </main>
                    </div>
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<Index />} />
                <Route path="/dashboard/canva" element={<CanvaDashboard />} />
                <Route path="/dashboard/vouchers" element={<VoucherDashboard />} />
                <Route path="/dashboard/vouchers-2026" element={<Voucher2026Dashboard />} />
                <Route path="/insights" element={<InsightsAnalytics />} />
                <Route path="/monitoring" element={<MonitoringPortal />} />
                <Route path="/tickets" element={<TicketsPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
                <Route path="/agenda" element={<AgendaSafPage />} />
              </Route>

              <Route path="/" element={<Navigate to="/login" replace />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
