import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BackToDashboardProps {
  to?: string;
  label?: string;
  className?: string;
}

const BackToDashboard = ({
  to = "/dashboard",
  label = "Voltar para o painel",
  className,
}: BackToDashboardProps) => {
  return (
    <div className={className}>
      <Button asChild variant="ghost" size="sm" className="gap-2">
        <Link to={to}>
          <ArrowLeft className="h-4 w-4" />
          {label}
        </Link>
      </Button>
    </div>
  );
};

export default BackToDashboard;
