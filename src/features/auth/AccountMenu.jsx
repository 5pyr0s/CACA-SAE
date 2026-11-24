import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import { resendVerificationEmail, signOutUser } from "../../services/users";

/** Right side of the navbar: "Sign in" when signed out, name + sign out when signed in. */
export function AccountMenu() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return <span className="w-16 h-4 rounded bg-slate-100 animate-pulse" />;
  if (!user) {
    return (
      <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
        Sign In
      </Link>
    );
  }

  const name = profile?.displayName || user.displayName || user.email;
  const handleSignOut = async () => {
    await signOutUser();
    navigate("/");
  };

  return (
    <div className="flex items-center gap-3">
      <Link to={`/profile/${user.uid}`} className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900">
        {user.photoURL ? (
          <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="h-7 w-7 rounded-full object-cover" />
        ) : (
          <span className="h-7 w-7 rounded-full bg-indigo-100 text-indigo-700 grid place-items-center text-xs font-bold">
            {name?.[0]?.toUpperCase()}
          </span>
        )}
        <span className="hidden xl:inline max-w-32 truncate">{name}</span>
      </Link>
      <button type="button" onClick={handleSignOut} className="text-sm font-medium text-slate-500 hover:text-slate-900">
        Sign out
      </button>
    </div>
  );
}

/** Thin banner under the navbar until an email/password user verifies their address. */
export function VerifyEmailBanner() {
  const { user } = useAuth();
  const [state, setState] = useState("idle");
  if (!user || user.emailVerified) return null;

  const resend = async () => {
    setState("sending");
    try {
      await resendVerificationEmail();
      setState("sent");
    } catch {
      setState("error");
    }
  };

  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-900 text-sm">
      <div className="max-w-6xl mx-auto px-4 py-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span>Check {user.email} for a link to verify your email address.</span>
        {state === "sent" ? (
          <span className="font-medium">Sent. Refresh this page after you click the link.</span>
        ) : (
          <button type="button" onClick={resend} disabled={state === "sending"} className="font-semibold underline disabled:opacity-50">
            {state === "error" ? "Couldn't send, try again" : "Resend email"}
          </button>
        )}
      </div>
    </div>
  );
}
