import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Users, Globe, Shield, Eye } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import UserManagementTable from '@/components/admin/UserManagementTable';

interface SiteConfig {
  title: string;
  heroTitle: string;
  heroDescription: string;
  menuItems: { name: string; url: string }[];
}

const AdminPage = () => {
  const { hasRole } = useAuthStore();
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(() => {
    const savedConfig = localStorage.getItem('saf-site-config');
    if (savedConfig) {
      return JSON.parse(savedConfig);
    }
    return {
      title: 'Maple Bear SAF',
      heroTitle: 'Centro de Controle SAF',
      heroDescription: 'Visão geral dos seus atendimentos, monitorias e alertas importantes',
      menuItems: [
        { name: 'Início', url: '/dashboard' },
        { name: 'Canva', url: '/dashboard/canva' },
        { name: 'Vouchers', url: '/dashboard/vouchers' },
        { name: 'Tickets', url: '/tickets' },
        { name: 'Monitoria', url: '/monitoring' }
      ]
    };
  });

  // Redirect if not authorized
  if (!hasRole('Admin')) {
    return (
      <div className="container mx-auto px-6 py-8">
        <Card>
          <CardContent className="py-16 text-center">
            <Shield className="h-16 w-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold mb-2">Acesso Negado</h2>
            <p className="text-muted-foreground">
              Apenas Administradores podem acessar esta área.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const saveSiteConfig = () => {
    localStorage.setItem('saf-site-config', JSON.stringify(siteConfig));
    toast.success('Configurações do site salvas com sucesso');
  };

  return (
    <div className="container mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8 text-primary" />
            Administração
          </h1>
          <p className="text-muted-foreground">
            Gerencie usuários, papéis e configurações do sistema
          </p>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Usuários e Perfis
          </TabsTrigger>
          <TabsTrigger value="site" className="gap-2">
            <Globe className="h-4 w-4" />
            Configurações do Site
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-2">
            <Eye className="h-4 w-4" />
            Pré-visualização
          </TabsTrigger>
        </TabsList>

        {/* Users Management */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Usuários</CardTitle>
              <CardDescription>
                Adicione, edite e remova usuários, e gerencie seus perfis de acesso.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserManagementTable />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Site Settings */}
        <TabsContent value="site" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Site</CardTitle>
              <CardDescription>
                Personalize o título, descrição e itens do menu.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="siteTitle">Título do Site</Label>
                <Input
                  id="siteTitle"
                  value={siteConfig.title}
                  onChange={(e) => setSiteConfig({ ...siteConfig, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="heroTitle">Título do Herói</Label>
                <Input
                  id="heroTitle"
                  value={siteConfig.heroTitle}
                  onChange={(e) => setSiteConfig({ ...siteConfig, heroTitle: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="heroDescription">Descrição do Herói</Label>
                <Textarea
                  id="heroDescription"
                  value={siteConfig.heroDescription}
                  onChange={(e) => setSiteConfig({ ...siteConfig, heroDescription: e.target.value })}
                />
              </div>
              <Button onClick={saveSiteConfig}>Salvar Configurações</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview */}
        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Pré-visualização</CardTitle>
              <CardDescription>Como as configurações aparecerão no site.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-8 border rounded-lg bg-background">
                <h1 className="text-4xl font-bold">{siteConfig.heroTitle}</h1>
                <p className="text-lg text-muted-foreground mt-2">{siteConfig.heroDescription}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;
