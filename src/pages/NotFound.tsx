import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

const NotFound = () => {
  return (
    <div className="layout-wide py-16 flex items-center justify-center">
      <Card className="w-full max-w-xl text-center border-border/60 shadow-[var(--shadow-card)]">
        <CardHeader>
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted/50">
            <AlertTriangle className="h-7 w-7 text-warning" />
          </div>
          <CardTitle className="text-2xl">Página não encontrada</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>Parece que o endereço digitado não existe. Verifique a URL ou volte para o dashboard.</p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" asChild>
              <Link to="/dashboard">Voltar para o dashboard</Link>
            </Button>
            <Button asChild>
              <Link to="/login">Ir para o login</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
