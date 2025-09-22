import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AccessControl from "@/components/auth/AccessControl";
import CanvaDashboard from "@/components/canva/CanvaDashboard";
import VoucherDashboard from "@/components/vouchers/VoucherDashboard";
import Voucher2026Dashboard from "@/components/vouchers/Voucher2026Dashboard";
import InsightsAnalytics from "@/components/insights/InsightsAnalytics";
import MonitoringPortal from "@/components/monitoring/MonitoringPortal";
import FloatingAIChat from "@/components/ai/FloatingAIChat";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
            path="/access-control" 
            element={<AccessControl />} 
          />
          <Route 
            path="/" 
            element={<Navigate to="/login" replace />} 
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <FloatingAIChat />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
