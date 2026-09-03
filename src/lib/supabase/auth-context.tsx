"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "./client";

type AuthState = {
  /** Inloggad användare, eller null. */
  user: User | null;
  /** Sant tills sessionen är läst från supabase-js (eller om Supabase saknas). */
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // Env-variabler är inbakade vid build: samma värde på server och klient,
  // så initialvärdet ger ingen hydreringsmismatch.
  const [loading, setLoading] = useState(() => isSupabaseConfigured());

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return; // Inte konfigurerat — loading är redan false.

    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) {
        setUser(data.session?.user ?? null);
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const value: AuthState = {
    user,
    loading,
    signInWithGoogle: async () => {
      const supabase = getSupabase();
      if (!supabase) return;
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
    },
    signOut: async () => {
      const supabase = getSupabase();
      if (!supabase) return;
      await supabase.auth.signOut();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth måste användas inuti <AuthProvider>");
  return ctx;
}
