import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";

// wraps pages that need a logged-in user
export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p className="page-message">Loading…</p>; // show loading while user is being fetched
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />; // redirect to loginn if no user fetched
  return <Outlet />; // render page inside if everything good
}