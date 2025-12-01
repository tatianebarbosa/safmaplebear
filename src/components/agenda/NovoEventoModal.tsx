import { useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { CalendarEvent, CalendarEventInput } from "@/types/events";
import { format } from "date-fns";
import { Clock3, Save, X, AlertCircle } from "lucide-react";

interface NovoEventoModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: CalendarEventInput) => Promise<void>;
  defaultDate?: Date;
  loading?: boolean;
  editingEvent?: CalendarEvent | null;
}

const toLocalInput = (value?: string | Date | null) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  return format(date, "yyyy-MM-dd'T'HH:mm");
};

export const NovoEventoModal = ({
  open,
  onClose,
  onSubmit,
  defaultDate,
  loading,
  editingEvent,
}: NovoEventoModalProps) => {
  const [form, setForm] = useState({
    titulo: "",
    dataInicio: "",
    dataFim: "",
    descricao: "",
    tipo: "",
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      titulo: editingEvent?.titulo ?? "",
      dataInicio: toLocalInput(editingEvent?.dataInicio || defaultDate || new Date()),
      dataFim: toLocalInput(editingEvent?.dataFim || null),
      descricao: editingEvent?.descricao ?? "",
      tipo: editingEvent?.tipo ?? "",
    });
  }, [open, editingEvent, defaultDate]);

  const startDate = form.dataInicio ? new Date(form.dataInicio) : null;
  const endDate = form.dataFim ? new Date(form.dataFim) : null;
  const invalidRange = Boolean(startDate && endDate && endDate < startDate);
  const canSubmit = Boolean(form.titulo.trim() && form.dataInicio && !invalidRange);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const payload: CalendarEventInput = {
      titulo: form.titulo.trim(),
      dataInicio: new Date(form.dataInicio).toISOString(),
      dataFim: form.dataFim ? new Date(form.dataFim).toISOString() : undefined,
      descricao: form.descricao?.trim() || undefined,
      tipo: form.tipo?.trim() || undefined,
    };

    await onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => (!isOpen ? onClose() : null)}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Clock3 className="w-5 h-5 text-primary" />
            {editingEvent ? "Editar evento" : "Novo evento"}
          </DialogTitle>
          <DialogDescription>Cadastre os detalhes do compromisso na Agenda SAF.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="titulo">Titulo</Label>
            <Input
              id="titulo"
              className="h-11 text-base"
              value={form.titulo}
              onChange={(e) => setForm((prev) => ({ ...prev, titulo: e.target.value }))}
              placeholder="Reuniao, follow-up, treinamento..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="dataInicio">Data/hora inicial</Label>
              <Input
                id="dataInicio"
                type="datetime-local"
                className="h-11 text-base"
                step="900"
                value={form.dataInicio}
                onChange={(e) => setForm((prev) => ({ ...prev, dataInicio: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataFim">Data/hora final</Label>
              <Input
                id="dataFim"
                type="datetime-local"
                className="h-11 text-base"
                step="900"
                value={form.dataFim}
                min={form.dataInicio || undefined}
                onChange={(e) => setForm((prev) => ({ ...prev, dataFim: e.target.value }))}
              />
              {invalidRange && (
                <div className="flex items-center gap-2 text-xs text-destructive">
                  <AlertCircle className="w-3 h-3" />
                  <span>Data final n?o pode ser anterior ao inicio.</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo</Label>
            <Input
              id="tipo"
              className="h-11 text-base"
              value={form.tipo}
              onChange={(e) => setForm((prev) => ({ ...prev, tipo: e.target.value }))}
              placeholder="Visita, Ligacao, Workshop..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descricao</Label>
            <Textarea
              id="descricao"
              className="text-base"
              value={form.descricao}
              onChange={(e) => setForm((prev) => ({ ...prev, descricao: e.target.value }))}
              placeholder="Contexto, links, participantes..."
              rows={5}
            />
          </div>

          <DialogFooter className="flex items-center justify-between gap-2">
            <Button type="button" variant="ghost" onClick={onClose} className="gap-2">
              <X className="w-4 h-4" />
              Cancelar
            </Button>
            <Button type="submit" className="gap-2" disabled={loading || !canSubmit}>
              <Save className="w-4 h-4" />
              {editingEvent ? "Salvar alterações" : "Salvar evento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
