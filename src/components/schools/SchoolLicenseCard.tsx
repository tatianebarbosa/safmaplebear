import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { School, Users, MapPin, Phone, Mail, Settings, Eye, AlertTriangle } from "lucide-react";
import { School as SchoolType, calculateLicenseStatus } from "@/lib/schoolDataProcessor";
import { cn } from "@/lib/utils";

interface SchoolLicenseCardProps {
  school: SchoolType;
  onViewDetails: (school: SchoolType) => void;
  onEditLicenses: (school: SchoolType) => void;
}

const SchoolLicenseCard = ({ school, onViewDetails, onEditLicenses }: SchoolLicenseCardProps) => {
  const licenseStatus = calculateLicenseStatus(school);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'text-success';
      case 'warning':
        return 'text-warning';
      case 'full':
        return 'text-secondary';
      case 'excess':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Ativa':
        return <Badge className="bg-success-bg text-success border-success/20">Ativa</Badge>;
      case 'Implantando':
        return <Badge className="bg-warning-bg text-warning border-warning/20">Implantando</Badge>;
      case 'Inativa':
        return <Badge variant="outline">Inativa</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getLicenseStatusBadge = () => {
    switch (licenseStatus.status) {
      case 'available':
        return <Badge className="bg-success-bg text-success border-success/20">Disponível</Badge>;
      case 'warning':
        return <Badge className="bg-warning-bg text-warning border-warning/20">Atenção</Badge>;
      case 'full':
        return <Badge className="bg-secondary-bg text-secondary border-secondary/20">Completo</Badge>;
      case 'excess':
        return <Badge className="bg-destructive-bg text-destructive border-destructive/20">Excesso</Badge>;
      default:
        return <Badge variant="outline">Status Indefinido</Badge>;
    }
  };

  return (
    <Card className={cn(
      "card-maple hover:card-elevated transition-all duration-300",
      licenseStatus.status === 'excess' && "border-destructive/50 bg-destructive-bg/10",
      licenseStatus.status === 'warning' && "border-warning/50 bg-warning-bg/10"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <School className="w-5 h-5 text-primary" />
              {school.name}
              {licenseStatus.status === 'excess' && (
                <AlertTriangle className="w-4 h-4 text-destructive" />
              )}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-3 h-3" />
              {school.city}, {school.state}
            </div>
            <div className="flex gap-2">
              {getStatusBadge(school.status)}
              {getLicenseStatusBadge()}
            </div>
          </div>
          
          <div className="text-right">
            <div className={cn(
              "text-2xl font-bold",
              getStatusColor(licenseStatus.status)
            )}>
              {licenseStatus.used}/{licenseStatus.total}
            </div>
            <div className="text-xs text-muted-foreground">Licenças</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Utilização</span>
            <span className={cn("font-semibold", getStatusColor(licenseStatus.status))}>
              {Math.round(licenseStatus.percentage)}%
            </span>
          </div>
          <Progress 
            value={Math.min(licenseStatus.percentage, 100)} 
            className="h-2"
            // className={cn(
            //   "h-2",
            //   licenseStatus.status === 'excess' && "[&>div]:bg-destructive",
            //   licenseStatus.status === 'warning' && "[&>div]:bg-warning",
            //   licenseStatus.status === 'available' && "[&>div]:bg-success"
            // )}
          />
          {licenseStatus.status === 'excess' && (
            <div className="text-xs text-destructive font-medium">
              Excesso de {licenseStatus.used - licenseStatus.total} usuário(s)
            </div>
          )}
        </div>

        {/* School Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-3 h-3" />
              Total de Usuários
            </div>
            <div className="font-semibold">{school.users.length}</div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Badge className="w-3 h-3" />
              Cluster
            </div>
            <div className="font-semibold text-xs">{school.cluster || 'N/A'}</div>
          </div>
        </div>

        {/* Contact Info */}
        {(school.email || school.phone) && (
          <div className="space-y-2 pt-2 border-t border-border">
            {school.email && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="w-3 h-3" />
                <span className="truncate">{school.email}</span>
              </div>
            )}
            {school.phone && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Phone className="w-3 h-3" />
                <span>{school.phone}</span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            onClick={() => onViewDetails(school)}
            className="flex-1 gap-2"
            variant="outline"
            size="sm"
          >
            <Eye className="w-4 h-4" />
            Detalhes
          </Button>
          <Button 
            onClick={() => onEditLicenses(school)}
            className="gap-2"
            size="sm"
            variant="secondary"
          >
            <Settings className="w-4 h-4" />
            Editar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SchoolLicenseCard;