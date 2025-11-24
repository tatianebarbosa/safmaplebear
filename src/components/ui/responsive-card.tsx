import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TruncatedText } from "@/components/ui/truncated-text";
import { cn } from "@/lib/utils";

interface ResponsiveCardProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "ghost" | "destructive";
    icon?: React.ReactNode;
  }>;
}

/**
 * Card responsivo com melhores práticas de UX
 * - Padding responsivo
 * - Botões com tamanho adequado para toque
 * - Truncamento de texto com tooltip
 * - Layout flexível
 */
export const ResponsiveCard = ({
  title,
  description,
  children,
  className,
  actions,
}: ResponsiveCardProps) => {
  return (
    <Card className={cn("card-padding", className)}>
      <CardHeader className="p-0 pb-4">
        <CardTitle className="text-responsive-lg">
          <TruncatedText text={title} maxWidth="100%" />
        </CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground mt-2">
            <TruncatedText text={description} lines={2} />
          </p>
        )}
      </CardHeader>

      {children && <CardContent className="p-0">{children}</CardContent>}

      {actions && actions.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || "default"}
              onClick={action.onClick}
              className="h-11 px-4 text-sm font-medium"
            >
              {action.icon && <span className="mr-2">{action.icon}</span>}
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </Card>
  );
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

/**
 * Card de estatística responsivo
 * Ideal para dashboards e métricas
 */
export const StatCard = ({
  label,
  value,
  icon,
  trend,
  className,
}: StatCardProps) => {
  return (
    <Card className={cn("card-padding", className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground truncate">
            {label}
          </p>
          <p className="text-2xl sm:text-3xl font-bold mt-2 truncate">
            {value}
          </p>
          {trend && (
            <p
              className={cn(
                "text-xs font-medium mt-2",
                trend.isPositive ? "text-success" : "text-destructive"
              )}
            >
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 ml-4 p-3 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

interface ActionCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  onClick: () => void;
  buttonLabel?: string;
  className?: string;
}

/**
 * Card de ação com call-to-action proeminente
 * Ideal para onboarding e features destacadas
 */
export const ActionCard = ({
  title,
  description,
  icon,
  onClick,
  buttonLabel = "Saiba mais",
  className,
}: ActionCardProps) => {
  return (
    <Card
      className={cn(
        "card-padding hover:shadow-lg transition-shadow cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <div className="flex flex-col sm:flex-row items-start gap-4">
        {icon && (
          <div className="flex-shrink-0 p-4 rounded-xl bg-primary/10 text-primary">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground mb-4">{description}</p>
          <Button variant="outline" className="h-11 w-full sm:w-auto">
            {buttonLabel}
          </Button>
        </div>
      </div>
    </Card>
  );
};

interface ListCardProps {
  title: string;
  items: Array<{
    id: string;
    label: string;
    value?: string;
    icon?: React.ReactNode;
    onClick?: () => void;
  }>;
  className?: string;
}

/**
 * Card com lista de itens
 * Ideal para listas de ações ou informações
 */
export const ListCard = ({ title, items, className }: ListCardProps) => {
  return (
    <Card className={cn("card-padding", className)}>
      <CardHeader className="p-0 pb-4">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-2">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={item.onClick}
              className={cn(
                "w-full flex items-center justify-between p-3 rounded-lg transition-colors",
                "hover:bg-accent min-h-[44px]",
                item.onClick ? "cursor-pointer" : "cursor-default"
              )}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {item.icon && (
                  <div className="flex-shrink-0 text-muted-foreground">
                    {item.icon}
                  </div>
                )}
                <span className="text-sm font-medium truncate">
                  {item.label}
                </span>
              </div>
              {item.value && (
                <span className="text-sm text-muted-foreground flex-shrink-0 ml-2">
                  {item.value}
                </span>
              )}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
