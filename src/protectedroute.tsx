import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: JSX.Element;
  allowedRoles?: string[];
}

/**
 * Guards protected screens by requiring a logged-in user
 * and optionally enforcing role-based permissions.
 */
export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const fullname = localStorage.getItem("fullname");
  const role = (localStorage.getItem("role") ?? "").toLowerCase();

  if (!fullname) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/guestdashboard" replace />;
  }

  return children;
}
