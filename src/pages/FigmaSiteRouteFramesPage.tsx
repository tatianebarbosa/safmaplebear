import { useEffect, useState } from "react";
import { Outlet, Route, Routes } from "react-router-dom";

import CanvaDashboard from "@/components/canva/CanvaDashboard";
import { Footer } from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import AssetsPage from "@/pages/AssetsPage";
import Index from "@/pages/Index";
import KnowledgeBasePage from "@/pages/KnowledgeBasePage";
import LinksPage from "@/pages/LinksPage";
import TicketsPage from "@/pages/TicketsPage";
import VoucherDashboard from "@/components/vouchers/VoucherDashboard";
import {
  getAuthToken,
  getUserFromToken,
  isAuthenticated,
  saveAuthToken,
} from "@/services/authService";
import { useAuthStore } from "@/stores/authStore";

type FrameConfig = {
  key: string;
  title: string;
  routeLabel: string;
  path: string;
};

const frameConfigs: FrameConfig[] = [
  { key: "home", title: "Home", routeLabel: "/", path: "/" },
  { key: "canva", title: "Canva", routeLabel: "/canva", path: "/canva" },
  { key: "vouchers", title: "Vouchers", routeLabel: "/vouchers", path: "/vouchers" },
  { key: "ativos", title: "Ativos", routeLabel: "/ativos", path: "/ativos" },
  { key: "tickets", title: "Tickets", routeLabel: "/tickets", path: "/tickets" },
  {
    key: "knowledge",
    title: "Base de Conhecimento",
    routeLabel: "/knowledge",
    path: "/knowledge",
  },
  { key: "links", title: "Links", routeLabel: "/links", path: "/links" },
];

const buildCaptureToken = () =>
  btoa(
    JSON.stringify({
      id: "figma-capture",
      username: "admin",
      email: "admin@safmaplebear.local",
      name: "Admin Figma",
      role: "admin",
      exp: Date.now() + 10 * 60 * 1000,
    })
  );

const CaptureShell = () => (
  <div className="flex min-h-screen flex-col bg-background">
    <Header />
    <main className="flex-1 w-full pb-20 md:pb-28">
      <Outlet />
    </main>
    <Footer />
  </div>
);

const FramePreview = ({ frame }: { frame: FrameConfig }) => (
  <article className="w-[1440px] flex-none">
    <div className="mb-4 flex items-center justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
          Route Frame
        </p>
        <h2 className="mt-1 text-2xl font-semibold text-slate-950">
          {frame.title}
        </h2>
      </div>
      <Badge
        variant="outline"
        className="rounded-full border-slate-200 bg-white px-4 py-1.5 text-slate-600"
      >
        {frame.routeLabel}
      </Badge>
    </div>

    <Card className="overflow-hidden rounded-[32px] border-white/70 bg-white shadow-[0_32px_80px_-52px_rgba(15,23,42,0.45)]">
      <CardContent className="p-0">
        <Routes location={frame.path}>
          <Route element={<CaptureShell />}>
            <Route path="/" element={<Index />} />
            <Route path="/canva" element={<CanvaDashboard />} />
            <Route path="/vouchers" element={<VoucherDashboard />} />
            <Route path="/ativos" element={<AssetsPage />} />
            <Route path="/tickets" element={<TicketsPage />} />
            <Route path="/knowledge" element={<KnowledgeBasePage />} />
            <Route path="/links" element={<LinksPage />} />
          </Route>
        </Routes>
      </CardContent>
    </Card>
  </article>
);

const FigmaSiteRouteFramesPage = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (getAuthToken() && isAuthenticated()) {
      const tokenUser = getUserFromToken(getAuthToken());
      if (tokenUser) {
        useAuthStore.getState().setCurrentUser(tokenUser);
      }
      setIsReady(true);
      return;
    }

    const previousAuth = localStorage.getItem("authToken");
    const previousSafAuth = localStorage.getItem("saf_auth_token");
    const previousEmail = localStorage.getItem("userEmail");
    const token = buildCaptureToken();

    saveAuthToken(token);
    localStorage.setItem("userEmail", "admin@safmaplebear.local");

    const tokenUser = getUserFromToken(token);
    if (tokenUser) {
      useAuthStore.getState().setCurrentUser(tokenUser);
    }

    setIsReady(true);

    return () => {
      if (previousAuth) {
        localStorage.setItem("authToken", previousAuth);
      } else {
        localStorage.removeItem("authToken");
      }

      if (previousSafAuth) {
        localStorage.setItem("saf_auth_token", previousSafAuth);
      } else {
        localStorage.removeItem("saf_auth_token");
      }

      if (previousEmail) {
        localStorage.setItem("userEmail", previousEmail);
      } else {
        localStorage.removeItem("userEmail");
      }
    };
  }, []);

  if (!isReady) {
    return <div className="min-h-screen bg-[#eef2ff]" />;
  }

  return (
    <div className="min-h-screen bg-[#eef2ff] p-8">
      <div className="flex w-max items-start gap-10">
        {frameConfigs.map((frame) => (
          <FramePreview key={frame.key} frame={frame} />
        ))}
      </div>
    </div>
  );
};

export default FigmaSiteRouteFramesPage;
