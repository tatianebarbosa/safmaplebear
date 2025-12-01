import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Users, Shield, Building2 } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "@/components/ui/sonner";
import AccessManagement from "@/components/admin/AccessManagement";
import {
  getMaxLicensesPerSchool,
  resetMaxLicensesPerSchool,
  setMaxLicensesPerSchool,
  useLicenseLimit,
} from "@/config/licenseLimits";
import { useSchoolLicenseStore } from "@/stores/schoolLicenseStore";

type LicenseHistoryEntry = {
  value: number;
  performedBy: string;
  date: string;
  reason: string;
  justification?: string;
};

const AdminPage = () => {
  const { hasRole, currentUser } = useAuthStore();
  const licenseLimit = useLicenseLimit();
  const [licenseInput, setLicenseInput] = useState<number>(licenseLimit);
  const applyLicenseLimit = useSchoolLicenseStore((state) => state.applyLicenseLimit);
  const [history, setHistory] = useState<LicenseHistoryEntry[]>([]);
  const [justification, setJustification] = useState("");
  const HISTORY_KEY = "saf_license_limit_history";

  // Mantém o store sincronizado sempre que o limite mudar (inclusive fora desta tela)
  useEffect(() => {
    if (typeof applyLicenseLimit === "function") {
      applyLicenseLimit(licenseLimit);
    }
  }, [licenseLimit, applyLicenseLimit]);

  useEffect(() => {
    setLicenseInput(licenseLimit);
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch {
      setHistory([]);
    }
  }, [licenseLimit]);

  const persistHistory = (entries: LicenseHistoryEntry[]) => {
    setHistory(entries);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
  };

  const handleSaveLicenseLimit = () => {
    if (!justification.trim()) {
      toast.error("Informe uma justificativa para a alteração.");
      return;
    }
    const parsed = Math.max(1, Math.floor(Number(licenseInput)));
    setLicenseInput(parsed);
    setMaxLicensesPerSchool(parsed);
    applyLicenseLimit(parsed);
    const actor = currentUser?.name || currentUser?.email || "Admin";
    persistHistory([
      {
        value: parsed,
        performedBy: actor,
        date: new Date().toISOString(),
        reason: justification.trim(),
        justification: justification.trim(),
      },
      ...history,
    ]);
    setJustification("");
    toast.success(`Limite ajustado para ${parsed} licenças por escola`);
  };

  const handleResetLicenseLimit = () => {
    if (!justification.trim()) {
      toast.error("Informe uma justificativa para a alteração.");
      return;
    }
    resetMaxLicensesPerSchool();
    const fallback = getMaxLicensesPerSchool();
    setLicenseInput(fallback);
    applyLicenseLimit(fallback);
    const actor = currentUser?.name || currentUser?.email || "Admin";
    persistHistory([
      {
        value: fallback,
        performedBy: actor,
        date: new Date().toISOString(),
        reason: justification.trim(),
        justification: justification.trim(),
      },
      ...history,
    ]);
    setJustification("");
    toast.success(`Limite restaurado para ${fallback} licenças por escola`);
  };

  const canAccess = hasRole("Admin") || hasRole("Coordinator");

  // Redirect if not authorized
  if (!canAccess) {
    return (
      <div className="layout-wide w-full py-8 space-y-4">
        <Card>
          <CardContent className="py-16 text-center">
            <Shield className="h-16 w-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold mb-2">Acesso Negado</h2>
            <p className="text-muted-foreground">
              Apenas Coordenadores e Administradores podem acessar esta área.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  

  return (
    <div className="layout-wide w-full py-8 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8 text-primary" />
          Administração
        </h1>
        <p className="text-muted-foreground">
          Gerencie usuários, papéis e configurações do sistema
        </p>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <div className="flex justify-center">
          <TabsList className="w-full max-w-xl justify-center gap-8 bg-transparent">
            <TabsTrigger value="users" className="gap-2 text-base">
              <Users className="h-4 w-4" />
              Usuários e Perfis
            </TabsTrigger>
            <TabsTrigger value="licenses" className="gap-2 text-base">
              <Building2 className="h-4 w-4" />
              Licenças Canva
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="users" className="space-y-6">
          <Card className="border-border/70 shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle>Gerenciamento de Usuários</CardTitle>
              <CardDescription>
                Adicione, edite e remova usuários, e gerencie seus perfis de acesso.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AccessManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="licenses" className="space-y-6">
          <Card className="border-border/70 shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle>Limite de licenças por escola</CardTitle>
              <CardDescription>
                Ajuste quantas licenças do Canva cada escola recebe. Padrão atual: {licenseLimit}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-[1fr_auto] items-end">
                <div className="space-y-2">
                  <Label htmlFor="licenseLimit">Licenças por escola</Label>
                  <Input
                    id="licenseLimit"
                    type="number"
                    min={1}
                    value={licenseInput}
                    onChange={(e) => setLicenseInput(Number(e.target.value || 0))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use 2 licenças como padrão. A alteração atualiza todo o site imediatamente.
                  </p>
                </div>
                <div className="flex flex-col gap-2 md:items-end">
                  <Button
                    variant="outline"
                    className="w-full md:w-auto"
                    onClick={handleResetLicenseLimit}
                  >
                    Voltar para 2 licenças
                  </Button>
                  <Button
                    className="w-full md:w-auto"
                    onClick={handleSaveLicenseLimit}
                  >
                    Atualizar limite
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="licenseJustification">Justificativa</Label>
                <Textarea
                  id="licenseJustification"
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Descreva o motivo da alteração e o impacto esperado."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Uma justificativa é obrigatória e ficará registrada com o autor e data.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle>Histórico de alterações</CardTitle>
              <CardDescription>Registro de quem ajustou o limite e quando.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma alteração registrada ainda.</p>
              ) : (
                <div className="space-y-2">
                  {history.map((entry, index) => (
                    <div
                      key={`${entry.date}-${index}`}
                      className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                    >
                      <div className="space-y-1">
                        <div className="font-medium">{entry.performedBy}</div>
                        <div className="text-muted-foreground">
                          Ajustou para {entry.value} licença(s)
                          {entry.justification && (
                            <span className="block text-xs text-muted-foreground">
                              Justificativa: {entry.justification}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(entry.date).toLocaleString("pt-BR")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;
