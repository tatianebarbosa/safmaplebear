import { useEffect, useState } from "react";
import { BookOpen, FileText, Sparkles, UploadCloud } from "lucide-react";
import AIKnowledgeBase from "@/components/saf/AIKnowledgeBase";
import BackToDashboard from "@/components/common/BackToDashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getStoredKnowledgeItems, subscribeToKnowledgeBase } from "@/lib/knowledgeBase";

const KnowledgeBasePage = () => {
  const [stats, setStats] = useState({ items: 0, categories: 0, prompts: 0 });

  useEffect(() => {
    const loadStats = () => {
      if (typeof window === "undefined") return;
      const items = getStoredKnowledgeItems();
      const categories = new Set(items.map((item) => item.category)).size;
      let prompts = 0;

      try {
        const rawPrompts = window.localStorage.getItem("saf_ai_prompts");
        const parsed = rawPrompts ? JSON.parse(rawPrompts) : [];
        prompts = Array.isArray(parsed) ? parsed.length : 0;
      } catch {
        prompts = 0;
      }

      setStats({
        items: items.length,
        categories,
        prompts,
      });
    };

    loadStats();
    const unsubscribe = subscribeToKnowledgeBase(loadStats);
    const handleStorage = (event: StorageEvent) => {
      if (!event.key || ["saf_ai_prompts", "saf_knowledge_base"].includes(event.key)) {
        loadStats();
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const quickstartItems = [
    {
      title: "Mapear páginas do site",
      description: "Cadastre os fluxos que aparecem no header (Canva, Tickets, Agenda, Admin) usando “Novo conhecimento”.",
      icon: <FileText className="w-4 h-4 text-primary" />,
    },
    {
      title: "Subir comunicados oficiais",
      description: "Em “Anexar documentos”, envie .txt/.md/.csv/.json para gerar artigos automaticamente.",
      icon: <UploadCloud className="w-4 h-4 text-primary" />,
    },
    {
      title: "Guiar a IA do atendimento",
      description: "Crie prompts curtos na aba de Prompts da IA para definir tom de voz e respostas rápidas.",
      icon: <Sparkles className="w-4 h-4 text-primary" />,
    },
  ];

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <BackToDashboard className="mb-4" />

        <Card className="border-primary/30 bg-gradient-to-r from-primary/5 via-white to-amber-50">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <BookOpen className="w-5 h-5" />
              </span>
              <div>
                <CardTitle className="text-2xl">Base de Conhecimento do SAF</CardTitle>
                <CardDescription>
                  Use esta página para estruturar o conteúdo do link "Base de Conhecimento" no header e alimentar a IA.
                </CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="border-primary/30 bg-primary/5 text-primary">
              Pronta para editar
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <p className="text-sm text-muted-foreground">Artigos ativos</p>
                <p className="text-2xl font-semibold">{stats.items}</p>
                <p className="text-xs text-muted-foreground">Semeados do site e prontos para editar</p>
              </div>
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <p className="text-sm text-muted-foreground">Categorias mapeadas</p>
                <p className="text-2xl font-semibold">{stats.categories}</p>
                <p className="text-xs text-muted-foreground">Organize por módulo ou tipo de conteúdo</p>
              </div>
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <p className="text-sm text-muted-foreground">Prompts da IA</p>
                <p className="text-2xl font-semibold">{stats.prompts}</p>
                <p className="text-xs text-muted-foreground">Tom de voz e respostas rápidas do assistente</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {quickstartItems.map((item) => (
                <div key={item.title} className="rounded-xl border bg-white p-4 shadow-sm flex gap-3">
                  <div className="mt-1">{item.icon}</div>
                  <div className="space-y-1">
                    <p className="font-semibold leading-snug">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <AIKnowledgeBase />
      </div>
    </div>
  );
};

export default KnowledgeBasePage;
