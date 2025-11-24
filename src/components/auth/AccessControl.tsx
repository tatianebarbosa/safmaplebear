import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

const AccessControl = () => {
  return (
    <div className="layout-wide py-8">
      <Card className="border-border/60 shadow-[var(--shadow-card)]">
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/60">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Controle de acesso</CardTitle>
            <CardDescription>Gerencie permissões e papéis dos usuários.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Este módulo ainda está em construção. Em breve será possível ajustar papéis, permissões e auditoria.</p>
          <p>Se precisar liberar acesso agora, abra um ticket ou fale com o time SAF.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessControl;
