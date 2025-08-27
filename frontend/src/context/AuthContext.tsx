import { createContext, useEffect, useState, useCallback } from "react";
import type { Session } from "../types";
import { saveToStorage, clearUserStorage } from "../utils/storage";

const AuthContext = createContext<{
  session: Session | null;
  isLoading: boolean;
  refreshSession: () => Promise<void>;
  signOut: () => Promise<void>;
}>({
  session: null,
  isLoading: true,
  refreshSession: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const AUTH_URL = import.meta.env.VITE_AUTH_URL;

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch(`${AUTH_URL}/api/auth/session`, {
        credentials: "include",
      });
      const data = await res.json();

      if (data?.user) {
        setSession(data);
      } else {
        setSession(null);
      }
    } catch (error) {
      console.error("Failed to fetch session", error);
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  }, [AUTH_URL]);

  const signOut = async () => {
    try {
      window.location.href = `${AUTH_URL}/api/auth/signout`;
    } catch (error) {
      console.error("Sign out failed", error);
    } finally {
      saveToStorage("redirectAfterLogin", window.location.pathname);
      await refreshSession();
    }
  };
  const safeSignOut = async () => {
    await signOut();

    if (session?.user.id) {
      clearUserStorage(session.user.id);
    }
  };

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  return (
    <AuthContext.Provider
      value={{ session, isLoading, refreshSession, signOut: safeSignOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
