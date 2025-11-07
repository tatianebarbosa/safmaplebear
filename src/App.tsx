import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import ErrorBoundary from "@/components/common/ErrorBoundary";
import { LoadingPage } from "@/components/ui/loading-spinner";

// Lazy loading de páginas e componentes pesados
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AccessControl = lazy(() => import("@/components/auth/AccessControl"));
const CanvaDashboard = lazy(() => import("@/components/canva/CanvaDashboard"));
const VoucherDashboard = lazy(() => import("@/components/vouchers/VoucherDashboard"));
const Voucher2026Dashboard = lazy(() => import("@/components/vouchers/Voucher2026Dashboard"));
const InsightsAnalytics = lazy(() => import("@/components/insights/InsightsAnalytics"));
const MonitoringPortal = lazy(() => import("@/components/monitoring/MonitoringPortal"));
const TicketsPage = lazy(() => import("@/pages/TicketsPage"));
const AdminPage = lazy(() => import("@/pages/AdminPage"));
const FloatingAIChat = lazy(() => import("@/components/ai/FloatingAIChat"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<LoadingPage />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route 
                  path="/dashboard" 
                  element={<Index />} 
                />
                <Route 
                  path="/dashboard/canva" 
                  element={<CanvaDashboard />} 
                />
                <Route 
                  path="/dashboard/vouchers" 
                  element={<VoucherDashboard />} 
                />
                <Route 
                  path="/dashboard/vouchers-2026" 
                  element={<Voucher2026Dashboard />} 
                />
                <Route 
                  path="/insights" 
                  element={<InsightsAnalytics />} 
                />
                <Route 
                  path="/monitoring" 
                  element={<MonitoringPortal />} 
                />
                <Route 
                  path="/tickets" 
                  element={<TicketsPage />} 
                />
                <Route 
                  path="/admin" 
                  element={<AdminPage />} 
                />
                <Route 
                  path="/access-control" 
                  element={<AccessControl />} 
                />
                <Route 
                  path="/" 
                  element={<Navigate to="/dashboard" replace />} 
                />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <FloatingAIChat />
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
