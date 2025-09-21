import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, BarChart3, Users, TrendingUp, Settings } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import logoMaplebear from "@/assets/logo-maplebear.png";

interface HeaderProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const Header = ({ activeSection, onSectionChange }: HeaderProps) => {
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
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="gap-2 bg-transparent hover:bg-accent">
                  <Users className="w-4 h-4" />
                  Licenças Canva
                  <ChevronDown className="w-4 h-4" />
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-72 p-2">
                    <Button
                      variant={activeSection === 'dashboard' ? 'default' : 'ghost'}
                      className="w-full justify-start gap-3 mb-1"
                      onClick={() => onSectionChange('dashboard')}
                    >
                      <BarChart3 className="w-4 h-4" />
                      Dashboard
                    </Button>
                    <Button
                      variant={activeSection === 'management' ? 'default' : 'ghost'}
                      className="w-full justify-start gap-3 mb-1"
                      onClick={() => onSectionChange('management')}
                    >
                      <Users className="w-4 h-4" />
                      Gerenciamento
                    </Button>
                    <Button
                      variant={activeSection === 'history' ? 'default' : 'ghost'}
                      className="w-full justify-start gap-3 mb-1"
                      onClick={() => onSectionChange('history')}
                    >
                      <TrendingUp className="w-4 h-4" />
                      Histórico
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
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;