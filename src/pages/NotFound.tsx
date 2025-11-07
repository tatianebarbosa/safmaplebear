import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import SEO from "@/components/common/SEO";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <>
      <SEO 
        title="Página Não Encontrada - 404"
        description="A página que você está procurando não foi encontrada"
        keywords="404, página não encontrada, erro"
      />
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="space-y-2">
            <h1 className="text-9xl font-bold text-primary">404</h1>
            <h2 className="text-3xl font-semibold text-foreground">
              Página Não Encontrada
            </h2>
            <p className="text-lg text-muted-foreground">
              Desculpe, a página que você está procurando não existe ou foi movida.
            </p>
          </div>

          <div className="pt-4 space-y-3">
            <Button 
              onClick={() => navigate('/')} 
              className="w-full"
              size="lg"
            >
              <Home className="mr-2 h-5 w-5" />
              Ir para Página Inicial
            </Button>
            
            <Button 
              onClick={() => navigate(-1)} 
              variant="outline"
              className="w-full"
              size="lg"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Voltar
            </Button>
          </div>

          <div className="pt-6 text-sm text-muted-foreground">
            <p>Caminho tentado: <code className="px-2 py-1 bg-muted rounded">{location.pathname}</code></p>
          </div>
        </div>
      </main>
    </>
  );
};

export default NotFound;
