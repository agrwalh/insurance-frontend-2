import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Loader from "../common/Loader";
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loader label="Checking your session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const fallback =
      user.role === "ADMIN"
        ? "/admin/dashboard"
        : user.role === "AGENT"
        ? "/agent/dashboard"
        : "/customer/dashboard";
    return <Navigate to={fallback} replace />;
  }

  return children;
}
