
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  ChevronDown, 
  BarChart3, 
  Users, 
  TrendingUp, 
  User, 
  LogOut, 
  MessageSquare, 
  Bot, 
  CreditCard, 
  Brain, 
  Calendar,
  Activity,
  Home,
  Menu
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import logoMaplebear from "@/assets/logo-maplebear.png";

interface HeaderProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const Header = ({ activeSection, onSectionChange }: HeaderProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const userEmail = localStorage.getItem("userEmail") || "admin@maplebear.com.br";

  const handleLogout = () => {
    localStorage.removeItem("authenticated");
    localStorage.removeItem("userEmail");
    
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso",
    });
    
    navigate("/login");
  };
  return (
    <header className="bg-card border-b border-border shadow-[var(--shadow-card)] sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img 
              src={logoMaplebear} 
              alt="Maple Bear SAF" 
              className="w-8 h-8 rounded-full"
            />
            <div>
              <h1 className="text-lg font-bold text-foreground">Maple Bear SAF</h1>
            </div>
          </div>

          {/* Compact Navigation */}
          <div className="flex items-center space-x-2">
            {/* Quick Actions */}
            <div className="hidden md:flex items-center space-x-1">
              <Button
                variant={activeSection === 'saf-control' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onSectionChange('saf-control')}
                className="gap-2"
              >
                <Home className="w-4 h-4" />
                Início
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = '/dashboard/canva'}
                className="gap-2"
              >
                <Users className="w-4 h-4" />
                Canva
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = '/dashboard/vouchers'}
                className="gap-2"
              >
                <CreditCard className="w-4 h-4" />
                Vouchers
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = '/tickets'}
                className="gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Tickets
              </Button>
            </div>

            {/* More Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Menu className="w-4 h-4" />
                  <span className="hidden sm:inline">Mais</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Dashboards
                  </div>
                </div>
                <DropdownMenuItem onClick={() => window.location.href = '/insights'}>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Insights e Análises
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.location.href = '/dashboard/vouchers-2026'}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Vouchers 2026
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Ferramentas SAF
                  </div>
                </div>
                <DropdownMenuItem onClick={() => onSectionChange('ai')}>
                  <Bot className="w-4 h-4 mr-2" />
                  Assistente IA
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSectionChange('knowledge')}>
                  <Brain className="w-4 h-4 mr-2" />
                  Base de Conhecimento
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    CHAMADOS N2
                  </div>
                </div>
                <DropdownMenuItem onClick={() => window.open('https://app.clickup.com/31013946/v/fm/xjf1u-92033?nocache=1757937386168', '_blank')}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  N2 Digital
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open('https://app.clickup.com/31013946/v/fm/xjf1u-92033?nocache=1757937386168', '_blank')}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  N2 Martech
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open('https://forms.clickup.com/31013946/f/xjf1u-151073/HL90B0X15O9I1RVR8T', '_blank')}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  N2 Mídia
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Gerenciamento
                  </div>
                </div>
                <DropdownMenuItem onClick={() => window.location.href = '/monitoring'}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Monitoria
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.location.href = '/admin'}>
                  <User className="w-4 h-4 mr-2" />
                  Administração
                </DropdownMenuItem>
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
                <DropdownMenuItem onClick={() => onSectionChange('profile')}>
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