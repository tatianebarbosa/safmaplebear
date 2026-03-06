import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  clearAuthStateStorage,
  getAuthToken,
  getUserFromToken,
  isAuthenticated,
} from "@/services/authService";
import { useAuthStore } from "@/stores/authStore";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    const valid = isAuthenticated();

    if (!valid) {
      clearAuthStateStorage();
      useAuthStore.getState().setCurrentUser(null);
      setIsAuth(false);
      setIsLoading(false);
      return;
    }

    const tokenUser = getUserFromToken(token);
    if (tokenUser) {
      useAuthStore.getState().setCurrentUser(tokenUser);
    }

    setIsAuth(Boolean(token && valid));
    setIsLoading(false);
  }, [location.pathname, location.search]);

  if (isLoading) {
    return <Skeleton className="h-screen w-full" />;
  }

  if (!isAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
