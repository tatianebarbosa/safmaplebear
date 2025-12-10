import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import userService, { DevUser, AuditEntry } from "@/services/userService";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/authStore";
import { getAgentDisplayName } from "@/data/teamMembers";

export default function AccessManagement() {
  const MIN_PASSWORD_LENGTH = 6;
  const [users, setUsers] = useState<DevUser[]>([]);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "coord" | "user">("user");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { toast } = useToast();
  const { hasRole, currentUser } = useAuthStore();
  const canManageAccess = hasRole("Admin") || hasRole("Coordinator");

  const actorName =
    currentUser?.name?.trim() ||
    currentUser?.email ||
    localStorage.getItem("userEmail") ||
    "Portal SAF";

  const actorFullName =
    currentUser?.name?.trim() ||
    getAgentDisplayName(currentUser?.agente as any) ||
    actorName;

  const actorRole =
    (currentUser?.role || "")
      .toLowerCase()
      .replace("coordinator", "coord")
      .replace("admin", "admin") || "user";

  const looksLikeEmail = (value?: string) => !!value && /\S+@\S+\.\S+/.test(value);

  const reload = () => {
    setUsers(userService.listUsers());
    setAuditEntries(userService.getAuditEntries());
  };

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
    if (!canManageAccess) {
      toast({
        title: "Sem permissão",
        description: "Somente Coordenadores e Admin podem criar usuários.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (!username || !password || !fullName.trim()) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha usuário, nome completo e senha",
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
      userService.createUser(
        username,
        password,
        role,
        fullName.trim(),
        actorFullName,
        actorRole
      );
      toast({
        title: "Usuário criado",
        description: `${username} criado com sucesso`,
      });
      setUsername("");
      setFullName("");
      setPassword("");
      setRole("user");
      setIsCreateOpen(false);
      reload();
    } catch (e: any) {
      toast({
        title: "Erro",
        description: e?.message || "Erro ao criar usuário",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (id: string) => {
    if (!canManageAccess) {
      toast({
        title: "Sem permissão",
        description: "Somente Coordenadores e Admin podem excluir usuários.",
        variant: "destructive",
      });
      return;
    }
    if (!confirm("Confirma exclusão deste usuário?")) return;
    try {
      const target = users.find((u) => u.id === id);
      if (target?.role === "admin") {
        toast({
          title: "Não permitido",
          description: "Perfis de admin não podem ser apagados.",
          variant: "destructive",
        });
        return;
      }
      userService.deleteUser(id, actorFullName, actorRole);
      toast({ title: "Usuário excluído" });
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
    if (!canManageAccess) {
      toast({
        title: "Sem permissão",
        description: "Somente Coordenadores e Admin podem trocar senhas.",
        variant: "destructive",
      });
      return;
    }
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
      userService.changePassword(id, cleanPass, actorFullName, actorRole);
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

  if (!canManageAccess) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex w-full items-center justify-end gap-3 py-2">
        <Button onClick={() => setIsCreateOpen(true)}>Criar usuário</Button>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                placeholder="Usuário (login)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <Input
                placeholder="Nome completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
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
                <option value="user">Usuário</option>
                <option value="coord">Coordenação</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <p className="text-xs text-muted-foreground">
              Dica: use o usuário (ex: joao.felipe) em vez de email e crie senhas fortes apenas para quem precisa de acesso administrativo.
            </p>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setUsername("");
                setFullName("");
                setPassword("");
                setRole("user");
              }}
            >
              Limpar
            </Button>
            <Button onClick={handleCreate}>Criar Usuário</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div>
        <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
          <h3 className="font-semibold">Usuários</h3>
          <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
            <span className="rounded-full bg-primary/10 text-primary px-3 py-1">
              {stats.total} usuários
            </span>
            <span className="rounded-full bg-muted px-3 py-1">
              {stats.admins} admins
            </span>
            <span className="rounded-full bg-muted px-3 py-1">
              {stats.coords} coord
            </span>
            <span className="rounded-full bg-muted px-3 py-1">
              {stats.standard} usuários
            </span>
          </div>
        </div>
        <div className="overflow-auto max-h-[70vh] rounded-lg border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="py-3 px-3 font-semibold">Responsável (nome completo)</th>
                <th className="px-3 font-semibold">Usuário</th>
                <th className="px-3 font-semibold">Perfil</th>
                <th className="px-3 font-semibold">Criado</th>
                <th className="px-3 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td className="py-6 px-3 text-muted-foreground" colSpan={5}>
                    Nenhum usuário cadastrado ainda.
                  </td>
                </tr>
              )}
              {users.map((u) => {
                const displayName = u.fullName?.trim() || getAgentDisplayName(u.username) || u.username;
                return (
                  <tr key={u.id} className="border-t">
                    <td className="py-3 px-3">
                      <span className="font-semibold">{displayName}</span>
                    </td>
                    <td className="px-3">{u.username}</td>
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
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Card className="border">
        <CardHeader>
          <CardTitle>Histórico de alterações</CardTitle>
          <CardDescription />
        </CardHeader>
        <CardContent className="space-y-3">
          {auditEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma alteração registrada.</p>
          ) : (
            <div className="space-y-3 max-h-[520px] overflow-y-auto rounded-lg border border-border/70 bg-muted/30 p-2 pr-3">
              {auditEntries.slice(0, 40).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start justify-between gap-3 rounded-md border px-3 py-2 text-sm"
                >
                  <div className="space-y-1">
                    <div className="font-semibold uppercase text-xs tracking-wide text-muted-foreground">
                      {entry.action.replace(/_/g, " ")}
                    </div>
                    {entry.detail && (
                      <div className="text-muted-foreground">{entry.detail}</div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {(() => {
                        const display =
                          getAgentDisplayName(entry.actor?.split("@")[0] || "") ||
                          entry.actor ||
                          "Desconhecido";
                        const email = looksLikeEmail(entry.actor) ? entry.actor : "";
                        return `Por ${display}${email ? ` (${email})` : ""}${
                          entry.actorRole ? ` - ${entry.actorRole}` : ""
                        }`;
                      })()}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(entry.timestamp).toLocaleString("pt-BR")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
