// src/components/dashboard/StatsCards.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Users, BookOpen, CheckCircle2, AlertCircle } from "lucide-react";

interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: string;
  trendColor?: "positive" | "negative" | "neutral";
}

const StatsCard = ({
  icon,
  label,
  value,
  trend,
  trendColor = "neutral",
}: StatsCardProps) => {
  const trendColorClass = {
    positive: "text-green-600 bg-green-50",
    negative: "text-red-600 bg-red-50",
    neutral: "text-blue-600 bg-blue-50",
  }[trendColor];

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{label}</p>
            <p className="text-3xl font-bold text-foreground mt-2">{value}</p>
            {trend && (
              <p className={`text-xs mt-2 ${trendColorClass}`}>{trend}</p>
            )}
          </div>
          <div className="p-3 bg-primary/10 rounded-lg text-primary-dark">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface DashboardStatsProps {
  totalSchools?: number;
  totalUsers?: number;
  activeLicenses?: number;
  nonCompliantUsers?: number;
}

export const DashboardStats = ({
  totalSchools = 15,
  totalUsers = 245,
  activeLicenses = 180,
  nonCompliantUsers = 12,
}: DashboardStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard
        icon={<BookOpen className="w-6 h-6" />}
        label="Escolas"
        value={totalSchools}
        trend="+2 esta semana"
        trendColor="positive"
      />
      <StatsCard
        icon={<Users className="w-6 h-6" />}
        label="Usu?rios Totais"
        value={totalUsers}
        trend="+18 novos"
        trendColor="positive"
      />
      <StatsCard
        icon={<CheckCircle2 className="w-6 h-6" />}
        label="LicenÃ§as Ativas"
        value={activeLicenses}
        trend="73% de ocupa??o"
        trendColor="neutral"
      />
      <StatsCard
        icon={<AlertCircle className="w-6 h-6" />}
        label="N?o Conformes"
        value={nonCompliantUsers}
        trend="-3 desde ontem"
        trendColor="positive"
      />
    </div>
  );
};
