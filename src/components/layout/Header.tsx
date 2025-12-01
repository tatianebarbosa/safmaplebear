import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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

const ENABLE_ONLY_CANVA = import.meta.env.VITE_ENABLE_ONLY_CANVA === "true";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { currentUser, hasRole } = useAuthStore();

  const userEmail = localStorage.getItem("userEmail") || "admin@maplebear.com.br";
  const displayName = currentUser?.name || currentUser?.email || userEmail;
  const isCoordinator = currentUser?.role === "Coordinator";
  const initials = useMemo(
    () => userEmail.split("@")[0].slice(0, 2).toUpperCase(),
    [userEmail]
  );
  const showManagement = hasRole("Admin") || hasRole("Coordinator");

  const navItems = ENABLE_ONLY_CANVA
    ? [{ label: "Canva", path: "/dashboard/canva" }]
    : [
        { label: "Inicio", path: "/dashboard" },
        { label: "Canva", path: "/dashboard/canva" },
        { label: "Vouchers", path: "/dashboard/vouchers" },
        { label: "Ativos", path: "/saf/ativos" },
        { label: "Tickets", path: "/tickets" },
        { label: "Base de Conhecimento", path: "/knowledge-base" },
      ];

  const handleLogout = () => {
    authService.logout();

    toast({
      title: "Logout realizado",
      description: "Voce foi desconectado com sucesso",
    });

    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white shadow-[0_10px_20px_-12px_rgba(0,0,0,0.25)]">
      <div className="w-full px-6 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-5">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5">
              <div className="shrink-0 p-0">
                <img
                  src={Logos.SAF}
                  alt="Logo SAF Maple Bear"
                  className="h-11 w-auto object-contain"
                />
              </div>
              <div className="pl-0.5">
                <span className="text-2xl md:text-3xl font-bold leading-tight tracking-tight text-[#c1121f]">
                  Maple Bear
                </span>
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-2">
              {navItems.map((item) => {
                const isActive =
                  item.path === "/dashboard"
                    ? location.pathname === "/dashboard"
                    : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
                return (
                  <Button
                    key={item.label}
                    variant="ghost"
                    size="sm"
                    data-active={isActive}
                    className={[
                      "menu-underline px-2 py-2 h-auto text-sm bg-transparent rounded-none transition-colors hover:bg-transparent relative",
                      "after:absolute after:left-1 after:right-1 after:-bottom-1 after:h-[3px] after:rounded-full after:transition-colors after:duration-150",
                      isActive
                        ? "text-[#c1121f] font-semibold after:bg-[#c1121f]"
                        : "text-muted-foreground/80 hover:text-neutral-900 font-medium after:bg-transparent hover:after:bg-[#c1121f]/50",
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
                    className="menu-underline group px-0 py-2 h-auto gap-1.5 rounded-none bg-transparent text-sm font-semibold text-muted-foreground transition-colors hover:bg-transparent hover:text-foreground"
                  >
                    Links
                    <ChevronDown className="w-3 h-3 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
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
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-11 w-11"
                  aria-label="Buscar"
                  onClick={() => toast({ title: "Busca em breve", description: "Funcionalidade de busca ser? implementada em breve." })}
                >
                  <Search className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
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
                  className="rounded-full h-11 w-11 bg-primary text-white"
                  aria-label="Menu do usuario"
                >
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-primary text-white text-sm font-semibold">
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
              {isCoordinator && (
                <>
                  <DropdownMenuItem onClick={() => navigate("/monitoria-agentes")}>
                    <User className="w-4 h-4 mr-2" />
                    Monitoria de Agentes
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {!ENABLE_ONLY_CANVA && (
                <>
                  <DropdownMenuItem onClick={() => navigate("/knowledge-base")}>
                    <BookOpenText className="w-4 h-4 mr-2" />
                    Base de Conhecimento
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {showManagement && (
                    <>
                      <DropdownMenuItem onClick={() => navigate("/admin")}>
                        <Grid className="w-4 h-4 mr-2" />
                        Gerenciamento
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
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

