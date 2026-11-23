import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import { signInWithEmail } from "../../services/users";
import { authErrorMessage } from "./authErrors";
import { AuthCard, Divider, ErrorNote, Field, GoogleButton } from "./AuthCard";

// UC-S2: log in with Google or email + password.
export default function LoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (!loading && user) return <Navigate to={from} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signInWithEmail(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(authErrorMessage(err));
      setBusy(false);
    }
  };

  return (
    <AuthCard
      title="Sign in"
      subtitle="Welcome back to C.A.C.A."
      footer={
        <>
          New here?{" "}
          <Link to="/register" state={location.state} className="font-medium text-indigo-600 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <GoogleButton onSuccess={() => navigate(from, { replace: true })} onError={setError} disabled={busy} />
      <Divider />
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="flex justify-end -mt-2">
          <Link to="/forgot-password" state={{ email }} className="text-xs font-medium text-indigo-600 hover:underline">
            Forgot password?
          </Link>
        </div>
        <ErrorNote message={error} />
        <button
          type="submit"
          disabled={busy || !email || !password}
          className="w-full py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthCard>
  );
}
