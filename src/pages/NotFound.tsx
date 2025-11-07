import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mascot } from "@/components/ui/mascot";
import { BearPeeking } from "@/assets/maplebear";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
      <div className="text-center px-4 max-w-2xl">
        <Mascot 
          src={BearPeeking} 
          size="xl" 
          alt="Maple Bear - Página não encontrada" 
          className="mb-8"
        />
        
        <h1 className="mb-4 text-6xl font-bold text-foreground">404</h1>
        <h2 className="mb-4 text-2xl font-semibold text-foreground">
          Oops! Página não encontrada
        </h2>
        <p className="mb-8 text-lg text-muted-foreground">
          Parece que você se perdeu! A página que você está procurando não existe ou foi movida.
        </p>
        
        <div className="flex gap-4 justify-center flex-wrap">
          <Button 
            onClick={() => navigate(-1)}
            variant="outline"
            size="lg"
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          
          <Button 
            onClick={() => navigate("/dashboard")}
            size="lg"
            className="gap-2"
          >
            <Home className="w-4 h-4" />
            Ir para o Dashboard
          </Button>
        </div>
        
        <p className="mt-8 text-sm text-muted-foreground">
          Caminho tentado: <code className="bg-muted px-2 py-1 rounded">{location.pathname}</code>
        </p>
      </div>
    </div>
  );
};

export default NotFound;
