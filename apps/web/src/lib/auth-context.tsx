"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

interface AuthUser {
  userId: string;
  email: string;
  role: "ADMIN" | "ANALYST" | "VIEWER";
  name?: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  authFetch: (input: string, init?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const accessTokenRef = useRef<string | null>(null);
  accessTokenRef.current = accessToken;

  const refreshPromiseRef = useRef<Promise<boolean> | null>(null);

  const tryRefresh = useCallback(async (): Promise<boolean> => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    refreshPromiseRef.current = (async () => {
      try {
        const res = await fetch("/api/auth/refresh", { method: "POST", credentials: "include" });
        if (!res.ok) {
          setAccessToken(null);
          setUser(null);
          return false;
        }
        const data = await res.json();
        setAccessToken(data.data.accessToken);
        setUser(data.data.user);
        return true;
      } catch {
        return false;
      } finally {
        refreshPromiseRef.current = null;
      }
    })();

    return refreshPromiseRef.current;
  }, []);

  useEffect(() => {
    tryRefresh().finally(() => setIsLoading(false));
  }, [tryRefresh]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, message: data?.error?.message || "Login failed." };
      }
      setAccessToken(data.data.accessToken);
      setUser(data.data.user);
      return { success: true };
    } catch {
      return { success: false, message: "Could not connect to the server." };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  const authFetch = useCallback(
    async (input: string, init: RequestInit = {}) => {
      const doFetch = (token: string | null) =>
        fetch(input, {
          ...init,
          credentials: "include",
          headers: {
            ...(init.headers || {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

      let res = await doFetch(accessTokenRef.current);
      if (res.status === 401) {
        const refreshed = await tryRefresh();
        if (refreshed) {
          res = await doFetch(accessTokenRef.current);
        }
      }
      return res;
    },
    [tryRefresh]
  );

  return (
    <AuthContext.Provider value={{ user, accessToken, isLoading, login, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
