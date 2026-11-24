import { useState } from "react";
import { Link, useLocation } from "react-router";
import { sendPasswordReset } from "../../services/users";
import { authErrorMessage } from "./authErrors";
import { AuthCard, ErrorNote, Field } from "./AuthCard";

// UC-S2 step 2: "Forgot password" sends a reset link by email.
export default function ForgotPasswordPage() {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email ?? "");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await sendPasswordReset(email);
      setSent(true);
    } catch (err) {
      // Don't reveal whether an account exists for this address.
      if (err.code === "auth/user-not-found") setSent(true);
      else setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard
      title="Reset your password"
      subtitle="We'll email you a link to choose a new one."
      footer={
        <Link to="/login" className="font-medium text-indigo-600 hover:underline">
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        <p role="status" className="px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-800">
          If an account exists for {email.trim()}, a reset link is on its way. Check your spam folder too.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Field label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <ErrorNote message={error} />
          <button
            type="submit"
            disabled={busy || !email}
            className="w-full py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
          >
            {busy ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
