import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FloatingAIChat from "@/components/ai/FloatingAIChat";
import BannerECE2 from "@/assets/bannerinicial/ECE (2).png";
import BannerECE from "@/assets/bannerinicial/ECE.png";
import BannerELE from "@/assets/bannerinicial/ELE.png";
import BannerHS from "@/assets/bannerinicial/HS.png";
import BannerMY from "@/assets/bannerinicial/MY.png";
import {
  Activity,
  ArrowUpRight,
  BookOpen,
  Palette,
  Rocket,
  ShieldCheck,
  Sparkles,
  Ticket,
} from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [currentBanner, setCurrentBanner] = useState(0);

  const bannerImages = [
    { id: "ece2", src: BannerECE2, alt: "Banner ECE 2" },
    { id: "ece", src: BannerECE, alt: "Banner ECE" },
    { id: "ele", src: BannerELE, alt: "Banner ELE" },
    { id: "hs", src: BannerHS, alt: "Banner HS" },
    { id: "my", src: BannerMY, alt: "Banner MY" },
  ];

  useEffect(() => {
    if (!bannerImages.length) return;
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % bannerImages.length);
    }, 20000);
    return () => clearInterval(interval);
  }, [bannerImages.length]);

  const quickActions = [
    {
      title: "Painel Canva",
      description: "Governanca de licen?as, conformidade e uso em um so lugar.",
      icon: <Palette className="w-5 h-5 text-primary" />,
      action: "Abrir Canva",
      path: "/dashboard/canva",
    },
    {
      title: "Tickets",
      description: "Acompanhe chamados, status e priorizacoes da rede.",
      icon: <Ticket className="w-5 h-5 text-primary" />,
      action: "Ver tickets",
      path: "/tickets",
    },
    {
      title: "Base de Conhecimento",
      description: "Playbooks, tutoriais e comunicados oficiais da SAF.",
      icon: <BookOpen className="w-5 h-5 text-primary" />,
      action: "Abrir base",
      path: "/knowledge-base",
    },
  ];

  const highlightStats = [
    { label: "Licenças ativas", value: "1.240", note: "+32 esta semana", icon: <ShieldCheck className="w-4 h-4" /> },
    { label: "Escolas sincronizadas", value: "241", note: "dados oficiais", icon: <Rocket className="w-4 h-4" /> },
    { label: "Conformidade", value: "79,6%", note: "alertas monitorados", icon: <Activity className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-grow w-full">
        <section className="bg-muted/40 border-b border-border/60">
          <div
            className="mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
            style={{ maxWidth: 650 }}
          >
            <div className="relative overflow-hidden rounded-xl border bg-card shadow-[var(--shadow-card)] h-[180px] sm:h-[220px] md:h-[260px]">
              {bannerImages.map((banner, index) => (
                <img
                  key={banner.id}
                  src={banner.src}
                  alt={banner.alt}
                  className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in-out ${
                    index === currentBanner ? "opacity-100" : "opacity-0"
                  }`}
                  loading="lazy"
                />
              ))}
            </div>
          </div>
        </section>

        <div
          className="mx-auto w-full px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10 py-8 sm:py-10"
          style={{ maxWidth: 650 }}
        >
          <section className="grid md:grid-cols-[1.05fr_0.95fr] gap-5 lg:gap-6 items-start">
            <Card className="rounded-xl border shadow-[var(--shadow-card)]">
              <CardContent className="p-6 sm:p-8 space-y-6">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Nova tela inicial
                </div>
                <div className="space-y-3">
                  <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight">
                    Bem-vindo a central integrada da SAF
                  </h1>
                  <p className="text-base sm:text-lg text-muted-foreground max-w-2xl">
                    Acompanhe licen?as Canva, tickets e conhecimento em um so lugar. Escolha para onde ir ou veja os destaques.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    size="lg"
                    className="gap-2"
                    onClick={() => navigate("/dashboard/canva")}
                  >
                    Ir para Canva
                    <ArrowUpRight className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2 border-primary/40 text-primary hover:bg-primary/5"
                    onClick={() => navigate("/tickets")}
                  >
                    Abrir tickets
                  </Button>
                  <Button
                    variant="ghost"
                    className="gap-2 text-muted-foreground hover:text-foreground"
                    onClick={() => navigate("/knowledge-base")}
                  >
                    Base de conhecimento
                  </Button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm uppercase tracking-wide text-muted-foreground">Resumo rapido</p>
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
                      Hoje
                    </Badge>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {highlightStats.map((item) => (
                      <div
                        key={item.label}
                        className="rounded-lg border bg-card p-4 shadow-[var(--shadow-card)] flex flex-col gap-2 h-full"
                      >
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            {item.icon}
                          </span>
                          {item.label}
                        </div>
                        <p className="text-2xl font-bold text-foreground">{item.value}</p>
                        <p className="text-xs text-muted-foreground">{item.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl border shadow-[var(--shadow-card)]">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold">Visao rapida do Canva</CardTitle>
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
                    Atualizado
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Licenças, conformidade e uso em tempo real.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border bg-primary/5 p-4">
                    <p className="text-xs text-muted-foreground">Alertas ativos</p>
                    <p className="text-2xl font-semibold text-primary mt-1">12</p>
                    <p className="text-xs text-primary mt-1">Dominios n?o conformes</p>
                  </div>
                  <div className="rounded-lg border bg-success-bg p-4">
                    <p className="text-xs text-muted-foreground">Escolas sincronizadas</p>
                    <p className="text-2xl font-semibold text-success mt-1">241</p>
                    <p className="text-xs text-success mt-1">Dados oficiais</p>
                  </div>
                </div>
                <div className="rounded-lg border bg-background p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">Saude das licen?as</span>
                    </div>
                    <span className="text-sm font-semibold text-primary">79,6%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: "80%" }} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Continue convidando usu?rios com dominio autorizado para elevar a conformidade.
                  </p>
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" className="gap-2" onClick={() => navigate("/dashboard/canva")}>
                    Abrir painel completo
                    <ArrowUpRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-wide text-muted-foreground">Acesso rapido</p>
                <h2 className="text-2xl font-bold text-foreground">O que voce precisa agora?</h2>
              </div>
              <Badge variant="outline" className="rounded-full border-primary/30 text-primary bg-primary/5">
                Curadoria SAF
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickActions.map((item) => (
                <Card
                  key={item.title}
                  className="rounded-lg border shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] transition-shadow cursor-pointer h-full flex flex-col"
                  onClick={() => navigate(item.path)}
                >
                  <CardContent className="p-5 space-y-4 flex flex-col h-full">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <span className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
                          {item.icon}
                        </span>
                        {item.title}
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground flex-grow">{item.description}</p>
                    <Button className="gap-2 mt-auto" variant="secondary">
                      {item.action}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </main>

      <FloatingAIChat />
    </div>
  );
};

export default Index;
