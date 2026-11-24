import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../../hooks/useAuth";
import { observeAuth, observeProfile, readIsAdmin } from "../../services/users";

// One auth subscription for the whole app (Observer pattern). Stays in the
// loading state until the first callback, so a refresh never flashes /login.
export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(
    () =>
      observeAuth(async (u) => {
        setUser(u);
        if (!u) {
          setProfile(null);
          setIsAdmin(false);
          setLoading(false);
          return;
        }
        try {
          setIsAdmin(await readIsAdmin(u));
        } catch {
          setIsAdmin(false);
        }
        setLoading(false);
      }),
    []
  );

  // Live profile document; restarts whenever the signed-in uid changes.
  const uid = user?.uid;
  useEffect(() => {
    if (!uid) return undefined;
    return observeProfile(uid, setProfile, (err) => {
      console.error("[auth] profile listener stopped", err);
      setProfile(null);
    });
  }, [uid]);

  const refreshClaims = useCallback(async () => {
    if (user) setIsAdmin(await readIsAdmin(user, true));
  }, [user]);

  const value = useMemo(
    () => ({ user, profile, isAdmin, loading, refreshClaims }),
    [user, profile, isAdmin, loading, refreshClaims]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
