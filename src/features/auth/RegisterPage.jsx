import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import { MIN_PASSWORD_LENGTH, registerWithEmail } from "../../services/users";
import { validateRegistration } from "./validation";
import { authErrorMessage } from "./authErrors";
import { AuthCard, Divider, ErrorNote, Field, GoogleButton } from "./AuthCard";

const EMPTY = { displayName: "", username: "", email: "", password: "", faculty: "" };

// UC-S1: register with Google or with email + password.
export default function RegisterPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname ?? "/";

  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  // While registering, the auth observer fires before the profile is written;
  // stay on this page until registerWithEmail resolves.
  if (!loading && user && !busy) return <Navigate to={from} replace />;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const problem = validateRegistration(form);
    if (problem) return setError(problem);

    setBusy(true);
    setError(null);
    try {
      await registerWithEmail(form);
      navigate(from, { replace: true });
    } catch (err) {
      setError(authErrorMessage(err));
      setBusy(false);
    }
  };

  return (
    <AuthCard
      title="Create your account"
      subtitle="You get 100 C.A.C.A Tokens when you sign up."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" state={location.state} className="font-medium text-indigo-600 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <GoogleButton label="Sign up with Google" onSuccess={() => navigate(from, { replace: true })} onError={setError} disabled={busy} />
      <Divider />
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field label="Full name" autoComplete="name" value={form.displayName} onChange={set("displayName")} />
        <Field
          label="Username"
          autoComplete="username"
          value={form.username}
          onChange={set("username")}
          hint="Shown on your listings. Lowercase letters, numbers, _ and ."
        />
        <Field label="Email" type="email" autoComplete="email" value={form.email} onChange={set("email")} />
        <Field
          label="Password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={set("password")}
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
        />
        <Field label="Faculty" placeholder="e.g. Automatică și Calculatoare" value={form.faculty} onChange={set("faculty")} />
        <ErrorNote message={error} />
        <button
          type="submit"
          disabled={busy}
          className="w-full py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
        >
          {busy ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthCard>
  );
}
