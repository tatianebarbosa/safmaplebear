import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import userService, { DevUser, AuditEntry } from "@/services/userService";
import { useToast } from "@/hooks/use-toast";

export default function AccessManagement() {
  const MIN_PASSWORD_LENGTH = 6;
  const [users, setUsers] = useState<DevUser[]>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "coord" | "user">("user");
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [showAudit, setShowAudit] = useState(false);
  const { toast } = useToast();

  const reload = () => setUsers(userService.listUsers());

  useEffect(() => {
    reload();
  }, []);

  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => u.role === "admin").length;
    const coords = users.filter((u) => u.role === "coord").length;
    const standard = total - admins - coords;
    return { total, admins, coords, standard };
  }, [users]);

  const handleCreate = () => {
    try {
      if (!username || !password) {
        toast({
          title: "Campos obrigatorios",
          description: "Preencha usuario e senha",
          variant: "destructive",
        });
        return;
      }
      if (password.length < MIN_PASSWORD_LENGTH) {
        toast({
          title: "Senha fraca",
          description: `Use ao menos ${MIN_PASSWORD_LENGTH} caracteres.`,
          variant: "destructive",
        });
        return;
      }
      userService.createUser(username, password, role);
      toast({
        title: "Usuario criado",
        description: `${username} criado com sucesso`,
      });
      setUsername("");
      setPassword("");
      setRole("user");
      reload();
    } catch (e: any) {
      toast({
        title: "Erro",
        description: e?.message || "Erro ao criar usuario",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm("Confirma exclusao deste usuario?")) return;
    try {
      const target = users.find((u) => u.id === id);
      if (target?.role === "admin") {
        toast({
          title: "Nao permitido",
          description: "Perfis de admin nao podem ser apagados.",
          variant: "destructive",
        });
        return;
      }
      userService.deleteUser(id);
      toast({ title: "Usuario excluido" });
      reload();
    } catch (e: any) {
      toast({
        title: "Erro",
        description: e?.message || "Erro ao excluir",
        variant: "destructive",
      });
    }
  };

  const handleChangePassword = (id: string) => {
    const newPass = prompt("Digite a nova senha (min. 6 caracteres):");
    if (!newPass) return;
    const cleanPass = newPass.trim();
    if (cleanPass.length < MIN_PASSWORD_LENGTH) {
      toast({
        title: "Senha muito curta",
        description: `Use ao menos ${MIN_PASSWORD_LENGTH} caracteres.`,
        variant: "destructive",
      });
      return;
    }
    try {
      userService.changePassword(id, cleanPass);
      toast({ title: "Senha alterada" });
      reload();
    } catch (e: any) {
      toast({
        title: "Erro",
        description: e?.message || "Erro ao trocar senha",
        variant: "destructive",
      });
    }
  };

  const loadAudit = () => {
    setAudit(userService.getAuditEntries(200));
    setShowAudit(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Gerenciamento de Acessos</CardTitle>
            <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
              <span className="rounded-full bg-primary/10 text-primary px-3 py-1">
                {stats.total} usuarios
              </span>
              <span className="rounded-full bg-muted px-3 py-1">
                {stats.admins} admins
              </span>
              <span className="rounded-full bg-muted px-3 py-1">
                {stats.coords} coord
              </span>
              <span className="rounded-full bg-muted px-3 py-1">
                {stats.standard} usuarios
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              placeholder="Usuario (email ou login)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Senha (min. 6 caracteres)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
            >
              <option value="user">Usuario</option>
              <option value="coord">Coordenacao</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <p className="text-xs text-muted-foreground">
            Dica: use senhas fortes e crie perfis apenas para quem precisa de acesso administrativo.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleCreate}>Criar Usuario</Button>
            <Button
              variant="outline"
              onClick={() => {
                setUsername("");
                setPassword("");
                setRole("user");
              }}
            >
              Limpar
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                if (!showAudit) loadAudit();
                setShowAudit((v) => !v);
              }}
            >
              {showAudit ? "Ocultar logs" : "Ver Logs (audit)"}
            </Button>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Usuarios</h3>
            <div className="overflow-auto max-h-80 rounded-lg border">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="py-3 px-3 font-semibold">Usuario</th>
                    <th className="px-3 font-semibold">Perfil</th>
                    <th className="px-3 font-semibold">Criado</th>
                    <th className="px-3 text-right font-semibold">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 && (
                    <tr>
                      <td className="py-6 px-3 text-muted-foreground" colSpan={4}>
                        Nenhum usuario cadastrado ainda.
                      </td>
                    </tr>
                  )}
                  {users.map((u) => (
                    <tr key={u.id} className="border-t">
                      <td className="py-3 px-3">{u.username}</td>
                      <td className="px-3">
                        <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-semibold capitalize">
                          {u.role === "coord" ? "Coordenador" : u.role}
                        </span>
                      </td>
                      <td className="px-3 whitespace-nowrap">
                        {new Date(u.createdAt).toLocaleString()}
                      </td>
                      <td className="text-right px-3 space-x-2 whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleChangePassword(u.id)}
                        >
                          Trocar Senha
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={u.role === "admin"}
                          onClick={() => handleDelete(u.id)}
                        >
                          Apagar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {showAudit && (
        <Card>
          <CardHeader>
            <CardTitle>Audit Log (ultimos eventos)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-80 overflow-auto">
              {audit.length === 0 ? (
                <p className="text-muted-foreground">Nenhum registro</p>
              ) : (
                audit.map((a) => (
                  <div key={a.id} className="p-3 border rounded">
                    <div className="text-xs text-muted-foreground">
                      {new Date(a.timestamp).toLocaleString()} • {a.actor}
                    </div>
                    <div className="font-medium">{a.action}</div>
                    {a.detail && <div className="text-sm">{a.detail}</div>}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
