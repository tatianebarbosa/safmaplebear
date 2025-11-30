import CoordinatorAgentMonitoringTab from "@/components/auth/CoordinatorAgentMonitoringTab";
import { useAuthStore } from "@/stores/authStore";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import BackToDashboard from "@/components/common/BackToDashboard";

const AgentMonitoringPage = () => {
  const { hasRole } = useAuthStore();
  const isAllowed = hasRole("Coordinator") || hasRole("Admin");

  if (!isAllowed) {
    return (
      <div className="w-full py-8 space-y-4">
        <BackToDashboard />
        <Card>
          <CardContent className="py-16 text-center">
            <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-orange-500" />
            <h2 className="text-2xl font-bold mb-2">Acesso Negado</h2>
            <p className="text-muted-foreground">
              Apenas Coordenadores e Administradores podem acessar a Monitoria de Agentes.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full py-8 space-y-6">
      <BackToDashboard />
      <CoordinatorAgentMonitoringTab />
    </div>
  );
};

export default AgentMonitoringPage;
