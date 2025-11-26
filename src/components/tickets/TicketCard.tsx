import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Ticket } from '@/types/tickets';
import { format, differenceInDays } from 'date-fns';
import { MoreVertical, Edit, CheckCircle } from 'lucide-react';
import { getAgentDisplayName } from '@/data/teamMembers';
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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ticket.id, resizeObserverConfig: { disabled: true } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getSLABadge = () => {
    if (ticket.diasAberto >= 15) {
      return <Badge variant="destructive" className="text-xs">Crítico {ticket.diasAberto}d</Badge>;
    }
    if (ticket.diasAberto >= 8) {
      return <Badge variant="warning" className="text-xs">Atenção {ticket.diasAberto}d</Badge>;
    }
    return <Badge variant="outline" className="text-xs">{ticket.diasAberto}d</Badge>;
  };

  const getDueDateBadge = () => {
    if (!ticket.dueDate) return null;
    
    const now = new Date();
    const due = new Date(ticket.dueDate);
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

  const handleResolve = () => {
    onResolve?.(ticket);
  };

  const agentLabel = getAgentDisplayName(ticket.agente);

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50' : ''
      } ${canManage ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
      {...(canManage ? { ...attributes, ...listeners } : {})}
      onClick={() => onOpenDetails?.(ticket)}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="font-mono text-sm font-bold">{ticket.id}</span>
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
      
      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
        {ticket.observacao}
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
