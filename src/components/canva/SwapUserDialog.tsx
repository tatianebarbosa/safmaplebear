import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { School, SchoolUser, UserRole } from "@/types/schoolLicense";
import { useSchoolLicenseStore } from "@/stores/schoolLicenseStore";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ShieldCheck, ArrowLeftRight } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";

interface SwapUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: {
    mode: "internal" | "cross-school";
    newUser?: { name: string; email: string; role: UserRole };
    targetSchoolId?: string;
    targetUserId?: string;
    createTargetFromOutgoing?: boolean;
    reason: string;
    performedBy: string;
    ticketNumber: string;
  }) => void;
  users: SchoolUser[];
  selectedUserId: string | null;
  onUserChange: (userId: string) => void;
  currentSchoolId: string;
}

export const SwapUserDialog = ({
  open,
  onOpenChange,
  onConfirm,
  users,
  selectedUserId,
  onUserChange,
  currentSchoolId,
}: SwapUserDialogProps) => {
  const [formData, setFormData] = useState({
    newName: "",
    newEmail: "",
    newRole: "Estudante" as UserRole,
    reason: "",
    performedBy: "",
    ticketNumber: "",
  });
  const [errors, setErrors] = useState<any>({});
  const [transferMode, setTransferMode] = useState<"internal" | "cross-school">("internal");
  const [targetSchoolId, setTargetSchoolId] = useState<string>("");
  const [targetUserId, setTargetUserId] = useState<string>("");

  const { isEmailValid, schools } = useSchoolLicenseStore();
  const formatSchoolOptionLabel = useCallback((school: School) => {
    const name = school.name || "";
    const city = (school.city || "").trim();
    if (!city) return name;
    const alreadyHasCity = name.toLowerCase().includes(city.toLowerCase());
    return alreadyHasCity ? name : `${name} - ${city}`;
  }, []);

  const resetForm = () => {
    setFormData({
      newName: "",
      newEmail: "",
      newRole: "Estudante",
      reason: "",
      performedBy: "",
      ticketNumber: "",
    });
    setErrors({});
    setTargetSchoolId("");
    setTargetUserId("");
    setTransferMode("internal");
  };

  const validateForm = () => {
    const newErrors: any = {};

    if (transferMode === "internal") {
      if (!formData.newName.trim()) {
        newErrors.newName = "Nome eh obrigatorio";
      }

      if (!formData.newEmail.trim()) {
        newErrors.newEmail = "E-mail eh obrigatorio";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.newEmail)) {
        newErrors.newEmail = "E-mail invalido";
      }
    } else {
      if (!targetSchoolId) {
        newErrors.targetSchoolId = "Escolha a escola de destino";
      }
      // Quando a escola nao tem usuarios, vamos criar automaticamente usando o usuario atual.
      if (!selectedTargetUserId && targetSchoolUsers.length > 0) {
        newErrors.targetUserId = "A escola destino precisa ter um usuario para receber a licenca.";
      }
    }

    if (!formData.reason.trim()) {
      newErrors.reason = "Motivo eh obrigatorio";
    }
    if (!formData.performedBy.trim()) {
      newErrors.performedBy = "Solicitante eh obrigatorio";
    }
    if (!formData.ticketNumber.trim()) {
      newErrors.ticketNumber = "Numero do ticket eh obrigatorio";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !outgoingUser) return;

    if (transferMode === "cross-school") {
      onConfirm({
        mode: "cross-school",
        targetSchoolId,
        targetUserId: selectedTargetUserId || undefined,
        createTargetFromOutgoing: !selectedTargetUserId && targetSchoolUsers.length === 0,
        reason: formData.reason,
        performedBy: formData.performedBy,
        ticketNumber: formData.ticketNumber,
      });
    } else {
      onConfirm({
        mode: "internal",
        newUser: {
          name: formData.newName,
          email: formData.newEmail,
          role: formData.newRole,
        },
        reason: formData.reason,
        performedBy: formData.performedBy,
        ticketNumber: formData.ticketNumber,
      });
    }
    resetForm();
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: "" }));
    }
  };

  const emailCompliant = formData.newEmail ? isEmailValid(formData.newEmail) : true;
  const userOptions = useMemo(
    () =>
      users.map((user) => ({
        value: user.id,
        label: `${user.name} - ${user.email}`,
      })),
    [users]
  );
  const destinationSchools = useMemo(
    () => (schools || []).filter((s) => s.id !== currentSchoolId),
    [schools, currentSchoolId]
  );
  const destinationSchoolOptions = useMemo(
    () =>
      destinationSchools.map((school) => ({
        value: school.id,
        label: formatSchoolOptionLabel(school),
      })),
    [destinationSchools, formatSchoolOptionLabel]
  );
  const selectedTargetSchool = useMemo(
    () => destinationSchools.find((s) => s.id === targetSchoolId),
    [destinationSchools, targetSchoolId]
  );
  const targetSchoolUsers = useMemo(
    () => selectedTargetSchool?.users || [],
    [selectedTargetSchool]
  );
  const selectedTargetUserId =
    targetUserId || targetSchoolUsers[0]?.id || "";
  const selectedTargetUser = useMemo(
    () =>
      targetSchoolUsers.find((u) => u.id === selectedTargetUserId) ||
      targetSchoolUsers[0] ||
      null,
    [targetSchoolUsers, selectedTargetUserId]
  );
  const canSubmit = useMemo(() => {
    const baseOk =
      formData.reason.trim().length > 3 &&
      formData.performedBy.trim().length > 2 &&
      formData.ticketNumber.trim().length > 1;

    if (transferMode === "cross-school") {
      const hasRecipient = !!selectedTargetUserId || targetSchoolUsers.length === 0;
      return baseOk && !!targetSchoolId && hasRecipient;
    }

    return (
      baseOk &&
      formData.newName.trim().length > 2 &&
      formData.newEmail.trim().length > 5 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.newEmail)
    );
  }, [formData, transferMode, targetSchoolId, selectedTargetUserId]);

  const outgoingUser = useMemo(() => {
    if (!users?.length) return null;
    const user = users.find((u) => u.id === selectedUserId);
    return user || users[0];
  }, [users, selectedUserId]);

  useEffect(() => {
    if (open && !selectedUserId && users?.length) {
      onUserChange(users[0].id);
    }
  }, [open, selectedUserId, users, onUserChange]);

  useEffect(() => {
    if (!targetSchoolId) {
      setTargetUserId("");
      return;
    }
    setTargetUserId(targetSchoolUsers[0]?.id || "");
    if (errors.targetUserId) {
      setErrors((prev: any) => ({ ...prev, targetUserId: "" }));
    }
  }, [targetSchoolId, targetSchoolUsers, errors.targetUserId]);

  if (!users?.length) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) resetForm();
      }}
    >
      <DialogContent className="w-full max-w-3xl sm:max-w-3xl md:max-w-3xl max-h-[88vh] overflow-y-auto overflow-x-hidden gap-3 glass-scrollbar pb-5">
        <DialogHeader>
          <DialogTitle>Trocar usuario</DialogTitle>
          <DialogDescription>
            Substitua o usuario atual. Vamos registrar a transferencia no historico para auditoria e reversao.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Button
            type="button"
            variant={transferMode === "internal" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setTransferMode("internal");
              setTargetSchoolId("");
              setTargetUserId("");
            }}
          >
            Dentro da escola
          </Button>
          <Button
            type="button"
            variant={transferMode === "cross-school" ? "default" : "outline"}
            size="sm"
            onClick={() => setTransferMode("cross-school")}
          >
            Entre escolas
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="outgoingUser">Quem vai liberar a licenca</Label>
          <Combobox
            options={userOptions}
            value={outgoingUser?.id || ""}
            onValueChange={(value) => {
              if (value) onUserChange(value);
            }}
            placeholder="Buscar por nome ou email"
            searchPlaceholder="Digite para filtrar usuarios"
            emptyMessage="Nenhum usuario encontrado"
            className="rounded-lg border-border/70 bg-background text-left"
          />
        </div>

        {transferMode === "cross-school" && (
          <div className="space-y-3 rounded-xl border border-border/60 bg-gradient-to-r from-muted/60 via-muted/40 to-muted/20 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ArrowLeftRight className="h-4 w-4 text-primary" />
              <span>Transferir licenca para outra escola</span>
            </div>
            <div className="space-y-2">
              <Label>Escola destino</Label>
              <Combobox
                options={destinationSchoolOptions}
                value={targetSchoolId}
                onValueChange={(value) => {
                  setTargetSchoolId(value);
                }}
                placeholder="Buscar escola por nome ou cidade"
                searchPlaceholder="Digite para filtrar escolas"
                emptyMessage="Nenhuma escola encontrada"
                className="rounded-lg border-border/70 bg-background text-left"
              />
      {errors.targetSchoolId && <p className="text-sm text-destructive">{errors.targetSchoolId}</p>}
      {targetSchoolId && !selectedTargetUserId && !errors.targetSchoolId && (
        <p className="text-sm text-muted-foreground">
          Esta escola nao possui usuarios cadastrados. Vamos criar automaticamente um usuario com base em quem esta liberando a licenca.
        </p>
      )}
      {selectedTargetUser && (
        <p className="text-xs text-muted-foreground">
          Usuario alvo: <span className="font-medium text-foreground">{selectedTargetUser.name}</span> (
                  {selectedTargetUser.email})
                </p>
              )}
              {errors.targetUserId && <p className="text-sm text-destructive">{errors.targetUserId}</p>}
            </div>

          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {transferMode === "internal" && (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="newName">Novo nome</Label>
                <Input
                  id="newName"
                  value={formData.newName}
                  onChange={(e) => handleChange("newName", e.target.value)}
                  placeholder="Nome completo do novo usuario"
                  className={errors.newName ? "border-destructive" : ""}
                />
                {errors.newName && <p className="text-sm text-destructive">{errors.newName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newEmail">Novo e-mail</Label>
                <Input
                  id="newEmail"
                  type="email"
                  value={formData.newEmail}
                  onChange={(e) => handleChange("newEmail", e.target.value)}
                  placeholder="usuario@maplebear.com.br"
                  className={errors.newEmail ? "border-destructive" : ""}
                />
                {errors.newEmail && <p className="text-sm text-destructive">{errors.newEmail}</p>}
                {formData.newEmail && (
                  <div className="flex items-center gap-2">
                    <Badge variant={emailCompliant ? "success" : "destructive"}>
                      {emailCompliant ? "Conforme" : "Fora da politica"}
                    </Badge>
                    {!emailCompliant && (
                      <p className="text-xs text-muted-foreground">Dominio deve conter "maplebear".</p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newRole">Nova funcao</Label>
                <Select value={formData.newRole} onValueChange={(value: UserRole) => handleChange("newRole", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a funcao" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Estudante">Estudante</SelectItem>
                    <SelectItem value="Professor">Professor</SelectItem>
                    <SelectItem value="Administrador">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="performedBy">Solicitante (quem pediu)</Label>
              <Input
                id="performedBy"
                value={formData.performedBy}
                onChange={(e) => handleChange("performedBy", e.target.value)}
                placeholder="Nome de quem solicitou"
                className={errors.performedBy ? "border-destructive" : ""}
              />
              {errors.performedBy && <p className="text-sm text-destructive">{errors.performedBy}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticketNumber">Ticket/Email (referencia) *</Label>
              <Input
                id="ticketNumber"
                value={formData.ticketNumber}
                onChange={(e) => handleChange("ticketNumber", e.target.value)}
                placeholder="Numero do ticket ou titulo do e-mail"
                className={errors.ticketNumber ? "border-destructive" : ""}
              />
              {errors.ticketNumber && <p className="text-sm text-destructive">{errors.ticketNumber}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo da troca</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => handleChange("reason", e.target.value)}
              placeholder="Explique por que esta licenca deve ser transferida"
              rows={3}
              className={errors.reason ? "border-destructive" : ""}
            />
            {errors.reason && <p className="text-sm text-destructive">{errors.reason}</p>}
          </div>

          <div className="rounded-md border border-border/60 bg-muted/30 p-3 text-xs space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Esta troca sera registrada no historico e pode ser revertida.</span>
            </div>
            <div className="flex items-start gap-2 text-muted-foreground">
              <AlertTriangle className="h-4 w-4 mt-0.5" />
              <span>Informe ticket e solicitante para auditoria.</span>
            </div>
          </div>

          <DialogFooter className="sticky bottom-0 left-0 right-0 bg-background pt-3 pb-2 px-6 border-t border-border/60">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              Confirmar troca
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
