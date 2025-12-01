import { useMemo, useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle } from "lucide-react";
import { SchoolLicenseManagement } from "./SchoolLicenseManagement";
import { CanvaUsageDashboard } from "./CanvaUsageDashboard";
import { CanvaMetricsDisplay } from "./CanvaMetricsDisplay";
import { CostManagementDashboard } from "./CostManagementDashboard";
import { useSchoolLicenseStore } from "@/stores/schoolLicenseStore";
import FloatingAIChat from "@/components/ai/FloatingAIChat";
import { NonCompliantUsersDialog } from "./NonCompliantUsersDialog";
import { useToast } from "@/hooks/use-toast";

const resolveInitialTab = () => {
  if (typeof window === "undefined") return "overview";
  const hash = window.location.hash?.replace("#", "").toLowerCase();
  const searchTab = new URLSearchParams(window.location.search).get("tab")?.toLowerCase();
  const target = searchTab || hash;
  if (target === "schools" || target === "escolas") return "schools";
  if (target === "usage" || target === "usos") return "usage";
  if (target === "costs" || target === "custos") return "costs";
  return "overview";
};

const CanvaDashboard = () => {
  const [activeTab, setActiveTab] = useState(resolveInitialTab());
  const [schoolSearch, setSchoolSearch] = useState("");
  const { overviewData, loading, loadOfficialData, schools } = useSchoolLicenseStore();
  const getDomainCounts = useSchoolLicenseStore((state) => state.getDomainCounts || (() => []));
  const getNonMapleBearCount = useSchoolLicenseStore((state) => state.getNonMapleBearCount || (() => 0));
  const { toast } = useToast();

  const [isNonCompliantDialogOpen, setIsNonCompliantDialogOpen] = useState(false);

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

  const nonCompliantDomainCounts = useMemo(() => getDomainCounts(), [getDomainCounts]);
  const nonCompliantUserCount = useMemo(() => getNonMapleBearCount(), [getNonMapleBearCount]);
  const effectiveOverview =
    overviewData || {
      totalUsers: 0,
      totalSchools: 0,
      compliantUsers: 0,
      nonCompliantUsers: 0,
      complianceRate: 0,
      nonMapleBearDomains: 0,
      topNonCompliantDomains: [],
      schoolsWithUsers: 0,
      schoolsAtCapacity: 0,
    };

  const handleViewNonCompliantUsers = useCallback(() => {
    if (nonCompliantUserDetails.length === 0) {
      toast({
        title: "Nenhum usuario fora da politica carregado no momento.",
      });
      return;
    }
    setIsNonCompliantDialogOpen(true);
  }, [nonCompliantUserDetails, toast]);

  useEffect(() => {
    const hashListener = () => {
      const hash = window.location.hash?.replace("#", "").toLowerCase();
      if (hash && hash !== activeTab) {
        setActiveTab(resolveInitialTab());
      }
    };
    window.addEventListener("hashchange", hashListener);
    return () => window.removeEventListener("hashchange", hashListener);
  }, [activeTab]);

  // Carrega dados ao montar (usa fallback se API falhar)
  useEffect(() => {
    loadOfficialData();
  }, [loadOfficialData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full pb-10">
      <div className="layout-wide space-y-6 mt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="justify-center gap-6 overflow-x-auto px-2 border-none pb-2">
            <TabsTrigger value="overview">Visao Geral</TabsTrigger>
            <TabsTrigger value="schools">Escolas</TabsTrigger>
            <TabsTrigger value="usage">Usos</TabsTrigger>
            <TabsTrigger value="costs">Custos</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {effectiveOverview.nonCompliantUsers > 0 && (
              <Card className="border-destructive/20 bg-destructive/5 shadow-sm">
                <CardHeader>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                    <div className="space-y-1">
                      <CardTitle className="text-base font-semibold text-destructive">
                        Alerta de Conformidade - Alto Risco
                      </CardTitle>
                      <CardDescription className="text-sm text-destructive">
                        {nonCompliantUserCount} usuarios com dominios nao autorizados identificados
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {(nonCompliantDomainCounts || []).slice(0, 5).map(({ domain, count }) => (
                        <span
                          key={domain}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-destructive text-white"
                        >
                          {domain} ({count})
                        </span>
                      ))}
                      {(nonCompliantDomainCounts || []).length > 5 && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-muted text-muted-foreground">
                          +{(nonCompliantDomainCounts || []).length - 5} dominios
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
            <CanvaMetricsDisplay overviewData={effectiveOverview} />
          </TabsContent>

          <TabsContent value="schools" className="space-y-6">
            <SchoolLicenseManagement
              externalSearchTerm={schoolSearch}
              onExternalSearchConsumed={() => setSchoolSearch("")}
            />
          </TabsContent>

          <TabsContent value="usage" className="space-y-6">
            <CanvaUsageDashboard
              onNavigateToUsers={(email) => {
                setSchoolSearch(email ?? "");
                setActiveTab("schools");
                toast({
                  title: "Buscando na aba Escolas",
                  description: email ? `Filtrando por ${email}` : undefined,
                });
              }}
            />
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
