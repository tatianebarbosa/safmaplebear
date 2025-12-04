import React, { useEffect, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Ticket } from '@/types/tickets';
import { format, differenceInDays } from 'date-fns';
import { MoreVertical, Edit, CheckCircle, Tag as TagIcon } from 'lucide-react';
import { getAgentDisplayName } from '@/data/teamMembers';
import { useTicketStore } from '@/stores/ticketStore';
import { normalizeTicketId } from '@/lib/stringUtils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TicketCardProps {
  ticket: Ticket;
  canManage: boolean;
  onOpenDetails?: (ticket: Ticket) => void;
  onResolve?: (ticket: Ticket) => void;
}

export const TicketCard = ({ ticket, canManage, onOpenDetails, onResolve }: TicketCardProps) => {
  const { updateTicket } = useTicketStore();
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState(ticket.observacao || "");
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: ticket.id,
    data: { type: "ticket", status: ticket.status },
    resizeObserverConfig: { disabled: true },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getSLABadge = () => {
    return null; // manter apenas o alerta vermelho de atraso
  };

  const getDueDateBadge = () => {
    if (!ticket.dueDate) return null;
    
    const now = new Date();
    const due = new Date(ticket.dueDate);
    const diffDays = differenceInDays(due, now);
    
    if (diffDays < 0) {
      return <Badge variant="destructive" className="text-xs">Atraso {Math.abs(diffDays)}d</Badge>;
    }
    return null; // somente badge vermelha de atraso
  };

  const handleResolve = () => {
    onResolve?.(ticket);
  };

  const agentLabel = getAgentDisplayName(ticket.agente);
  const displayId = normalizeTicketId(ticket.id);

  useEffect(() => {
    setDescDraft(ticket.observacao || "");
    setIsEditingDesc(false);
  }, [ticket.id, ticket.observacao]);

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDescDraft(ticket.observacao || "");
    setIsEditingDesc(true);
  };

  const saveDesc = () => {
    const trimmed = descDraft.trim();
    if (trimmed && trimmed !== ticket.observacao) {
      updateTicket(ticket.id, { observacao: trimmed });
    }
    setIsEditingDesc(false);
  };

  const cancelEdit = () => {
    setDescDraft(ticket.observacao || "");
    setIsEditingDesc(false);
  };

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50' : ''
      } cursor-grab active:cursor-grabbing`}
      {...attributes}
      {...listeners}
      onClick={() => {
        if (isEditingDesc) return;
        onOpenDetails?.(ticket);
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="inline-flex items-center gap-1.5 font-mono text-sm font-semibold px-3 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive/60 shadow-inner">
          <TagIcon className="h-3.5 w-3.5" />
          {displayId}
        </span>
        <div className="flex items-center gap-1">
          {getSLABadge()}
          {getDueDateBadge()}
          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Edit className="h-3 w-3 mr-2" />
                  Editar
                </DropdownMenuItem>
                {ticket.status !== 'Resolvido' && (
                  <DropdownMenuItem onClick={handleResolve}>
                    <CheckCircle className="h-3 w-3 mr-2" />
                    Resolver
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      
      <p className="text-sm text-muted-foreground mb-3">
        {isEditingDesc ? (
          <textarea
            className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground"
            autoFocus
            value={descDraft}
            onChange={(e) => setDescDraft(e.target.value)}
            onBlur={saveDesc}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                saveDesc();
              }
              if (e.key === 'Escape') {
                e.preventDefault();
                cancelEdit();
              }
            }}
          />
        ) : (
          <span onDoubleClick={startEdit} className="block">
            {ticket.observacao}
          </span>
        )}
      </p>
      
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-medium">{agentLabel}</span>
        <span>{format(new Date(ticket.updatedAt), 'dd/MM')}</span>
      </div>
      
      {ticket.tags && ticket.tags.length > 0 && (
        <div className="flex gap-1 mt-2 flex-wrap">
          {ticket.tags.map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  );
};
