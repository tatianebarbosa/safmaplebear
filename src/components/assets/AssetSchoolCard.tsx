import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { School as SchoolIcon, MapPin, ListChecks, Clock } from "lucide-react";
import type { School } from "@/lib/schoolDataProcessor";

type AssetSchoolCardProps = {
  school: School;
  totalContacts: number;
  lastContactAt?: string;
  onManage: () => void;
};

const formatDateTime = (value?: string) => {
  if (!value) return "Nenhum contato";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Nenhum contato";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const AssetSchoolCard = ({
  school,
  totalContacts,
  lastContactAt,
  onManage,
}: AssetSchoolCardProps) => {
  const lastContactLabel = formatDateTime(lastContactAt);

  return (
    <Card className="card-maple hover:card-elevated transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <SchoolIcon className="w-5 h-5 text-primary" />
              {school.name}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" />
              {school.city}, {school.state}
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">
                Cluster: {school.cluster || "N/A"}
              </Badge>
              <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                {school.status}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{totalContacts}</div>
            <div className="text-xs text-muted-foreground">contatos</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ListChecks className="w-4 h-4 text-primary" />
          <span>Total de contatos: {totalContacts}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4 text-primary" />
          <span>ltimo contato: {lastContactLabel}</span>
        </div>
        <div className="pt-2">
          <Button onClick={onManage} className="w-full gap-2" size="sm">
            Gerenciar ativos
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
