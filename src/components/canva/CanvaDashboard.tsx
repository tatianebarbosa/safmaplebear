import { useMemo, useState, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { SchoolLicenseManagement } from "./SchoolLicenseManagement";
import CanvaYearlyComparison from "./CanvaYearlyComparison";
import { CanvaMetricsDisplay } from "./CanvaMetricsDisplay";
import { CostManagementDashboard } from "./CostManagementDashboard";
import { useSchoolLicenseStore } from "@/stores/schoolLicenseStore";
import FloatingAIChat from "@/components/ai/FloatingAIChat";
import { NonCompliantUsersDialog } from "./NonCompliantUsersDialog";

const CanvaDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const tabRoutes: Record<string, string> = {
    overview: "/dashboard/canva",
    schools: "/dashboard/canva/escolas",
    usage: "/dashboard/canva/usos",
    costs: "/dashboard/canva/custos",
  };

  const resolveTabFromPath = (path: string): string => {
    const entry = Object.entries(tabRoutes).find(([, route]) => route === path);
    return entry ? entry[0] : "overview";
  };

  const [activeTab, setActiveTab] = useState<string>(resolveTabFromPath(location.pathname));
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
      toast.info("Carregue os dados oficiais para ver os detalhes dos usuarios nao conformes.");
      return;
    }
    setIsNonCompliantDialogOpen(true);
  }, [nonCompliantUserDetails.length]);

  useEffect(() => {
    const tab = resolveTabFromPath(location.pathname);
    if (tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [location.pathname, activeTab]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const target = tabRoutes[tab] || tabRoutes.overview;
    if (location.pathname !== target) {
      navigate(target, { replace: true });
    }
  };

  const containerStyle = useMemo(() => {
    if (activeTab === "overview") return { maxWidth: 860 };
    if (activeTab === "usage") return { maxWidth: 860 };
    return { maxWidth: 920 };
  }, [activeTab]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!overviewData) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">Erro ao carregar dados do Canva.</p>
        <Button onClick={loadOfficialData} className="mt-4">
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full pb-32 md:pb-40">
      <div className="layout-wide space-y-6 mt-4" style={containerStyle}>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="tabs-no-underline flex w-full max-w-3xl mx-auto overflow-x-auto h-auto bg-transparent p-0 border-b border-border/50 justify-center gap-4 px-2">
            <TabsTrigger
              value="overview"
              className="whitespace-nowrap text-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none"
            >
              Visao Geral
            </TabsTrigger>
            <TabsTrigger
              value="schools"
              className="whitespace-nowrap text-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none"
            >
              Escolas
            </TabsTrigger>
            <TabsTrigger
              value="usage"
              className="whitespace-nowrap text-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none"
            >
              Usos
            </TabsTrigger>
            <TabsTrigger
              value="costs"
              className="whitespace-nowrap text-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none"
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
                        {resolvedNonCompliantCount} usuarios com dominios nao autorizados identificados
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
                          {domain} ({count})
                        </span>
                      ))}
                      {(resolvedDomainCounts || []).length > 5 && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-muted text-muted-foreground">
                          +{(resolvedDomainCounts || []).length - 5} dominios
                        </span>
                      )}
                    </div>
                    <Button variant="destructive" size="sm" onClick={handleViewNonCompliantUsers} className="mt-4">
                      Ver detalhes dos usuarios nao conformes
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
