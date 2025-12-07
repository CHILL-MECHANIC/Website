import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireComplete?: boolean;
}

export default function ProtectedRoute({ children, requireComplete = false }: ProtectedRouteProps) {
  const { isAuthenticated, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If profile completion is required and profile is incomplete, redirect to profile page
  if (requireComplete && profile && !profile.isProfileComplete) {
    return <Navigate to="/profile" replace />;
  }

  return <>{children}</>;
}

