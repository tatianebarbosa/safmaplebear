import { ExternalLink, FileSpreadsheet, Link2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CRM_LINKS, SPREADSHEET_LINKS } from "@/config/links";

const LinksPage = () => {
  return (
    <div className="layout-wide w-full py-8 space-y-6">
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-white to-sky-50">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Link2 className="h-5 w-5" />
            </span>
            <div>
              <CardTitle className="text-2xl">Links Uteis</CardTitle>
              <CardDescription>
                Acessos rapidos para planilhas operacionais e fluxos externos usados no dia a dia.
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="border-primary/20 bg-primary/10 text-primary">
            Header / Links
          </Badge>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-[28px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Planilhas
            </CardTitle>
            <CardDescription>
              Recursos de operacao, acompanhamento e campanha.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {SPREADSHEET_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-2xl border bg-background px-4 py-4 text-sm transition-colors hover:bg-muted/40"
              >
                <span className="font-medium text-foreground">{item.label}</span>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-[28px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <ExternalLink className="h-5 w-5 text-primary" />
              CRM e Identidade
            </CardTitle>
            <CardDescription>
              Atalhos para suporte de senha, autenticador e fluxos de CRM.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {CRM_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-2xl border bg-background px-4 py-4 text-sm transition-colors hover:bg-muted/40"
              >
                <span className="font-medium text-foreground">{item.label}</span>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LinksPage;
