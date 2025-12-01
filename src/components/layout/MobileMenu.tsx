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
  const { currentUser, hasRole } = useAuthStore();
  const [open, setOpen] = useState(false);

  const showManagement = hasRole("Admin") || hasRole("Coordinator");

  const navItems = [
    { label: "Incio", path: "/dashboard", icon: Home },
    { label: "Canva", path: "/dashboard/canva", icon: Palette },
    { label: "Vouchers", path: "/dashboard/vouchers", icon: Ticket },
    { label: "Tickets", path: "/tickets", icon: Ticket },
    { label: "Base de Conhecimento", path: "/knowledge-base", icon: BookOpenText },
  ];

  const handleLogout = () => {
    authService.logout();
    setOpen(false);

    toast({
      title: "Logout realizado",
      description: "Voc foi desconectado com sucesso",
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
          aria-label="Abrir menu de navegao"
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
          {/* Navegao Principal */}
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              const Icon = item.icon;
              return (
                <Button
                  key={item.label}
                  variant="ghost"
                  data-active={isActive}
                  className={[
                    "menu-underline w-full justify-start h-12 text-base font-semibold bg-transparent rounded-none transition-colors hover:bg-transparent",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  ].join(" ")}
                  aria-current={isActive ? "page" : undefined}
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
              Links Rpidos
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
                data-active={location.pathname.startsWith("/admin")}
                className={[
                  "menu-underline w-full justify-start h-12 text-base font-semibold bg-transparent rounded-none transition-colors hover:bg-transparent",
                  location.pathname.startsWith("/admin")
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
                aria-current={location.pathname.startsWith("/admin") ? "page" : undefined}
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
            className="w-full justify-start h-12 text-base font-semibold text-destructive hover:text-destructive hover:bg-destructive/10"
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
