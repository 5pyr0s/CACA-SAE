import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import Spinner from "./Spinner";

/**
 * Route guard. Use as a layout route:
 *   <Route element={<RequireAuth />}> ...protected routes... </Route>
 * Waits for the first auth callback, then sends signed-out visitors to /login
 * and remembers where they were going.
 */
export function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner label="Checking your session…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

/** Admin-only routes. The custom claim is the source of truth, never a profile field. */
export function RequireAdmin() {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner label="Checking your session…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (!isAdmin) {
    return (
      <div className="p-10 bg-white rounded-xl border border-slate-200 text-center space-y-2">
        <h1 className="text-lg font-bold text-slate-800">Admins only</h1>
        <p className="text-sm text-slate-500">
          If you were just made an admin, sign out and sign in again to refresh your access.
        </p>
      </div>
    );
  }
  return <Outlet />;
}
