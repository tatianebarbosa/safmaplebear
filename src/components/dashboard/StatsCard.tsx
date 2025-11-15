import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
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
      "rounded-xl shadow-sm border-border/40 hover:shadow-md transition-all", 
      variant === "destructive" ? "border-destructive/20 bg-destructive/5" : "",
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
            <p className={cn(
              "text-2xl font-semibold",
              variant === "destructive" ? "text-destructive" : "text-foreground"
            )}>{value}</p>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1">
                <span
                  className={cn(
                    "text-sm font-semibold",
                    trend.isPositive ? "text-success" : "text-destructive"
                  )}
                >
                  {trend.isPositive ? "+" : ""}{trend.value}%
                </span>
                <span className="text-xs text-muted-foreground">vs. mês anterior</span>
              </div>
            )}
          </div>
          <div className={cn(
            "p-2 rounded-full",
            variant === "destructive" ? "bg-destructive/10" : "bg-primary/10"
          )}>
            <div className={cn(
              "w-5 h-5",
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