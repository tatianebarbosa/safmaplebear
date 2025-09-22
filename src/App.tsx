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
import InsightsAnalytics from "@/components/insights/InsightsAnalytics";

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
            path="/insights" 
            element={
              <ProtectedRoute>
                <InsightsAnalytics />
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
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
