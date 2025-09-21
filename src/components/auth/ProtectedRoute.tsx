import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      const isAuthenticated = localStorage.getItem("authenticated") === "true";
      const sessionExpiry = localStorage.getItem("sessionExpiry");
      const currentUser = localStorage.getItem("saf_current_user");
      
      if (!isAuthenticated || !currentUser) {
        navigate("/login");
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
        return;
      }
    };

    checkAuth();
  }, [navigate]);

  const isAuthenticated = localStorage.getItem("authenticated") === "true";
  
  return isAuthenticated ? <>{children}</> : null;
};

export default ProtectedRoute;