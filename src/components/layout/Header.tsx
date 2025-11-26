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

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { currentUser } = useAuthStore();

  const userEmail = localStorage.getItem("userEmail") || "admin@maplebear.com.br";
  const initials = useMemo(
    () => userEmail.split("@")[0].slice(0, 2).toUpperCase(),
    [userEmail]
  );
  const showManagement = currentUser?.role === "Admin";

  const navItems = [
    { label: "Início", path: "/dashboard" },
    { label: "Canva", path: "/dashboard/canva" },
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
      <div className="w-full px-8 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <img
                src={Logos.Triple}
                alt="SAF Maple Bear"
                className="h-11 w-auto object-contain"
              />
              <div className="flex items-baseline gap-1.5">
                <span className="text-[22px] font-semibold text-foreground leading-tight">
                  SAF
                </span>
                <span className="text-[22px] font-semibold text-primary leading-tight">
                  Maple Bear
                </span>
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-3">
              {navItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <Button
                    key={item.label}
                    variant="ghost"
                    size="sm"
                    className={[
                      "px-0 py-1 h-auto text-sm font-medium transition-colors rounded-none border-b-2 border-transparent",
                      isActive
                        ? "text-primary border-primary"
                        : "text-foreground hover:text-primary hover:bg-transparent",
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
                    className="group px-0 py-1 h-auto gap-1.5 rounded-none border-b-2 border-transparent text-sm font-medium text-foreground hover:text-primary hover:bg-transparent data-[state=open]:border-primary"
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

          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full h-11 w-11"
              aria-label="Buscar"
              onClick={() => toast({ title: "Busca em breve", description: "Funcionalidade de busca será implementada em breve." })}
            >
              <Search className="w-5 h-5" />
            </Button>
            <NotificationBell />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-11 w-11 bg-primary text-white"
                  aria-label="Menu do usuário"
                >
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-primary text-white text-sm font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="center"
                side="bottom"
                sideOffset={10}
                avoidCollisions={false}
                className="w-52 rounded-xl shadow-[0_18px_34px_-18px_rgba(30,32,36,0.4)]"
              >
                <DropdownMenuItem className="text-sm">
                  <User className="w-4 h-4 mr-2" />
                  {userEmail}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
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

