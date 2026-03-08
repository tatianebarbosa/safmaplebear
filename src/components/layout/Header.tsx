import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  User,
  LogOut,
  BookOpenText,
  FileSpreadsheet,
  ExternalLink,
  Search,
  Grid,
} from "lucide-react";
import { SPREADSHEET_LINKS, CRM_LINKS } from "@/config/links";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/components/auth/AuthService";
import { Logos } from "@/assets/maplebear";
import { useAuthStore } from "@/stores/authStore";
import NotificationBell from "@/components/layout/NotificationBell";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { isCanvaOnlyMode, isCoreViewsOnlyMode } from "@/lib/accessPolicy";
import MobileMenu from "@/components/layout/MobileMenu";
import { getUserFromToken } from "@/services/authService";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type SearchItem = {
  label: string;
  href: string;
  section: string;
  isExternal: boolean;
};

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { currentUser } = useAuthStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const userEmail = currentUser?.email || localStorage.getItem("userEmail") || "";
  const displayName = currentUser?.name || currentUser?.email || userEmail || "Usuário";
  const roleForPolicy = getUserFromToken()?.role;
  const roleForPolicyLower = String(roleForPolicy || "").toLowerCase();
  const isCoordinator = roleForPolicyLower === "coordinator";
  const isAdmin = roleForPolicyLower === "admin";
  const canvaOnlyMode = isCanvaOnlyMode(roleForPolicy);
  const coreViewsOnlyMode = isCoreViewsOnlyMode(roleForPolicy);
  const restrictToCoreViews = canvaOnlyMode || coreViewsOnlyMode;
  const isLinksActive =
    location.pathname === "/links" || location.pathname.startsWith("/links/");
  const routeAliases: Record<string, string[]> = {
    "/dashboard": ["/"],
    "/dashboard/canva": ["/canva"],
    "/dashboard/vouchers": ["/vouchers"],
    "/saf/ativos": ["/ativos"],
    "/knowledge-base": ["/knowledge"],
  };
  const initials = useMemo(
    () => (userEmail || currentUser?.name || "US").replace(/^(.{1,2}).*$/, "$1").toUpperCase(),
    [userEmail, currentUser?.name]
  );
  const navItems = canvaOnlyMode
    ? [{ label: "Canva", path: "/dashboard/canva" }]
    : coreViewsOnlyMode
      ? [
          { label: "Início", path: "/dashboard" },
          { label: "Canva", path: "/dashboard/canva" },
        ]
      : [
          { label: "Início", path: "/dashboard" },
          { label: "Canva", path: "/dashboard/canva" },
          { label: "Vouchers", path: "/dashboard/vouchers" },
          { label: "Ativos", path: "/saf/ativos" },
          { label: "Tickets", path: "/tickets" },
          { label: "Base de Conhecimento", path: "/knowledge-base" },
        ];

  const quickSearchItems = useMemo<SearchItem[]>(() => {
    const baseItems = navItems.map((item) => ({
      label: item.label,
      href: item.path,
      section: "Navegação",
      isExternal: false,
    }));

    const quickAccessItems: SearchItem[] = [
      { label: "Meu perfil", href: "/profile", section: "Conta", isExternal: false },
      { label: "Notificações", href: "/monitoring", section: "Visão", isExternal: false },
    ];

    if (!restrictToCoreViews && isCoordinator) {
      quickAccessItems.push({
        label: "Monitoria de Agentes",
        href: "/monitoria-agentes",
        section: "Gestão",
        isExternal: false,
      });
    }

    if (!restrictToCoreViews && isAdmin) {
      quickAccessItems.push(
        { label: "Base de Conhecimento", href: "/knowledge-base", section: "Gestão", isExternal: false },
        { label: "Gerenciamento", href: "/admin", section: "Gestão", isExternal: false }
      );
    }

    const externalItems = [
      ...SPREADSHEET_LINKS.map((item) => ({
        label: item.label,
        href: item.href,
        section: "Planilhas",
        isExternal: true,
      })),
      ...CRM_LINKS.map((item) => ({
        label: item.label,
        href: item.href,
        section: "CRM",
        isExternal: true,
      })),
    ];

    const merged = [...baseItems, ...quickAccessItems, ...externalItems];
    const uniqueItems = new Map<string, SearchItem>();

    merged.forEach((item) => {
      uniqueItems.set(`${item.label}-${item.href}`, item);
    });

    return [...uniqueItems.values()];
  }, [isAdmin, isCoordinator, navItems, restrictToCoreViews]);

  const searchMatches = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return quickSearchItems;
    return quickSearchItems.filter((item) =>
      `${item.label} ${item.section}`.toLowerCase().includes(query)
    );
  }, [quickSearchItems, searchQuery]);

  const handleSearchNavigate = (path: string) => {
    navigate(path);
    setSearchOpen(false);
    setSearchQuery("");
  };

  const handleLogout = () => {
    authService.logout();

    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso",
    });

    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-background shadow-[0_10px_20px_-12px_rgba(0,0,0,0.25)]">
      <div className="w-full px-4 py-3 md:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-5">
          <div className="flex items-center gap-6">
            <MobileMenu />
            <div className="flex items-center gap-1.5">
              <div className="shrink-0 p-0">
                <img
                  src={Logos.SAF}
                  alt="Logo SAF Maple Bear"
                  className="h-10 sm:h-11 w-auto object-contain"
                />
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-2">
              {navItems.map((item) => {
                const aliases = routeAliases[item.path] || [];
                const candidates = [item.path, ...aliases];
                const isActive = candidates.some((candidate) =>
                  candidate === "/"
                    ? location.pathname === "/"
                    : location.pathname === candidate || location.pathname.startsWith(`${candidate}/`)
                );
                return (
                  <Button
                    key={item.label}
                    variant="ghost"
                    size="sm"
                    type="button"
                    data-active={isActive}
                    aria-label={`Ir para ${item.label}`}
                    className={[
                      "menu-underline px-2 py-2 h-11 text-sm bg-transparent rounded-none transition-colors hover:bg-transparent relative",
                      "after:absolute after:left-1 after:right-1 after:-bottom-1 after:h-[3px] after:rounded-full after:transition-colors after:duration-150",
                      isActive
                        ? "text-primary font-semibold after:bg-primary"
                        : "text-muted-foreground/80 hover:text-foreground font-medium after:bg-transparent hover:after:bg-primary/50",
                    ].join(" ")}
                    onClick={() => navigate(item.path)}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {item.label}
                  </Button>
                );
              })}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    aria-label="Abrir links úteis"
                    className={[
                      "menu-underline group px-0 py-2 h-11 gap-1.5 rounded-none bg-transparent text-sm transition-colors hover:bg-transparent",
                      isLinksActive
                        ? "font-semibold text-primary"
                        : "font-semibold text-muted-foreground hover:text-foreground",
                    ].join(" ")}
                  >
                    Links
                    <ChevronDown
                      className={[
                        "w-3 h-3 transition-transform duration-200 group-data-[state=open]:rotate-180",
                        isLinksActive ? "text-primary" : "text-muted-foreground",
                      ].join(" ")}
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  side="bottom"
                  sideOffset={8}
                  className="w-72 rounded-xl shadow-[0_18px_34px_-18px_rgba(30,32,36,0.4)]"
                >
                  {SPREADSHEET_LINKS.map((item) => (
                    <DropdownMenuItem key={item.href} asChild>
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
                        {item.label}
                      </a>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  {CRM_LINKS.map((item) => (
                    <DropdownMenuItem key={item.href} asChild>
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm"
                      >
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                        {item.label}
                      </a>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Tooltip>
              <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full icon-btn-touch"
                      aria-label="Abrir busca rápida"
                      type="button"
                    >
                      <Search className="w-5 h-5" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <PopoverContent
                  align="end"
                  side="bottom"
                  sideOffset={8}
                  className="w-80 p-3"
                >
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Busca rápida</p>
                    <Input
                      value={searchQuery}
                      aria-label="Pesquisar páginas, links e relatórios"
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Procure por páginas, links e relatórios"
                      autoFocus
                      className="w-full"
                    />
                  </div>
                  <div className="mt-3 max-h-72 space-y-1 overflow-y-auto pr-1">
                    {searchMatches.length === 0 ? (
                      <p className="px-2 py-2 text-xs text-muted-foreground">Nenhum item encontrado.</p>
                    ) : (
                      searchMatches.slice(0, 12).map((item) => (
                      <Button
                        key={`${item.label}-${item.href}`}
                        type="button"
                        variant="ghost"
                        className="w-full justify-between h-11 text-sm"
                        aria-label={`Abrir ${item.label}`}
                        onClick={() =>
                          item.isExternal
                            ? window.open(item.href, "_blank", "noopener,noreferrer")
                            : handleSearchNavigate(item.href)
                        }
                          >
                          <span className="truncate">{item.label}</span>
                          <span className="text-muted-foreground text-xs">{item.section}</span>
                        </Button>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>
          <TooltipContent side="bottom" sideOffset={8}>
            Buscar
          </TooltipContent>
            </Tooltip>
            <NotificationBell />

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                  className="rounded-full icon-btn-touch bg-primary text-primary-foreground"
                    aria-label={`Abrir menu da conta de ${displayName}`}
                    type="button"
                  >
                    <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
                </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                side="bottom"
                sideOffset={8}
                collisionPadding={12}
                className="w-52 rounded-xl shadow-[0_18px_34px_-18px_rgba(30,32,36,0.4)] right-0 translate-x-0"
              >
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="w-4 h-4 mr-2" />
                  {displayName}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {!restrictToCoreViews && isCoordinator && (
                  <>
                    <DropdownMenuItem onClick={() => navigate("/monitoria-agentes")}>
                      <User className="w-4 h-4 mr-2" />
                      Monitoria de Agentes
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {!restrictToCoreViews && isAdmin && (
                  <>
                    <DropdownMenuItem onClick={() => navigate("/knowledge-base")}>
                      <BookOpenText className="w-4 h-4 mr-2" />
                      Base de Conhecimento
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/admin")}>
                      <Grid className="w-4 h-4 mr-2" />
                      Gerenciamento
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;



