import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { School } from "@/types/schoolLicense";
import { dialogLayouts } from "./dialogLayouts";

type TransferPayload = {
  sourceSchoolId: string;
  sourceUserId: string;
  targetSchoolId: string;
  targetUserId: string;
  reason: string;
  performedBy: string;
};

interface QuickTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schools: School[];
  onTransfer: (payload: TransferPayload) => void;
}

export const QuickTransferDialog = ({
  open,
  onOpenChange,
  schools,
  onTransfer,
}: QuickTransferDialogProps) => {
  const [form, setForm] = useState({
    sourceSchoolId: "",
    sourceUserId: "",
    targetSchoolId: "",
    targetUserId: "",
    reason: "",
    performedBy: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const sourceSchool = useMemo(
    () => schools.find((s) => s.id === form.sourceSchoolId),
    [schools, form.sourceSchoolId]
  );
  const targetSchool = useMemo(
    () => schools.find((s) => s.id === form.targetSchoolId),
    [schools, form.targetSchoolId]
  );

  const sourceUsers = sourceSchool?.users ?? [];
  const targetUsers = targetSchool?.users ?? [];

  const userOptions = useMemo(() => {
    const map = new Map<string, string>();
    schools.forEach((school) => {
      (school.users || []).forEach((user) => {
        const key = user.email || user.id || user.name;
        if (!key) return;
        if (!map.has(key)) {
          const label = user.email ? `${user.name} - ${user.email}` : user.name;
          map.set(key, label);
        }
      });
    });
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [schools]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "sourceSchoolId" ? { sourceUserId: "" } : {}),
      ...(field === "targetSchoolId" ? { targetUserId: "" } : {}),
    }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.sourceSchoolId) nextErrors.sourceSchoolId = "Escolha a escola de origem";
    if (!form.sourceUserId) nextErrors.sourceUserId = "Escolha quem vai ceder a licen?a";
    if (!form.targetSchoolId) nextErrors.targetSchoolId = "Escolha a escola destino";
    if (!form.targetUserId) nextErrors.targetUserId = "Escolha quem recebera a licen?a";
    if (form.sourceSchoolId && form.sourceSchoolId === form.targetSchoolId) {
      nextErrors.targetSchoolId = "Origem e destino precisam ser diferentes";
    }
    if (!form.reason.trim()) nextErrors.reason = "Informe o motivo da transferencia";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    onTransfer({
      sourceSchoolId: form.sourceSchoolId,
      sourceUserId: form.sourceUserId,
      targetSchoolId: form.targetSchoolId,
      targetUserId: form.targetUserId,
      reason: form.reason,
      performedBy: form.performedBy || "Portal SAF",
    });
  };

  const resetState = () => {
    setForm({
      sourceSchoolId: "",
      sourceUserId: "",
      targetSchoolId: "",
      targetUserId: "",
      reason: "",
      performedBy: "",
    });
    setErrors({});
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) resetState();
      }}
    >
      <DialogContent className={`${dialogLayouts.md} flex flex-col`}>
        <DialogHeader>
          <DialogTitle>Transferencia rapida de licen?a</DialogTitle>
          <DialogDescription>
            Troque a licen?a entre escolas em um unico passo. Registramos o motivo e quem realizou.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Escola de origem</Label>
              <Select
                value={form.sourceSchoolId}
                onValueChange={(value) => handleChange("sourceSchoolId", value)}
              >
                <SelectTrigger className={errors.sourceSchoolId ? "border-destructive" : ""}>
                  <SelectValue placeholder="Escolha a escola" />
                </SelectTrigger>
                <SelectContent>
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={school.id}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.sourceSchoolId && (
                <p className="text-xs text-destructive">{errors.sourceSchoolId}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Usu?rio que vai ceder</Label>
              <Select
                value={form.sourceUserId}
                onValueChange={(value) => handleChange("sourceUserId", value)}
                disabled={!sourceUsers.length}
              >
                <SelectTrigger className={errors.sourceUserId ? "border-destructive" : ""}>
                  <SelectValue placeholder="Selecione o usu?rio" />
                </SelectTrigger>
                <SelectContent>
                  {sourceUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} - {user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.sourceUserId && (
                <p className="text-xs text-destructive">{errors.sourceUserId}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Escola destino</Label>
              <Select
                value={form.targetSchoolId}
                onValueChange={(value) => handleChange("targetSchoolId", value)}
              >
                <SelectTrigger className={errors.targetSchoolId ? "border-destructive" : ""}>
                  <SelectValue placeholder="Escolha a escola" />
                </SelectTrigger>
                <SelectContent>
                  {schools
                    .filter((school) => school.id !== form.sourceSchoolId)
                    .map((school) => (
                      <SelectItem key={school.id} value={school.id}>
                        {school.name} ({school.usedLicenses}/{school.totalLicenses})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {errors.targetSchoolId && (
                <p className="text-xs text-destructive">{errors.targetSchoolId}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Usu?rio que vai receber</Label>
              <Select
                value={form.targetUserId}
                onValueChange={(value) => handleChange("targetUserId", value)}
                disabled={!targetUsers.length}
              >
                <SelectTrigger className={errors.targetUserId ? "border-destructive" : ""}>
                  <SelectValue placeholder="Selecione o usu?rio" />
                </SelectTrigger>
                <SelectContent>
                  {targetUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} - {user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.targetUserId && (
                <p className="text-xs text-destructive">{errors.targetUserId}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Motivo</Label>
              <Textarea
                value={form.reason}
                onChange={(e) => handleChange("reason", e.target.value)}
                placeholder="Ex.: transferencia solicitada por ticket #123, turma encerrada, nova turma precisando de acesso."
                className={errors.reason ? "border-destructive" : ""}
                rows={3}
              />
              {errors.reason && (
                <p className="text-xs text-destructive">{errors.reason}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Responsavel</Label>
              <Select
                value={form.performedBy}
                onValueChange={(value) => handleChange("performedBy", value)}
                disabled={!userOptions.length}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um usuário do site" />
                </SelectTrigger>
                <SelectContent>
                  {userOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Transferir agora</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
