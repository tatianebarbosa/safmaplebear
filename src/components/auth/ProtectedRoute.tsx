import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = localStorage.getItem("authenticated") === "true";
      const sessionExpiry = localStorage.getItem("sessionExpiry");
      const currentUser = localStorage.getItem("saf_current_user");
      
      if (!authenticated || !currentUser) {
        navigate("/login");
        setIsChecking(false);
        return;
      }

      // Verificar se é segunda-feira (forçar novo login)
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 = domingo, 1 = segunda
      
      // Verificar expiração da sessão
      if (sessionExpiry) {
        const expiry = new Date(sessionExpiry);
        if (now > expiry || dayOfWeek === 1) {
          localStorage.removeItem("authenticated");
          localStorage.removeItem("userEmail");
          localStorage.removeItem("saf_current_user");
          localStorage.removeItem("sessionExpiry");
          navigate("/login");
          setIsChecking(false);
          return;
        }
      }

      // Verificar se o domínio do email é permitido
      const user = JSON.parse(currentUser);
      const allowedDomains = ['@mbcentral.com.br', '@seb.com.br', '@sebsa.com.br'];
      const isAllowedDomain = allowedDomains.some(domain => 
        user.email.toLowerCase().includes(domain)
      );

      if (!isAllowedDomain) {
        localStorage.clear();
        navigate("/login");
        setIsChecking(false);
        return;
      }

      // Se chegou até aqui, está autenticado
      setIsAuthenticated(true);
      setIsChecking(false);
    };

    checkAuth();
  }, [navigate]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : null;
};

export default ProtectedRoute;