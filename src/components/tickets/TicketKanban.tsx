import { useRef, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Ticket, TicketStatus } from '@/types/tickets';
import { TicketCard } from './TicketCard';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { getAgentDisplayName } from '@/data/teamMembers';
import { useTicketStatusJustification } from '@/hooks/useTicketStatusJustification';

interface TicketKanbanProps {
  tickets: Ticket[];
  onOpenDetails?: (ticket: Ticket) => void;
}

const columns: { status: TicketStatus; title: string; icon: any; color: string }[] = [
  { status: 'Pendente', title: 'Pendente', icon: Clock, color: 'bg-orange-100 border-orange-200' },
  { status: 'Em andamento', title: 'Em Andamento', icon: AlertTriangle, color: 'bg-blue-100 border-blue-200' },
  { status: 'Resolvido', title: 'Resolvido', icon: CheckCircle, color: 'bg-green-100 border-green-200' }
];

export const TicketKanban = ({ tickets, onOpenDetails }: TicketKanbanProps) => {
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const { requestStatusChange, justificationDialog } = useTicketStatusJustification();
  const columnRefs = useRef<Record<TicketStatus, HTMLElement | null>>({
    Pendente: null,
    'Em andamento': null,
    Resolvido: null,
  });
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 0,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const ticket = tickets.find(t => t.id === event.active.id);
    setActiveTicket(ticket || null);
  };

  const getStatusFromOver = (over: DragEndEvent["over"]) => {
    if (!over) return null;
    const overId = over.id as string;
    const overData = over.data?.current as { status?: TicketStatus; type?: string; sortable?: { containerId?: string } } | undefined;
    const containerFromSortable = overData?.sortable?.containerId as TicketStatus | undefined;
    const statusFromData = overData?.status;
    const statusFromId = columns.find((column) => column.status === overId)?.status;
    // Se estiver sobre outro ticket, usamos o containerId da sortable para pegar a coluna alvo
    return statusFromData || containerFromSortable || statusFromId || null;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTicket(null);

    if (!over) return;

    const ticket = tickets.find(t => t.id === active.id);
    if (!ticket) return;

    let overStatus = getStatusFromOver(over);

    // Fallback: se o DnD não identificar claramente a coluna de destino, usamos a posição final do card
    if (!overStatus) {
      type RectLike = {
        left: number;
        right: number;
        top: number;
        bottom: number;
        width: number;
        height: number;
      };
      const toRect = (rect: typeof active.rect.current): RectLike | null => {
        if (!rect) return null;
        const pick = (r: any) => ({
          left: r.left,
          right: r.right,
          top: r.top,
          bottom: r.bottom,
          width: r.width,
          height: r.height,
        });
        if ("left" in rect) return pick(rect);
        const fallback = rect.translated ?? rect.initial ?? null;
        return fallback ? pick(fallback) : null;
      };

      const translatedRect = toRect(active.rect?.current);
      if (translatedRect) {
        const centerX = translatedRect.left + translatedRect.width / 2;
        const centerY = translatedRect.top + translatedRect.height / 2;
        (Object.entries(columnRefs.current) as [TicketStatus, HTMLElement | null][]).forEach(
          ([status, el]) => {
            if (el) {
              const rect = el.getBoundingClientRect();
              const within =
                centerX >= rect.left &&
                centerX <= rect.right &&
                centerY >= rect.top &&
                centerY <= rect.bottom;
              if (within) {
                overStatus = status;
              }
            }
          }
        );
      }
    }

    if (!overStatus || ticket.status === overStatus) return;

    requestStatusChange(ticket, overStatus);
  };

  const getTicketsByStatus = (status: TicketStatus) => {
    return tickets.filter(ticket => ticket.status === status);
  };

  const getSLABadge = (diasAberto: number) => {
    if (diasAberto >= 15) {
      return <Badge variant="destructive" className="text-xs">Crtico {diasAberto}d</Badge>;
    }
    if (diasAberto >= 8) {
      return <Badge variant="warning" className="text-xs">Ateno {diasAberto}d</Badge>;
    }
    return <Badge variant="outline" className="text-xs">{diasAberto}d</Badge>;
  };

  const getDueDateBadge = (dueDate?: string) => {
    if (!dueDate) return null;
    
    const now = new Date();
    const due = new Date(dueDate);
    const diffDays = differenceInDays(due, now);
    
    if (diffDays < 0) {
      return <Badge variant="destructive" className="text-xs">Atraso {Math.abs(diffDays)}d</Badge>;
    }
    if (diffDays === 0) {
      return <Badge variant="warning" className="text-xs">Vence hoje</Badge>;
    }
    if (diffDays <= 3) {
      return <Badge variant="info" className="text-xs">Vence em {diffDays}d</Badge>;
    }
    
    return null;
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {columns.map((column) => {
          const columnTickets = getTicketsByStatus(column.status);
          const Icon = column.icon;
          const { setNodeRef: setColumnRef } = useDroppable({
            id: column.status,
            data: { status: column.status, type: "column" },
          });
          
          return (
            <Card key={column.status} className={column.color}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon className="h-4 w-4" />
                  {column.title}
                  <Badge variant="secondary" className="ml-auto bg-destructive text-white border border-destructive/70 rounded-full px-2 py-0.5">
                    {columnTickets.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent
                className="space-y-3 min-h-[320px]"
                ref={(el) => {
                  setColumnRef(el);
                  if (el) {
                    columnRefs.current[column.status] = el;
                  }
                }}
              >
                <SortableContext
                  id={column.status}
                  items={columnTickets.map(t => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {columnTickets.map((ticket) => (
                    <TicketCard 
                      key={ticket.id} 
                      ticket={ticket}
                      canManage={true}
                      onOpenDetails={onOpenDetails}
                      onResolve={(t) => requestStatusChange(t, 'Resolvido')}
                    />
                  ))}
                </SortableContext>
                
                {columnTickets.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Icon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum ticket</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <DragOverlay>
        {activeTicket ? (
          <div className="bg-white p-4 rounded-lg shadow-lg border">
            <div className="flex items-start justify-between mb-2">
              <span className="font-mono text-sm font-bold">{activeTicket.id}</span>
              <div className="flex gap-1">
                {getSLABadge(activeTicket.diasAberto)}
                {getDueDateBadge(activeTicket.dueDate)}
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {activeTicket.observacao}
            </p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{getAgentDisplayName(activeTicket.agente)}</span>
              <span>{format(new Date(activeTicket.updatedAt), 'dd/MM/yyyy')}</span>
            </div>
          </div>
        ) : null}
      </DragOverlay>
      {justificationDialog}
    </DndContext>
  );
};
