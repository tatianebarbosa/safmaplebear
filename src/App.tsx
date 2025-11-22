import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import ProtectedRoute from "./components/auth/ProtectedRoute";

const queryClient = new QueryClient();

// Lazy load page components for better performance
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
const KnowledgeBasePage = lazy(() => import("@/pages/KnowledgeBasePage"));

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<Skeleton className="h-screen w-full" />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/canva" 
              element={
                <ProtectedRoute>
                  <CanvaDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/vouchers" 
              element={
                <ProtectedRoute>
                  <VoucherDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/vouchers-2026" 
              element={
                <ProtectedRoute>
                  <Voucher2026Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/insights" 
              element={
                <ProtectedRoute>
                  <InsightsAnalytics />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/monitoring" 
              element={
                <ProtectedRoute>
                  <MonitoringPortal />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/tickets" 
              element={
                <ProtectedRoute>
                  <TicketsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <AdminPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/knowledge-base" 
              element={
                <ProtectedRoute>
                  <KnowledgeBasePage />
                </ProtectedRoute>
              } 
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
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
