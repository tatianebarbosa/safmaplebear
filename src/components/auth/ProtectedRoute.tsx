import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "./AuthService";
import { LoadingMascot } from "@/components/ui/loading-mascot";

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
        <LoadingMascot message="Verificando autenticação..." size="lg" />
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : null;
};

export default ProtectedRoute;