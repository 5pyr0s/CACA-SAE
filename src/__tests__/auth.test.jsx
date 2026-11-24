import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { describe, expect, test } from "vitest";
import { AuthContext } from "../hooks/useAuth";
import { RequireAdmin, RequireAuth } from "../features/auth/RequireAuth";
import { authErrorMessage } from "../features/auth/authErrors";
import { formatDuration } from "../hooks/useCountdown";

function LoginProbe() {
  const location = useLocation();
  return <p>login page, from {location.state?.from?.pathname}</p>;
}

function renderAt(path, auth) {
  return render(
    <AuthContext.Provider value={{ user: null, profile: null, isAdmin: false, loading: false, refreshClaims: () => {}, ...auth }}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<LoginProbe />} />
          <Route element={<RequireAuth />}>
            <Route path="/offers" element={<p>offers page</p>} />
          </Route>
          <Route element={<RequireAdmin />}>
            <Route path="/admin" element={<p>admin page</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe("route guards", () => {
  test("shows a spinner, not a redirect, while auth is loading", () => {
    renderAt("/offers", { loading: true });
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText(/login page/)).not.toBeInTheDocument();
  });

  test("sends signed-out visitors to /login and remembers the page", () => {
    renderAt("/offers", {});
    expect(screen.getByText("login page, from /offers")).toBeInTheDocument();
  });

  test("lets signed-in students through", () => {
    renderAt("/offers", { user: { uid: "ana" } });
    expect(screen.getByText("offers page")).toBeInTheDocument();
  });

  test("admin pages need the admin claim", () => {
    renderAt("/admin", { user: { uid: "ana" } });
    expect(screen.getByText("Admins only")).toBeInTheDocument();
  });

  test("admins get in", () => {
    renderAt("/admin", { user: { uid: "ana" }, isAdmin: true });
    expect(screen.getByText("admin page")).toBeInTheDocument();
  });
});

describe("auth error messages", () => {
  test("wrong password and unknown user read the same (no account enumeration)", () => {
    expect(authErrorMessage({ code: "auth/wrong-password" })).toBe(authErrorMessage({ code: "auth/user-not-found" }));
  });
  test("closing the Google popup is silent", () => {
    expect(authErrorMessage({ code: "auth/popup-closed-by-user" })).toBeNull();
  });
  test("unknown codes get a generic message", () => {
    expect(authErrorMessage({ code: "auth/something-new" })).toMatch(/try again/);
  });
});

describe("countdown formatting", () => {
  test("formats hours, minutes and seconds", () => {
    expect(formatDuration(3 * 3600e3 + 5 * 60e3 + 9e3)).toBe("3h 05m 09s");
    expect(formatDuration(4 * 60e3 + 9e3)).toBe("4m 09s");
    expect(formatDuration(9e3)).toBe("9s");
  });
});
