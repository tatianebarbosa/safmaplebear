import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "./AuthService";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuthentication = () => {
      const authenticated = authService.isAuthenticated();
      
      if (!authenticated) {
        navigate("/login", { replace: true });
        return;
      }

      setIsAuthenticated(true);
      setIsChecking(false);
    };

    checkAuthentication();
  }, [navigate]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : null;
};

export default ProtectedRoute;