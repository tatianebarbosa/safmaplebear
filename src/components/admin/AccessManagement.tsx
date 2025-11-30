import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import userService, { DevUser, AuditEntry } from "@/services/userService";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/authStore";
import { getAgentDisplayName } from "@/data/teamMembers";

export default function AccessManagement() {
  const MIN_PASSWORD_LENGTH = 6;
  const [users, setUsers] = useState<DevUser[]>([]);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "coord" | "user">("user");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [showAudit, setShowAudit] = useState(false);
  const { toast } = useToast();
  const { hasRole } = useAuthStore();
  const canManageAccess = hasRole("Admin") || hasRole("Coordinator");

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
    if (!canManageAccess) {
      toast({
        title: "Sem permissao",
        description: "Somente Coordenadores e Admin podem criar usuarios.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (!username || !password || !fullName.trim()) {
        toast({
          title: "Campos obrigatorios",
          description: "Preencha usuario, nome completo e senha",
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
      userService.createUser(username, password, role, fullName.trim());
      toast({
        title: "Usuario criado",
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
        description: e?.message || "Erro ao criar usuario",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (id: string) => {
    if (!canManageAccess) {
      toast({
        title: "Sem permissao",
        description: "Somente Coordenadores e Admin podem excluir usuarios.",
        variant: "destructive",
      });
      return;
    }
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
    if (!canManageAccess) {
      toast({
        title: "Sem permissao",
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

  if (!canManageAccess) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex w-full items-center justify-end gap-2 py-2 flex-wrap">
        <Button onClick={() => setIsCreateOpen(true)}>Criar Usuario</Button>
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

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                placeholder="Usuario (login)"
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
                <option value="user">Usuario</option>
                <option value="coord">Coordenacao</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <p className="text-xs text-muted-foreground">
              Dica: use o usuario (ex: joao.felipe) em vez de email e crie senhas fortes apenas para quem precisa de acesso administrativo.
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
            <Button onClick={handleCreate}>Criar Usuario</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div>
        <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
          <h3 className="font-semibold">Usuarios</h3>
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
        <div className="overflow-auto max-h-[70vh] rounded-lg border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="py-3 px-3 font-semibold">Responsável (nome completo)</th>
                <th className="px-3 font-semibold">Usuario</th>
                <th className="px-3 font-semibold">Perfil</th>
                <th className="px-3 font-semibold">Criado</th>
                <th className="px-3 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td className="py-6 px-3 text-muted-foreground" colSpan={5}>
                    Nenhum usuario cadastrado ainda.
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

      {showAudit && (
        <div className="space-y-2 max-h-80 overflow-auto rounded-lg border p-3">
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
      )}
    </div>
  );
}
