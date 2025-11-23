import { useMemo, useState, useCallback } from "react";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { SchoolLicenseManagement } from "./SchoolLicenseManagement";
import { CanvaUsageDashboard } from "./CanvaUsageDashboard";
import { CanvaMetricsDisplay } from "./CanvaMetricsDisplay";
import { CostManagementDashboard } from "./CostManagementDashboard";
import { useSchoolLicenseStore } from "@/stores/schoolLicenseStore";
import FloatingAIChat from "@/components/ai/FloatingAIChat";
import { NonCompliantUsersDialog } from "./NonCompliantUsersDialog";

const CanvaDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
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

  const nonCompliantDomainCounts = useMemo(() => getDomainCounts(), [getDomainCounts]);
  const nonCompliantUserCount = useMemo(() => getNonMapleBearCount(), [getNonMapleBearCount]);

  const handleViewNonCompliantUsers = useCallback(() => {
    if (nonCompliantUserDetails.length === 0) {
      toast.info("Nenhum usuário fora da política carregado no momento.");
      return;
    }
    setIsNonCompliantDialogOpen(true);
  }, [nonCompliantUserDetails]);

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
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full pb-10">
      <div className="space-y-6 mt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex w-full overflow-x-auto h-auto bg-transparent p-0 border-b border-border/50">
            <TabsTrigger
              value="overview"
              className="whitespace-nowrap text-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none"
            >
            Visão Geral
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
          {overviewData.nonCompliantUsers > 0 && (
            <Card className="border-destructive/20 bg-destructive/5 shadow-sm">
              <CardHeader>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                  <div className="space-y-1">
                    <CardTitle className="text-base font-semibold text-destructive">
                      Alerta de Conformidade - Alto Risco
                    </CardTitle>
                    <CardDescription className="text-sm text-destructive">
                      {nonCompliantUserCount} usuários com domínios não autorizados identificados
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
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-destructive text-destructive-foreground"
                      >
                        {domain} ({count})
                      </span>
                    ))}
                    {(nonCompliantDomainCounts || []).length > 5 && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-muted text-muted-foreground">
                        +{(nonCompliantDomainCounts || []).length - 5} domínios
                      </span>
                    )}
                  </div>
                  <Button variant="destructive" size="sm" onClick={handleViewNonCompliantUsers} className="mt-4">
                    Ver Detalhes dos Usuários Não Conformes
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
          <CanvaUsageDashboard
            onNavigateToUsers={(email) => {
              setSchoolSearch(email ?? "");
              setActiveTab("schools");
              toast.info("Buscando na aba Escolas");
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
