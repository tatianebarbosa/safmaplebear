import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import ErrorBoundary from "@/components/common/ErrorBoundary";
import { LoadingPage } from "@/components/ui/loading-spinner";
import useTheme from "@/hooks/use-theme";

import AnimatedRoutes from "@/components/common/AnimatedRoutes";
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

const ThemeInitializer = () => {
  useTheme(); // Inicializa o tema
  return null;
};

const App = () => (
  <ErrorBoundary>
    <HelmetProvider>
      <ThemeInitializer />
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>

              <AnimatedRoutes />
              <FloatingAIChat />

          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
