import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  variant?: "default" | "destructive";
  tooltip?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

const StatsCard = ({
  title,
  value,
  icon,
  description,
  variant = "default",
  tooltip,
  trend,
  className,
}: StatsCardProps) => {
  const content = (
    <Card
      className={cn(
        "rounded-[var(--radius)] shadow-sm border-border/40 hover:shadow-md transition-all h-full",
        variant === "destructive"
          ? "border-destructive/20 bg-destructive/5"
          : "border-border/40 bg-card",
        className
      )}
    >
      <CardContent className="p-6 flex flex-col gap-4 justify-between min-h-[220px]">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2 flex-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {title}
            </p>
            <p
              className={cn(
                "text-2xl font-semibold",
                variant === "destructive" ? "text-destructive" : "text-foreground"
              )}
            >
              {value}
            </p>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
            {trend && (
              <div className="flex items-center gap-1">
                <span
                  className={cn(
                    "text-sm font-semibold",
                    trend.isPositive ? "text-success" : "text-destructive"
                  )}
                >
                  {trend.isPositive ? "+" : ""}
                  {trend.value}%
                </span>
                <span className="text-xs text-muted-foreground">vs. mes anterior</span>
              </div>
            )}
          </div>
          {icon && (
            <div
              className={cn(
                "p-2.5 rounded-full shadow-sm",
                variant === "destructive"
                  ? "bg-destructive/20 text-destructive"
                  : "bg-primary/20 text-primary"
              )}
            >
              <div
                className={cn(
                  "w-5 h-5 text-inherit opacity-90"
                )}
              >
                {icon}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (!tooltip) return content;

  return (
    <TooltipProvider delayDuration={120}>
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="bottom" align="start">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default StatsCard;
