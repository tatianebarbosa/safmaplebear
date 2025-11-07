import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, LogIn, Loader2 } from "lucide-react";
import { authService } from "@/components/auth/AuthService";
import SEO from "@/components/common/SEO";
import { sanitizeEmail, sanitizeInput } from "@/utils/sanitization";
import { isValidEmail } from "@/utils/validation";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // FORÇAR REDIRECIONAMENTO PARA TESTE
  useEffect(() => {
    navigate("/dashboard", { replace: true });
  }, [navigate]);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação e sanitização
    const sanitizedEmail = sanitizeEmail(email);
    const sanitizedPassword = sanitizeInput(password);
    
    if (!isValidEmail(sanitizedEmail)) {
      toast({
        title: "Email inválido",
        description: "Por favor, insira um email válido",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);

    try {
      const response = await authService.login({ 
        email: sanitizedEmail, 
        password: sanitizedPassword 
      });

      if (response.success) {
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo ao Portal SAF Maple Bear",
        });
        
        // Manter compatibilidade com código existente
        localStorage.setItem("authenticated", "true");
        localStorage.setItem("userEmail", email);
        
        navigate("/dashboard", { replace: true });
      } else {
        toast({
          title: "Erro de autenticação",
          description: response.message || "Erro desconhecido",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar ao servidor. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SEO 
        title="Login"
        description="Faça login no sistema de gerenciamento de licenças Canva da MapleBear"
        keywords="login, maplebear, canva, autenticação"
      />
      <main className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-gradient-pattern opacity-50" />
      
      <Card className="w-full max-w-sm relative bg-card shadow-2xl border-none">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/40">
              <LogIn className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl font-heading font-bold text-foreground">
            Maple Bear SAF
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground font-body">
            Sistema de Gestão de Licenças Canva
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-body font-medium text-foreground">
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
              <Label htmlFor="password" className="text-sm font-body font-medium text-foreground">
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
              className="w-full mt-6 font-heading" 
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>


        </CardContent>
      </Card>
    </main>
    </>
  );
};

export default Login;