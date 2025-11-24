import { Button } from "@/components/ui/button";
import { TruncatedText } from "@/components/ui/truncated-text";
import {
  ResponsiveCard,
  StatCard,
  ActionCard,
  ListCard,
} from "@/components/ui/responsive-card";
import {
  Search,
  Bell,
  User,
  TrendingUp,
  Palette,
  FileText,
  Settings,
  Check,
} from "lucide-react";

/**
 * Página de demonstração das melhorias de UX implementadas
 * Mostra antes/depois e melhores práticas
 */
const UXShowcase = () => {
  return (
    <div className="container-responsive section-padding">
      <div className="mb-8">
        <h1 className="heading-1 mb-4">Melhorias de UX Implementadas</h1>
        <p className="text-responsive-base text-muted-foreground">
          Demonstração das melhorias de experiência do usuário seguindo as
          melhores práticas da indústria.
        </p>
      </div>

      {/* Seção 1: Touch Targets */}
      <section className="mb-12">
        <h2 className="heading-2 mb-6">1. Tamanhos de Toque Adequados</h2>

        <div className="grid-responsive-2 mb-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-destructive">
              ❌ Antes (Inadequado)
            </h3>
            <div className="flex gap-2 items-center p-6 bg-muted/50 rounded-lg">
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <Search className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <Bell className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <User className="w-4 h-4" />
              </Button>
              <p className="text-xs text-muted-foreground ml-4">
                32x32px - Difícil de tocar
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-success">
              ✅ Depois (Adequado)
            </h3>
            <div className="flex gap-2 items-center p-6 bg-success/10 rounded-lg">
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11"
                aria-label="Buscar"
              >
                <Search className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11"
                aria-label="Notificações"
              >
                <Bell className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11"
                aria-label="Perfil"
              >
                <User className="w-5 h-5" />
              </Button>
              <p className="text-xs text-muted-foreground ml-4">
                44x44px - Fácil de tocar
              </p>
            </div>
          </div>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <p className="text-sm">
            <strong>Padrão adotado:</strong> Mínimo de 44x44px para todos os
            elementos interativos, seguindo Apple HIG e WCAG 2.1 (AAA).
          </p>
        </div>
      </section>

      {/* Seção 2: Grids Responsivos */}
      <section className="mb-12">
        <h2 className="heading-2 mb-6">2. Grids Responsivos</h2>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Grid Responsivo (1 → 2 → 3 colunas)
            </h3>
            <div className="grid-responsive-3">
              <StatCard
                label="Total de Licenças"
                value="1,234"
                icon={<Palette className="w-6 h-6" />}
                trend={{ value: 12.5, isPositive: true }}
              />
              <StatCard
                label="Tickets Abertos"
                value="45"
                icon={<FileText className="w-6 h-6" />}
                trend={{ value: 5.2, isPositive: false }}
              />
              <StatCard
                label="Usuários Ativos"
                value="892"
                icon={<User className="w-6 h-6" />}
                trend={{ value: 8.3, isPositive: true }}
              />
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <p className="text-sm">
              <strong>Classes utilitárias:</strong> <code>.grid-responsive-2</code>,{" "}
              <code>.grid-responsive-3</code>, <code>.grid-responsive-4</code>
            </p>
          </div>
        </div>
      </section>

      {/* Seção 3: Truncamento de Texto */}
      <section className="mb-12">
        <h2 className="heading-2 mb-6">3. Truncamento de Texto com Tooltip</h2>

        <div className="grid-responsive-2">
          <ResponsiveCard
            title="Escola Municipal de Ensino Fundamental Professor João da Silva Santos"
            description="Este é um exemplo de descrição muito longa que precisa ser truncada adequadamente para não quebrar o layout do card e manter uma aparência profissional."
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Email:</span>
                <TruncatedText
                  text="coordenador.pedagogico.escola.municipal@educacao.gov.br"
                  maxWidth="200px"
                  className="text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Responsável:
                </span>
                <TruncatedText
                  text="Maria Aparecida dos Santos Silva"
                  maxWidth="200px"
                  className="text-sm"
                />
              </div>
            </div>
          </ResponsiveCard>

          <div className="space-y-4">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <p className="text-sm mb-2">
                <strong>Componente:</strong> <code>TruncatedText</code>
              </p>
              <p className="text-xs text-muted-foreground">
                Passe o mouse sobre os textos longos no card ao lado para ver o
                tooltip completo.
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="text-sm font-semibold mb-2">Uso:</h4>
              <pre className="text-xs overflow-x-auto">
                {`<TruncatedText 
  text="Texto longo..."
  maxWidth="200px"
/>`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Seção 4: Cards Responsivos */}
      <section className="mb-12">
        <h2 className="heading-2 mb-6">4. Componentes de Card Melhorados</h2>

        <div className="grid-responsive-3">
          <ActionCard
            title="Dashboard Canva"
            description="Gerencie licenças e visualize métricas de uso do Canva"
            icon={<Palette className="w-6 h-6" />}
            onClick={() => alert("Navegando para Dashboard")}
            buttonLabel="Acessar Dashboard"
          />

          <ActionCard
            title="Base de Conhecimento"
            description="Acesse documentação e tutoriais do sistema"
            icon={<FileText className="w-6 h-6" />}
            onClick={() => alert("Navegando para Base")}
            buttonLabel="Ver Artigos"
          />

          <ActionCard
            title="Configurações"
            description="Personalize suas preferências e configurações"
            icon={<Settings className="w-6 h-6" />}
            onClick={() => alert("Navegando para Configurações")}
            buttonLabel="Configurar"
          />
        </div>
      </section>

      {/* Seção 5: Lista de Melhorias */}
      <section className="mb-12">
        <h2 className="heading-2 mb-6">5. Resumo das Melhorias</h2>

        <ListCard
          title="Melhorias Implementadas"
          items={[
            {
              id: "1",
              label: "Menu mobile responsivo com drawer",
              icon: <Check className="w-5 h-5 text-success" />,
            },
            {
              id: "2",
              label: "Botões com tamanho mínimo de 44x44px",
              icon: <Check className="w-5 h-5 text-success" />,
            },
            {
              id: "3",
              label: "Grids responsivos com breakpoints",
              icon: <Check className="w-5 h-5 text-success" />,
            },
            {
              id: "4",
              label: "Truncamento de texto com tooltip",
              icon: <Check className="w-5 h-5 text-success" />,
            },
            {
              id: "5",
              label: "Labels acessíveis (aria-label)",
              icon: <Check className="w-5 h-5 text-success" />,
            },
            {
              id: "6",
              label: "Classes utilitárias CSS",
              icon: <Check className="w-5 h-5 text-success" />,
            },
            {
              id: "7",
              label: "Componentes de card responsivos",
              icon: <Check className="w-5 h-5 text-success" />,
            },
            {
              id: "8",
              label: "Tipografia responsiva",
              icon: <Check className="w-5 h-5 text-success" />,
            },
          ]}
        />
      </section>

      {/* Seção 6: Próximos Passos */}
      <section>
        <h2 className="heading-2 mb-6">6. Próximos Passos</h2>

        <div className="grid-responsive-2">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Prioridade Alta</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>
                  Aplicar melhorias em CanvaDashboard e SchoolsDashboard
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Adicionar scroll horizontal em tabelas mobile</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Testar em dispositivos reais (mobile/tablet)</span>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Prioridade Média</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Padronizar espaçamentos em todos os componentes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Melhorar estados de loading com skeletons</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Adicionar empty states informativos</span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

export default UXShowcase;
