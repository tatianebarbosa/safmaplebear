
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  ChevronDown, 
  User, 
  LogOut,
  BookOpenText,
  FileSpreadsheet,
  ExternalLink
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/components/auth/AuthService";
import { BearHappy } from "@/assets/maplebear";

interface HeaderProps {
  // activeSection: string; // Removido
  // onSectionChange: (section: string) => void; // Removido
}

const Header = (props: HeaderProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const userEmail = localStorage.getItem("userEmail") || "admin@maplebear.com.br";
  const spreadsheetLinks = [
    { label: "N2 Digital", href: "https://app.clickup.com/31013946/v/fm/xjf1u-92033" },
    { label: "Reembolsos 2024/2025", href: "https://sistemaseb.sharepoint.com/teams/MAPLEBEAR-PLANEJAMENTOFINANCEIRO/_layouts/15/doc2.aspx?sourcedoc=%7BF1CF36E3-2BDB-4B0D-A84C-324E2D3348FC%7D&file=REEMBOLSOS%202024_2025.xlsx&action=default&mobileredirect=true" },
    { label: "N2 Martech", href: "https://forms.clickup.com/31013946/f/xjf1u-144533/4KQQDYMO5O52A0ML3X" },
    { label: "Voucher Campanha 2026", href: "https://sistemaseb-my.sharepoint.com/:x:/r/personal/anapa_andrade_sebsa_com_br/_layouts/15/doc2.aspx?sourcedoc=%7B8D8F5BAE-4DC5-479C-BFA3-72FFCA05C59B%7D&file=Voucher%20de%20Campanha%202026.xlsx&action=default&mobileredirect=true&DefaultItemOpen=1" },
  ];

  const crmLinks = [
    { label: "Alterar senha CRM", href: "https://sebsa.topdesk.net/tas/public/ssp/content/serviceflow?unid=c6ad3cbd8a2c4608ad4df32d1711f986" },
    { label: "Alterar autenticador CRM", href: "https://sebsa.topdesk.net/tas/public/ssp/content/serviceflow?unid=71a30b844ae54002b70c00e21dd4d29e" },
  ];

  const handleLogout = () => {
    authService.logout();
    
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso",
    });
    
    navigate("/login");
  };

  return (
    <header className="bg-card border-b border-border shadow-[var(--shadow-card)] sticky top-0 z-40 w-full">
      <div className="w-full px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img 
              src={BearHappy} 
              alt="Maple Bear SAF" 
              className="w-10 h-10 object-contain"
            />
            <div>
              <h1 className="text-lg font-bold text-foreground">Maple Bear SAF</h1>
            </div>
          </div>

          {/* Compact Navigation */}
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  Links
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                {spreadsheetLinks.map((item) => (
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
                {crmLinks.map((item) => (
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
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <Avatar className="w-7 h-7">
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                      {userEmail.split('@')[0].slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="text-sm">
                <User className="w-4 h-4 mr-2" />
                {userEmail}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/knowledge-base')}>
                <BookOpenText className="w-4 h-4 mr-2" />
                Base de Conhecimento
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="w-4 h-4 mr-2" />
                Perfil
              </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
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
