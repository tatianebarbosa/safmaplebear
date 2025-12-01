import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Mail, Building, Shield } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import {
  loadUserData,
  analyzeEmails,
  getUsersBySchool,
  getClusterSAFResponsibles,
  type UserData,
  type EmailAnalysis,
} from "@/lib/userAnalytics";

const UserAnalytics = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [emailAnalysis, setEmailAnalysis] = useState<EmailAnalysis | null>(
    null
  );
  const [usersBySchool, setUsersBySchool] = useState<Map<string, UserData[]>>(
    new Map()
  );
  const [safResponsibles, setSafResponsibles] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const userData = await loadUserData();
      setUsers(userData);

      const analysis = analyzeEmails(userData);
      setEmailAnalysis(analysis);

      const schoolGroups = getUsersBySchool(userData);
      setUsersBySchool(schoolGroups);

      const responsibles = getClusterSAFResponsibles(userData);
      setSafResponsibles(responsibles);

      toast.success("Dados dos usu?rios carregados com sucesso!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error(`Erro ao carregar dados dos usu?rios: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Anlise de Usurios</h1>
          <p className="text-muted-foreground">
            Anlise completa dos usu?rios, emails e respons?veis SAF
          </p>
        </div>
      </div>

      {/* Cards de Estatsticas Gerais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Usurios
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              Usurios cadastrados no sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Emails Maple Bear / MB Central
            </CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {emailAnalysis?.totalMaplebearUsers || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Usurios com email @maplebear ou @mbcentral
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Emails Externos
            </CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {emailAnalysis?.totalExternalUsers || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Usurios com email externo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Responsveis SAF
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safResponsibles.length}</div>
            <p className="text-xs text-muted-foreground">
              Possveis respons?veis SAF
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="emails" className="space-y-4">
        <TabsList>
          <TabsTrigger value="emails">Anlise de Emails</TabsTrigger>
          <TabsTrigger value="schools">Usurios por Escola</TabsTrigger>
          <TabsTrigger value="saf">Responsveis SAF</TabsTrigger>
        </TabsList>

        <TabsContent value="emails" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Emails Autorizados
                </CardTitle>
                <CardDescription>
                  Usurios com emails @maplebear, @mbcentral, @seb, @sebsa
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <div className="flex justify-between items-center">
                    <span>@maplebear / @mbcentral</span>
                    <Badge variant="outline">
                      {emailAnalysis?.totalMaplebearUsers || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>@seb</span>
                    <Badge variant="outline">
                      {emailAnalysis?.totalSebUsers || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>@sebsa</span>
                    <Badge variant="outline">
                      {emailAnalysis?.totalSebsaUsers || 0}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-warning">
                  <Mail className="h-5 w-5" />
                  Emails Externos
                </CardTitle>
                <CardDescription>
                  Usurios sem autorizao de licen?a
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning mb-2">
                  {emailAnalysis?.totalExternalUsers || 0}
                </div>
                <p className="text-sm text-muted-foreground">
                  Usurios que no deveriam ter acesso s licen?as Canva
                </p>
              </CardContent>
            </Card>
          </div>

          {emailAnalysis?.externalEmails &&
            emailAnalysis.externalEmails.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Lista de Emails Externos</CardTitle>
                  <CardDescription>
                    Usurios que precisam de reviso
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {emailAnalysis.externalEmails
                      .slice(0, 20)
                      .map((user, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center p-2 border rounded"
                        >
                          <div>
                            <span className="font-medium">
                              {user.name || "Sem nome"}
                            </span>
                            <p className="text-sm text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                          <Badge variant="secondary">
                            {user.school || "Sem escola"}
                          </Badge>
                        </div>
                      ))}
                    {emailAnalysis.externalEmails.length > 20 && (
                      <p className="text-sm text-muted-foreground text-center">
                        E mais {emailAnalysis.externalEmails.length - 20}{" "}
                        usu?rios...
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
        </TabsContent>

        <TabsContent value="schools" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Usurios por Escola
              </CardTitle>
              <CardDescription>
                Distribuio de usu?rios nas unidades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {Array.from(usersBySchool.entries())
                  .filter(([school]) => school.trim())
                  .sort(([, a], [, b]) => b.length - a.length)
                  .slice(0, 30)
                  .map(([school, schoolUsers], index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-2 border rounded"
                    >
                      <span className="font-medium">{school}</span>
                      <Badge variant="outline">
                        {schoolUsers.length} usu?rios
                      </Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="saf" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Responsveis SAF
              </CardTitle>
              <CardDescription>
                Consultores de cluster SAF por unidade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {safResponsibles.map((responsible, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">
                          {responsible.name || "Sem nome"}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {responsible.email}
                        </p>
                        {responsible.school && (
                          <p className="text-sm text-primary">
                            {responsible.school}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant={
                          responsible.email.includes("@seb")
                            ? "default"
                            : "secondary"
                        }
                      >
                        {responsible.role || "SAF"}
                      </Badge>
                    </div>
                  </div>
                ))}
                {safResponsibles.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum respons?vel SAF identificado
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserAnalytics;
