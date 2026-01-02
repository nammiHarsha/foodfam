import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/layout/Layout";
import { Skeleton } from "@/components/ui/skeleton";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "host" | "guest" | "traveler" | "foodie";
  redirectTo?: string;
}

/**
 * ProtectedRoute component that enforces authentication and role-based access.
 * 
 * - If auth is loading, shows a loading skeleton
 * - If no user is authenticated, redirects to /auth
 * - If a role is required and user doesn't have it, redirects to home
 * - Otherwise, renders the children
 */
export const ProtectedRoute = ({
  children,
  requiredRole,
  redirectTo = "/",
}: ProtectedRouteProps) => {
  const { user, roles, authLoading } = useAuth();

  // Show loading state while auth is hydrating
  if (authLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-10 w-48" />
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect if user doesn't have required role
  if (requiredRole && !roles.includes(requiredRole as any)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
