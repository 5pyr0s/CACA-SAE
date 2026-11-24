import { createContext, useContext } from "react";

/**
 * Contract (agreed for everyone, Sprint 2):
 *   const { user, profile, isAdmin, loading } = useAuth();
 *
 *   loading  true until Firebase reports the first auth state. Render a spinner,
 *            never a login redirect, while it's true.
 *   user     the Firebase Auth user (uid, email, emailVerified, displayName,
 *            photoURL) or null when signed out.
 *   profile  live users/{uid} document ({ id, username, displayName, photoURL,
 *            faculty, bio, ratingAvg, ratingCount, createdAt }) or null. It can be
 *            null for a moment after signup, before the document exists, so fall
 *            back to user.displayName.
 *   isAdmin  true when the login token carries the admin custom claim.
 *   refreshClaims()  re-reads the token, e.g. right after an admin claim is set.
 */
export const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth() must be used inside <AuthProvider>");
  return ctx;
}
