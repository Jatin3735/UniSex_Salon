import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../context/authContext.js";
import Loader from "./Loader.jsx";

/**
 * Gate for authenticated (and optionally role-restricted) routes.
 *
 * `roles` omitted means "any signed-in user".
 */
export default function ProtectedRoute({ roles }) {
  const { user, ready } = useAuth();
  const location = useLocation();

  // Waiting on /me. Redirecting now would bounce a signed-in user to /login
  // on every hard refresh.
  if (!ready) return <Loader label="Checking your session…" />;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
}
