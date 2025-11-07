import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  variant?: "default" | "destructive";
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

const StatsCard = ({ title, value, icon, description, variant = "default", trend, className }: StatsCardProps) => {
  return (
    <Card className={cn(
      "card-maple hover:shadow-lg hover:shadow-primary/10 transition-all duration-300", // Microinteração mais sutil
      variant === "destructive" ? "border-destructive/20 bg-destructive/5 dark:bg-destructive/10" : "",
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-body font-medium text-muted-foreground">{title}</p>
            <p className={cn(
              "text-3xl font-bold",
              variant === "destructive" ? "text-destructive" : "text-foreground"
            )}>{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground font-body">{description}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1">
                {trend.isPositive ? (
                  <ArrowUp className="h-4 w-4 text-success" />
                ) : (
                  <ArrowDown className="h-4 w-4 text-destructive" />
                )}
                <span
                  className={cn(
                    "text-sm font-semibold",
                    trend.isPositive ? "text-success" : "text-destructive"
                  )}
                >
                  {trend.isPositive ? "+" : ""}{trend.value}%
                </span>
                <span className="text-xs text-muted-foreground font-body">vs. mês anterior</span>
              </div>
            )}
          </div>
          <div className={cn(
            "p-3 rounded-xl", // Bordas mais quadradas
            variant === "destructive" ? "bg-destructive/10" : "bg-primary/10"
          )}>
            <div className={cn(
              "w-6 h-6",
              variant === "destructive" ? "text-destructive" : "text-primary"
            )}>
              {icon}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;