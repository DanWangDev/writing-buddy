import { useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { AuthContext } from "./auth-context-value";
import * as api from "../services/api";
import { setSessionExpiredHandler } from "../services/api";

export { AuthContext } from "./auth-context-value";
export type { AuthContextValue } from "./auth-context-value";

function checkAccessDenied(): boolean {
  const params = new URLSearchParams(window.location.search);
  if (params.get("error") === "access_denied") {
    // Clean the URL
    const url = new URL(window.location.href);
    url.searchParams.delete("error");
    window.history.replaceState({}, "", url.toString());
    return true;
  }
  return false;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] =
    useState<
      ReturnType<typeof api.getMe> extends Promise<infer U> ? U | null : never
    >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccessDenied] = useState(checkAccessDenied);

  // Register global 401 handler — clears user state so ProtectedRoute redirects to login
  useEffect(() => {
    return setSessionExpiredHandler(() => {
      setUser(null);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    api
      .getMe()
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(() => {
    // Redirect to backend auth route — handles OIDC redirect + PKCE
    window.location.href = "/api/auth/login";
  }, []);

  const logout = useCallback(() => {
    // Clean up any legacy localStorage tokens
    api.clearTokens();
    // POST to backend logout — destroys session, redirects to hub end-session
    // Use form submission so the browser follows the 302 redirect chain.
    // Do NOT call setUser(null) here — it triggers a React re-render that
    // causes ProtectedRoute to navigate to /login, aborting the form POST
    // before the hub's OIDC session can be destroyed.
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/api/auth/logout";
    document.body.appendChild(form);
    form.submit();
  }, []);

  const value = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    isAccessDenied,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
