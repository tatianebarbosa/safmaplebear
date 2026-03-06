import { useMemo, useState, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { SchoolLicenseManagement } from "./SchoolLicenseManagement";
import CanvaYearlyComparison from "./CanvaYearlyComparison";
import { CanvaMetricsDisplay } from "./CanvaMetricsDisplay";
import { CostManagementDashboard } from "./CostManagementDashboard";
import { TruncatedText } from "@/components/ui/truncated-text";
import { useSchoolLicenseStore } from "@/stores/schoolLicenseStore";
import FloatingAIChat from "@/components/ai/FloatingAIChat";
import { NonCompliantUsersDialog } from "./NonCompliantUsersDialog";

const CanvaDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const TAB_STORAGE_KEY = "canva-dashboard-active-tab";
  const tabRoutes: Record<string, string> = {
    overview: "/dashboard/canva",
    schools: "/dashboard/canva/escolas",
    usage: "/dashboard/canva/usos",
    usageModels: "/dashboard/canva/modelos",
    usageCreators: "/dashboard/canva/criadores",
    usageSchools: "/dashboard/canva/usos/escolas",
    costs: "/dashboard/canva/custos",
  };

  const resolveTabFromPath = (path: string, fallback?: string): string => {
    const lower = path.toLowerCase();
    if (
      lower.includes("/canva/usos") ||
      lower.includes("/canva/modelos") ||
      lower.includes("/canva/criadores") ||
      lower.includes("/canva/escolas-usos") ||
      lower.includes("/canva/usos/escolas")
    ) {
      return "usage";
    }
    const entry = Object.entries(tabRoutes).find(([, route]) => {
      if (route === path) return true;
      if (path.startsWith(`${route}/`)) return true;
      if (path.startsWith(`${route}?`)) return true;
      return false;
    });
    return entry ? entry[0] : fallback ?? "overview";
  };

  const [activeTab, setActiveTab] = useState<string>(() => {
    const stored =
      typeof window !== "undefined" ? window.sessionStorage?.getItem(TAB_STORAGE_KEY) ?? undefined : undefined;
    return resolveTabFromPath(location.pathname, stored);
  });
  const [schoolSearch, setSchoolSearch] = useState("");
  const {
    overviewData,
    loading,
    loadOfficialData,
    schools,
    getDomainCounts,
    getNonMapleBearCount,
  } = useSchoolLicenseStore();
  const [isNonCompliantDialogOpen, setIsNonCompliantDialogOpen] = useState(false);

  useAutoRefresh({
    onRefresh: loadOfficialData,
    interval: 5 * 60 * 1000,
    enabled: true,
    immediate: true,
  });

  const nonCompliantUserDetails = useMemo(() => {
    if (!schools?.length) return [];
    return schools.flatMap((school) =>
      school.users
        .filter((user) => !user.isCompliant)
        .map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          schoolName: school.name,
          schoolId: school.id,
          domain: user.email.split("@")[1]?.toLowerCase() || "",
        }))
    );
  }, [schools]);

  const resolvedNonCompliantCount = useMemo(() => {
    if (nonCompliantUserDetails.length > 0) return nonCompliantUserDetails.length;
    if (overviewData?.nonCompliantUsers !== undefined && overviewData?.nonCompliantUsers !== null) {
      return overviewData.nonCompliantUsers;
    }
    return getNonMapleBearCount();
  }, [nonCompliantUserDetails.length, overviewData, getNonMapleBearCount]);

  const resolvedDomainCounts = useMemo(() => {
    const domains = getDomainCounts();
    if (domains?.length) return domains;
    if (overviewData?.topNonCompliantDomains?.length) return overviewData.topNonCompliantDomains;
    return [];
  }, [getDomainCounts, overviewData]);

  const hasNonCompliant =
    (resolvedNonCompliantCount ?? 0) > 0 || (resolvedDomainCounts?.length ?? 0) > 0;

  const handleViewNonCompliantUsers = useCallback(() => {
    if (nonCompliantUserDetails.length === 0) {
      toast.info("Carregue os dados oficiais para ver os detalhes dos usuários não conformes.");
      return;
    }
    setIsNonCompliantDialogOpen(true);
  }, [nonCompliantUserDetails.length]);

  useEffect(() => {
    setActiveTab((prev) => resolveTabFromPath(location.pathname, prev));
  }, [location.pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage?.setItem(TAB_STORAGE_KEY, activeTab);
    } catch (error) {
      console.warn("Não foi possível salvar a aba ativa no sessionStorage", error);
    }
  }, [activeTab]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const target = tabRoutes[tab] || tabRoutes.overview;
    if (location.pathname !== target) {
      navigate(target, { replace: true });
    }
  };

  const containerClass = useMemo(() => {
    if (activeTab === "overview") return "max-w-[860px]";
    if (activeTab === "usage") return "max-w-[860px]";
    return "max-w-[920px]";
  }, [activeTab]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" role="status" aria-live="polite">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" aria-hidden="true"></div>
          <span className="sr-only">Carregando dashboard do Canva</span>
          <p className="text-sm text-muted-foreground">Carregando dashboard do Canva...</p>
        </div>
      </div>
    );
  }

  if (!overviewData) {
    return (
      <div className="text-center py-12 px-4" role="status" aria-live="polite">
        <p className="text-sm text-muted-foreground">Não foi possível carregar os dados do Canva.</p>
        <Button
          type="button"
          onClick={loadOfficialData}
          className="mt-4 h-11 px-4"
          aria-label="Recarregar dados do Canva"
        >
        Tentar novamente
      </Button>
      </div>
    );
  }

  return (
    <div className="w-full pb-32 md:pb-40">
      <div className={`layout-wide space-y-6 mt-4 px-1 ${containerClass}`}>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList
            className="tabs-no-underline flex w-full max-w-3xl mx-auto overflow-x-auto h-auto bg-transparent p-0 border-b border-border/50 justify-center gap-3 sm:gap-4 px-2"
            aria-label="Navegação do painel Canva"
          >
            <TabsTrigger
              value="overview"
              className="whitespace-nowrap text-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none h-11 px-3"
            >
              Visão Geral
            </TabsTrigger>
            <TabsTrigger
              value="schools"
              className="whitespace-nowrap text-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none h-11 px-3"
            >
              Escolas
            </TabsTrigger>
            <TabsTrigger
              value="usage"
              className="whitespace-nowrap text-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none h-11 px-3"
            >
              Usos
            </TabsTrigger>
            <TabsTrigger
              value="costs"
              className="whitespace-nowrap text-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none h-11 px-3"
            >
              Custos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {hasNonCompliant && (
              <Card className="border-destructive/20 bg-destructive/5 shadow-sm">
                <CardHeader>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                    <div className="space-y-1">
                      <CardTitle className="text-base font-semibold text-destructive">
                        Alerta de Conformidade - Alto Risco
                      </CardTitle>
                      <CardDescription className="text-sm text-destructive">
                        {resolvedNonCompliantCount} usuários com domínios não autorizados identificados
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {(resolvedDomainCounts || []).slice(0, 5).map(({ domain, count }) => (
                    <span
                          key={domain}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-destructive text-destructive-foreground"
                        >
                          <TruncatedText text={`${domain} (${count})`} maxWidth="160px" showTooltip />
                        </span>
                      ))}
                      {(resolvedDomainCounts || []).length > 5 && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-muted text-muted-foreground">
                          +{(resolvedDomainCounts || []).length - 5} domínios
                        </span>
                      )}
                    </div>
                <Button
                  variant="destructive"
                  onClick={handleViewNonCompliantUsers}
                  className="mt-4 h-11 px-4"
                  aria-label="Ver detalhes dos usuários não conformes"
                >
                      Ver detalhes dos usuários não conformes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            <CanvaMetricsDisplay />
          </TabsContent>

          <TabsContent value="schools" className="space-y-6">
            <SchoolLicenseManagement
              externalSearchTerm={schoolSearch}
              onExternalSearchConsumed={() => setSchoolSearch("")}
            />
          </TabsContent>

          <TabsContent value="usage" className="space-y-6">
            <CanvaYearlyComparison />
          </TabsContent>

          <TabsContent value="costs" className="space-y-6">
            <CostManagementDashboard />
          </TabsContent>
        </Tabs>

        <FloatingAIChat />
        <NonCompliantUsersDialog
          open={isNonCompliantDialogOpen}
          onOpenChange={setIsNonCompliantDialogOpen}
          users={nonCompliantUserDetails}
        />
      </div>
    </div>
  );
};

export default CanvaDashboard;


