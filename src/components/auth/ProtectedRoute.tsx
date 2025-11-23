// src/components/auth/ProtectedRoute.tsx
import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { isAuthenticated } from "@/services/authService";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    // Verificar autenticação de forma assíncrona
    const checkAuth = () => {
      setIsAuth(isAuthenticated());
      setIsLoading(false);
    };

    // Simular pequeno delay para evitar flickering
    const timer = setTimeout(checkAuth, 50);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <Skeleton className="h-screen w-full" />;
  }

  if (!isAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
