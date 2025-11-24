import { useLocation, useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Menu,
  Home,
  Palette,
  Ticket,
  BookOpenText,
  FileSpreadsheet,
  ExternalLink,
  Grid,
  LogOut,
} from "lucide-react";
import { SPREADSHEET_LINKS, CRM_LINKS } from "@/config/links";
import { authService } from "@/components/auth/AuthService";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/authStore";
import { useState } from "react";

const MobileMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { currentUser } = useAuthStore();
  const [open, setOpen] = useState(false);

  const showManagement = currentUser?.role === "Admin";

  const navItems = [
    { label: "Início", path: "/dashboard", icon: Home },
    { label: "Canva", path: "/dashboard/canva", icon: Palette },
    { label: "Tickets", path: "/tickets", icon: Ticket },
    { label: "Base de Conhecimento", path: "/knowledge-base", icon: BookOpenText },
  ];

  const handleLogout = () => {
    authService.logout();
    setOpen(false);

    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso",
    });

    navigate("/login");
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden rounded-full h-11 w-11"
          aria-label="Abrir menu de navegação"
        >
          <Menu className="w-6 h-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:w-[320px]">
        <SheetHeader>
          <SheetTitle className="text-left text-xl font-bold">
            Menu
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 flex flex-col gap-2">
          {/* Navegação Principal */}
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              const Icon = item.icon;
              return (
                <Button
                  key={item.label}
                  variant={isActive ? "secondary" : "ghost"}
                  className="w-full justify-start h-12 text-base font-medium"
                  onClick={() => handleNavigation(item.path)}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </Button>
              );
            })}
          </div>

          <Separator className="my-4" />

          {/* Links Externos */}
          <div className="space-y-1">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Links Rápidos
            </p>
            {SPREADSHEET_LINKS.map((item) => (
              <Button
                key={item.href}
                variant="ghost"
                className="w-full justify-start h-11 text-sm"
                asChild
              >
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                >
                  <FileSpreadsheet className="w-4 h-4 mr-3 text-muted-foreground" />
                  {item.label}
                </a>
              </Button>
            ))}
            {CRM_LINKS.map((item) => (
              <Button
                key={item.href}
                variant="ghost"
                className="w-full justify-start h-11 text-sm"
                asChild
              >
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                >
                  <ExternalLink className="w-4 h-4 mr-3 text-muted-foreground" />
                  {item.label}
                </a>
              </Button>
            ))}
          </div>

          <Separator className="my-4" />

          {/* Gerenciamento (Admin) */}
          {showManagement && (
            <>
              <Button
                variant="ghost"
                className="w-full justify-start h-12 text-base font-medium"
                onClick={() => handleNavigation("/admin")}
              >
                <Grid className="w-5 h-5 mr-3" />
                Gerenciamento
              </Button>
              <Separator className="my-4" />
            </>
          )}

          {/* Logout */}
          <Button
            variant="ghost"
            className="w-full justify-start h-12 text-base font-medium text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sair
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileMenu;
