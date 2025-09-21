import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Users, MapPin, Zap, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface SchoolData {
  id: string;
  name: string;
  location: string;
  totalUsers: number;
  activeUsers: number;
  licenseStatus: 'available' | 'complete' | 'excess';
  priority: 'high' | 'medium' | 'low';
}

interface SchoolCardProps {
  school: SchoolData;
  onViewDetails: (schoolId: string) => void;
}

const SchoolCard = ({ school, onViewDetails }: SchoolCardProps) => {
  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Licenças Disponíveis';
      case 'complete': return 'Licenças Completas';
      case 'excess': return 'Excesso de Usuários';
      default: return 'Status Indefinido';
    }
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === 'high') return '🔥';
    if (priority === 'medium') return '⚡';
    return '✅';
  };

  return (
    <Card className={cn(
      "card-maple hover:card-elevated animate-slide-up",
      school.priority === 'high' && "priority-high",
      school.priority === 'medium' && "priority-medium",
      school.priority === 'low' && "priority-low"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              {school.name}
              <span className="text-base">{getPriorityIcon(school.priority)}</span>
            </CardTitle>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="w-3 h-3" />
              {school.location}
            </div>
          </div>
          <StatusBadge 
            variant={school.licenseStatus}
            className="shrink-0"
          >
            {getStatusText(school.licenseStatus)}
          </StatusBadge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-3 h-3" />
              Total de Usuários
            </div>
            <p className="text-2xl font-bold text-foreground">{school.totalUsers}</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="w-3 h-3" />
              Usuários Ativos
            </div>
            <p className="text-2xl font-bold text-success">{school.activeUsers}</p>
          </div>
        </div>

        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Taxa de Ativação</span>
            <span className="text-sm font-semibold">
              {Math.round((school.activeUsers / school.totalUsers) * 100)}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-success to-success-light h-2 rounded-full transition-all duration-500"
              style={{ width: `${(school.activeUsers / school.totalUsers) * 100}%` }}
            />
          </div>
        </div>

        <Button 
          onClick={() => onViewDetails(school.id)}
          className="w-full gap-2"
          variant="outline"
        >
          <Eye className="w-4 h-4" />
          Ver Detalhes
        </Button>
      </CardContent>
    </Card>
  );
};

export default SchoolCard;