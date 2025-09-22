import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Ticket } from '@/types/tickets';
import { useTicketStore } from '@/stores/ticketStore';
import { useAuthStore } from '@/stores/authStore';
import { format, differenceInDays } from 'date-fns';
import { Edit, CheckCircle, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TicketTableProps {
  tickets: Ticket[];
}

export const TicketTable = ({ tickets }: TicketTableProps) => {
  const { moveTicket } = useTicketStore();
  const { canManageTicket } = useAuthStore();

  const getSLABadge = (diasAberto: number) => {
    if (diasAberto >= 15) {
      return <Badge variant="destructive" className="text-xs">Crítico</Badge>;
    }
    if (diasAberto >= 8) {
      return <Badge className="text-xs bg-orange-100 text-orange-800">Atenção</Badge>;
    }
    return <Badge variant="outline" className="text-xs">Normal</Badge>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pendente':
        return <Badge className="bg-orange-100 text-orange-800">Pendente</Badge>;
      case 'Em andamento':
        return <Badge className="bg-blue-100 text-blue-800">Em andamento</Badge>;
      case 'Resolvido':
        return <Badge className="bg-green-100 text-green-800">Resolvido</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDueDateInfo = (dueDate?: string) => {
    if (!dueDate) return { text: '-', variant: 'outline' as const };
    
    const now = new Date();
    const due = new Date(dueDate);
    const diffDays = differenceInDays(due, now);
    
    if (diffDays < 0) {
      return { 
        text: `Atrasado ${Math.abs(diffDays)}d`, 
        variant: 'destructive' as const 
      };
    }
    if (diffDays === 0) {
      return { 
        text: 'Vence hoje', 
        variant: 'default' as const 
      };
    }
    if (diffDays <= 3) {
      return { 
        text: `${diffDays}d`, 
        variant: 'secondary' as const 
      };
    }
    
    return { 
      text: format(due, 'dd/MM/yyyy'), 
      variant: 'outline' as const 
    };
  };

  const handleResolve = (ticket: Ticket) => {
    moveTicket(ticket.id, 'Resolvido');
  };

  if (tickets.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <p className="text-muted-foreground">Nenhum ticket encontrado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket</TableHead>
              <TableHead>Agente</TableHead>
              <TableHead>Dias</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Observação</TableHead>
              <TableHead>Atualizado</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => {
              const canManage = canManageTicket(ticket.agente);
              const dueDateInfo = getDueDateInfo(ticket.dueDate);
              
              return (
                <TableRow key={ticket.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold">
                        {ticket.id}
                      </span>
                      {getSLABadge(ticket.diasAberto)}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <span className="font-medium">{ticket.agente}</span>
                  </TableCell>
                  
                  <TableCell>
                    <span className="text-sm">{ticket.diasAberto}</span>
                  </TableCell>
                  
                  <TableCell>
                    {getStatusBadge(ticket.status)}
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant={dueDateInfo.variant} className="text-xs">
                      {dueDateInfo.text}
                    </Badge>
                  </TableCell>
                  
                  <TableCell className="max-w-xs">
                    <p className="text-sm text-muted-foreground truncate">
                      {ticket.observacao}
                    </p>
                  </TableCell>
                  
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(ticket.updatedAt), 'dd/MM/yyyy HH:mm')}
                    </span>
                  </TableCell>
                  
                  <TableCell>
                    {canManage && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          {ticket.status !== 'Resolvido' && (
                            <DropdownMenuItem onClick={() => handleResolve(ticket)}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Resolver
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};