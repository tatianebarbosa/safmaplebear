import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
// import ProtectedRoute from "./components/auth/ProtectedRoute"; // Desativado para teste
import AccessControl from "@/components/auth/AccessControl";
import CanvaDashboard from "@/components/canva/CanvaDashboard";
import VoucherDashboard from "@/components/vouchers/VoucherDashboard";
import Voucher2026Dashboard from "@/components/vouchers/Voucher2026Dashboard";
import InsightsAnalytics from "@/components/insights/InsightsAnalytics";
import MonitoringPortal from "@/components/monitoring/MonitoringPortal";
import TicketsPage from "@/pages/TicketsPage";
import AdminPage from "@/pages/AdminPage";
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
              <Index />
            } 
          />
          <Route 
            path="/dashboard/canva" 
            element={
              <CanvaDashboard />
            } 
          />
          <Route 
            path="/dashboard/vouchers" 
            element={
              <VoucherDashboard />
            } 
          />
          <Route 
            path="/dashboard/vouchers-2026" 
            element={
              <Voucher2026Dashboard />
            } 
          />
          <Route 
            path="/insights" 
            element={
              <InsightsAnalytics />
            } 
          />
          <Route 
            path="/monitoring" 
            element={
              <MonitoringPortal />
            } 
          />
          <Route 
            path="/tickets" 
            element={
              <TicketsPage />
            } 
          />
          <Route 
            path="/admin" 
            element={
              <AdminPage />
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
        <FloatingAIChat />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
