import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "./AuthService";
import { LoadingMascot } from "@/components/ui/loading-mascot";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  // Se o login deve estar desativado, o ProtectedRoute deve sempre retornar o children
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuthentication = () => {
      // Forçar a re-leitura do status de autenticação
      const authenticated = authService.isAuthenticated();
      
      setIsAuthenticated(authenticated);
      setIsChecking(false);

      if (!authenticated) {
        navigate("/login", { replace: true });
      }
    };

    // Adicionar um pequeno delay para garantir que o localStorage seja atualizado após o login
    const timer = setTimeout(() => {
        checkAuthentication();
    }, 100); // 100ms de delay

    return () => clearTimeout(timer);
  }, [navigate]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingMascot message="Verificando autenticação..." size="lg" />
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : <></>; // Retorna um fragmento vazio se não estiver autenticado (o navigate já cuida do redirecionamento);
};

export default ProtectedRoute;
