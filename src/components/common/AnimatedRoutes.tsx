import React from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Suspense, lazy } from 'react';
import { LoadingPage } from "@/components/ui/loading-spinner";
import PageTransition from './PageTransition';

// Lazy loading de páginas e componentes pesados
const Index = lazy(() => import("../../pages/Index"));
const Login = lazy(() => import("../../pages/Login"));
const NotFound = lazy(() => import("../../pages/NotFound"));
const AccessControl = lazy(() => import("@/components/auth/AccessControl"));
const CanvaDashboard = lazy(() => import("@/components/canva/CanvaDashboard"));
const VoucherDashboard = lazy(() => import("@/components/vouchers/VoucherDashboard"));
const Voucher2026Dashboard = lazy(() => import("@/components/vouchers/Voucher2026Dashboard"));
const InsightsAnalytics = lazy(() => import("@/components/insights/InsightsAnalytics"));
const MonitoringPortal = lazy(() => import("@/components/monitoring/MonitoringPortal"));
const TicketsPage = lazy(() => import("../../pages/TicketsPage"));
const AdminPage = lazy(() => import("../../pages/AdminPage"));

const AnimatedRoutes = () => {
  const location = useLocation();

  const wrapInTransition = (element: React.ReactNode) => (
    <PageTransition key={location.pathname}>
      {element}
    </PageTransition>
  );

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={wrapInTransition(<Suspense fallback={<LoadingPage />}><Login /></Suspense>)} />
        <Route 
          path="/dashboard" 
          element={wrapInTransition(<Suspense fallback={<LoadingPage />}><Index /></Suspense>)} 
        />
        <Route 
          path="/dashboard/canva" 
          element={wrapInTransition(<Suspense fallback={<LoadingPage />}><CanvaDashboard /></Suspense>)} 
        />
        <Route 
          path="/dashboard/vouchers" 
          element={wrapInTransition(<Suspense fallback={<LoadingPage />}><VoucherDashboard /></Suspense>)} 
        />
        <Route 
          path="/dashboard/vouchers-2026" 
          element={wrapInTransition(<Suspense fallback={<LoadingPage />}><Voucher2026Dashboard /></Suspense>)} 
        />
        <Route 
          path="/insights" 
          element={wrapInTransition(<Suspense fallback={<LoadingPage />}><InsightsAnalytics /></Suspense>)} 
        />
        <Route 
          path="/monitoring" 
          element={wrapInTransition(<Suspense fallback={<LoadingPage />}><MonitoringPortal /></Suspense>)} 
        />
        <Route 
          path="/tickets" 
          element={wrapInTransition(<Suspense fallback={<LoadingPage />}><TicketsPage /></Suspense>)} 
        />
        <Route 
          path="/admin" 
          element={wrapInTransition(<Suspense fallback={<LoadingPage />}><AdminPage /></Suspense>)} 
        />
        <Route 
          path="/access-control" 
          element={wrapInTransition(<Suspense fallback={<LoadingPage />}><AccessControl /></Suspense>)} 
        />
        <Route 
          path="/" 
          element={<Navigate to="/dashboard" replace />} 
        />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={wrapInTransition(<Suspense fallback={<LoadingPage />}><NotFound /></Suspense>)} />
      </Routes>
    </AnimatePresence>
  );
};

export default AnimatedRoutes;
