import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Ticket, TicketStatus } from '@/types/tickets';
import { useTicketStore } from '@/stores/ticketStore';
import { useAuthStore } from '@/stores/authStore';
import { TicketCard } from './TicketCard';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

interface TicketKanbanProps {
  tickets: Ticket[];
}

const columns: { status: TicketStatus; title: string; icon: any; color: string }[] = [
  { status: 'Pendente', title: 'Pendente', icon: Clock, color: 'bg-orange-100 border-orange-200' },
  { status: 'Em andamento', title: 'Em Andamento', icon: AlertTriangle, color: 'bg-blue-100 border-blue-200' },
  { status: 'Resolvido', title: 'Resolvido', icon: CheckCircle, color: 'bg-green-100 border-green-200' }
];

export const TicketKanban = ({ tickets }: TicketKanbanProps) => {
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const { moveTicket } = useTicketStore();
  const { canManageTicket } = useAuthStore();
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const ticket = tickets.find(t => t.id === event.active.id);
    setActiveTicket(ticket || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const ticket = tickets.find(t => t.id === active.id);
      
      if (ticket && canManageTicket(ticket.agente)) {
        const newStatus = over.id as TicketStatus;
        moveTicket(ticket.id, newStatus);
      }
    }
    
    setActiveTicket(null);
  };

  const getTicketsByStatus = (status: TicketStatus) => {
    return tickets.filter(ticket => ticket.status === status);
  };

  const getSLABadge = (diasAberto: number) => {
    if (diasAberto >= 15) {
      return <Badge variant="destructive" className="text-xs">Crítico {diasAberto}d</Badge>;
    }
    if (diasAberto >= 8) {
      return <Badge className="text-xs bg-orange-100 text-orange-800">Atenção {diasAberto}d</Badge>;
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
      return <Badge className="text-xs bg-yellow-100 text-yellow-800">Vence hoje</Badge>;
    }
    if (diffDays <= 3) {
      return <Badge className="text-xs bg-blue-100 text-blue-800">Vence em {diffDays}d</Badge>;
    }
    
    return null;
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {columns.map((column) => {
          const columnTickets = getTicketsByStatus(column.status);
          const Icon = column.icon;
          
          return (
            <Card key={column.status} className={column.color}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon className="h-4 w-4" />
                  {column.title}
                  <Badge variant="secondary" className="ml-auto">
                    {columnTickets.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <SortableContext
                  items={columnTickets.map(t => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {columnTickets.map((ticket) => (
                    <TicketCard 
                      key={ticket.id} 
                      ticket={ticket}
                      canManage={canManageTicket(ticket.agente)}
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
              <span>{activeTicket.agente}</span>
              <span>{format(new Date(activeTicket.updatedAt), 'dd/MM/yyyy')}</span>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};