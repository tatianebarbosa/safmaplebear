import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, ArrowRight, NotebookPen, Settings2 } from "lucide-react";
import type { SafAsset } from "@/types/assets";

type AssetCardProps = {
  asset: SafAsset;
  totalContacts: number;
  lastContactAt?: string;
  onOpen: () => void;
  onConfigure?: () => void;
};

const formatDate = (value?: string) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
};

export const AssetCard = ({ asset, totalContacts, lastContactAt, onOpen, onConfigure }: AssetCardProps) => {
  const createdAtLabel = formatDate(asset.createdAt);
  const lastContactLabel = formatDate(lastContactAt);

  return (
    <Card className="card-maple hover:card-elevated transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <CardTitle className="text-xl font-semibold leading-tight">{asset.name}</CardTitle>
            {asset.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{asset.description}</p>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarClock className="w-4 h-4" />
              <span>Criado {createdAtLabel || "agora"}</span>
            </div>
            {asset.owners?.length ? (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-muted-foreground">Responsveis:</span>
                {asset.owners.map((owner) => (
                  <Badge key={owner} variant="outline" className="border-primary/20 bg-primary/5 text-foreground">
                    {owner}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
          <Badge
            variant="secondary"
            className="inline-flex items-center gap-1 bg-primary/10 text-primary border-primary/20 px-3 py-1 rounded-full text-xs font-semibold"
          >
            <span className="font-semibold">{totalContacts}</span>
            <span>registros</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex items-center justify-between pt-0">
        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <NotebookPen className="w-4 h-4 text-primary" />
            <span>ltimo contato: {lastContactLabel || "sem registros"}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onConfigure && (
            <Button onClick={onConfigure} variant="outline" size="sm" className="gap-2">
              <Settings2 className="w-4 h-4" />
              Configurar
            </Button>
          )}
          <Button onClick={onOpen} className="gap-2" size="sm">
            Abrir ativo
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
