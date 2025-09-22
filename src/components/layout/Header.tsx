import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronDown, BarChart3, Users, TrendingUp, Settings, User, LogOut, MessageSquare, Bot, CreditCard, Brain, FileText, Shield } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
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
    <header className="bg-card border-b border-border shadow-[var(--shadow-card)] sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img 
              src={logoMaplebear} 
              alt="Maple Bear SAF" 
              className="w-12 h-12 rounded-full"
            />
            <div>
              <h1 className="text-xl font-bold text-foreground">Maple Bear SAF</h1>
              <p className="text-sm text-muted-foreground">Sistema de Gestão</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center space-x-6">
            <NavigationMenu>
              <NavigationMenuList>
                {/* Portal SAF */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="gap-2 bg-transparent hover:bg-accent">
                    <Shield className="w-4 h-4" />
                    Portal SAF
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-96 p-4">
                      {/* Seção Principal */}
                      <div className="space-y-2 mb-4">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          Sistema Principal
                        </div>
                        <Button
                          variant={activeSection === 'dashboard' ? 'default' : 'ghost'}
                          className="w-full justify-start gap-3"
                          onClick={() => onSectionChange('dashboard')}
                        >
                          <BarChart3 className="w-4 h-4" />
                          Dashboard Geral
                        </Button>
                        <Button
                          variant={activeSection === 'monitoring' ? 'default' : 'ghost'}
                          className="w-full justify-start gap-3"
                          onClick={() => onSectionChange('monitoring')}
                        >
                          <MessageSquare className="w-4 h-4" />
                          Portal de Monitoria
                        </Button>
                        <Button
                          variant={activeSection === 'ai' ? 'default' : 'ghost'}
                          className="w-full justify-start gap-3"
                          onClick={() => onSectionChange('ai')}
                        >
                          <Bot className="w-4 h-4" />
                          Assistente IA
                        </Button>
                        <Button
                          variant={activeSection === 'knowledge' ? 'default' : 'ghost'}
                          className="w-full justify-start gap-3"
                          onClick={() => onSectionChange('knowledge')}
                        >
                          <Brain className="w-4 h-4" />
                          Base de Conhecimento
                        </Button>
                        <Button
                          variant={activeSection === 'vouchers' ? 'default' : 'ghost'}
                          className="w-full justify-start gap-3"
                          onClick={() => onSectionChange('vouchers')}
                        >
                          <CreditCard className="w-4 h-4" />
                          Gerenciamento de Vouchers
                        </Button>
                      </div>

                      {/* Seção Licenças Canva */}
                      <div className="border-t pt-4">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          Licenças Canva
                        </div>
                        <div className="space-y-2">
                          <Button
                            variant={activeSection === 'management' ? 'default' : 'ghost'}
                            className="w-full justify-start gap-3"
                            onClick={() => onSectionChange('management')}
                          >
                            <Users className="w-4 h-4" />
                            Gerenciamento de Escolas
                          </Button>
                          <Button
                            variant={activeSection === 'users' ? 'default' : 'ghost'}
                            className="w-full justify-start gap-3"
                            onClick={() => onSectionChange('users')}
                          >
                            <User className="w-4 h-4" />
                            Gerenciamento de Usuários
                          </Button>
                          <Button
                            variant={activeSection === 'analytics' ? 'default' : 'ghost'}
                            className="w-full justify-start gap-3"
                            onClick={() => onSectionChange('analytics')}
                          >
                            <FileText className="w-4 h-4" />
                            Análise de Usuários
                          </Button>
                          <Button
                            variant={activeSection === 'history' ? 'default' : 'ghost'}
                            className="w-full justify-start gap-3"
                            onClick={() => onSectionChange('history')}
                          >
                            <TrendingUp className="w-4 h-4" />
                            Histórico e Relatórios
                          </Button>
                          <Button
                            variant={activeSection === 'settings' ? 'default' : 'ghost'}
                            className="w-full justify-start gap-3"
                            onClick={() => onSectionChange('settings')}
                          >
                            <Settings className="w-4 h-4" />
                            Configurações
                          </Button>
                        </div>
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center space-x-2 rounded-full">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                      {userEmail.split('@')[0].slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem className="text-sm">
                  <User className="w-4 h-4 mr-2" />
                  {userEmail}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onSectionChange('profile')}>
                  <User className="w-4 h-4 mr-2" />
                  Gerenciar Perfil
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