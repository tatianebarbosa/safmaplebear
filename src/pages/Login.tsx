import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, LogIn } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validar domínios permitidos
    const allowedDomains = ['@mbcentral.com.br', '@seb.com.br', '@sebsa.com.br'];
    const isAllowedDomain = allowedDomains.some(domain => 
      email.toLowerCase().includes(domain)
    );

    if (!isAllowedDomain) {
      toast({
        title: "Acesso negado",
        description: "Acesso permitido apenas para emails corporativos (@mbcentral, @seb, @sebsa)",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Simulação de autenticação
    if ((email === "admin@mbcentral.com.br" && password === "maplebear2025") ||
        (email === "saf@seb.com.br" && password === "saf2025") ||
        (email === "coordenador@sebsa.com.br" && password === "coord2025")) {
      
      // Criar sessão com expiração de 1 semana
      const sessionExpiry = new Date();
      sessionExpiry.setDate(sessionExpiry.getDate() + 7);

      // Determinar role baseado no email
      let role = 'user';
      if (email.includes('admin@')) {
        role = 'admin';
      } else if (email.includes('manutencao@')) {
        role = 'maintenance';
      }

      // Criar perfil do usuário
      const userProfile = {
        id: `user_${Date.now()}`,
        name: email.split('@')[0].replace('.', ' ').replace(/^\w/, c => c.toUpperCase()),
        email: email,
        role,
        status: 'active',
        profileImage: '',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        sessionExpiry: sessionExpiry.toISOString(),
        approvedBy: 'sistema',
        approvedAt: new Date().toISOString()
      };

      // Salvar dados de autenticação
      localStorage.setItem("authenticated", "true");
      localStorage.setItem("userEmail", email);
      localStorage.setItem("saf_current_user", JSON.stringify(userProfile));
      localStorage.setItem("sessionExpiry", sessionExpiry.toISOString());

      // Criar dados iniciais se não existirem
      if (!localStorage.getItem('saf_pending_users')) {
        const pendingUsers = [
          {
            id: 'pending_1',
            name: 'Maria Silva',
            email: 'maria.silva@mbcentral.com.br',
            requestedAt: new Date().toISOString(),
            status: 'pending'
          }
        ];
        localStorage.setItem('saf_pending_users', JSON.stringify(pendingUsers));
      }

      if (!localStorage.getItem('saf_all_users')) {
        const allUsers = [userProfile];
        localStorage.setItem('saf_all_users', JSON.stringify(allUsers));
      }
      
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao Portal SAF Maple Bear",
      });
      
      // Pequeno delay para garantir que os dados sejam salvos
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 100);
    } else {
      toast({
        title: "Erro de autenticação",
        description: "Email ou senha incorretos",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-pattern opacity-50" />
      
      <Card className="w-full max-w-md relative backdrop-blur-sm bg-card/95 border-border/50 shadow-2xl">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <LogIn className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Maple Bear SAF
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Sistema de Gestão de Licenças Canva
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu.email@mbcentral.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                Senha
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full mt-6" 
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-border/50">
            <p className="text-xs text-center text-muted-foreground">
              Credenciais de teste:<br />
              <span className="font-mono">admin@mbcentral.com.br - maplebear2025</span><br />
              <span className="font-mono">saf@seb.com.br - saf2025</span><br />
              <span className="font-mono">coordenador@sebsa.com.br - coord2025</span><br />
              <br />
              <strong>Acesso válido apenas com emails corporativos</strong>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;