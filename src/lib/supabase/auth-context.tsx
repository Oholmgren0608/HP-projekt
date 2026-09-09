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
import { onAuthChanged } from "@/lib/sync/storage-sync";

type AuthState = {
  /** Inloggad användare, eller null. */
  user: User | null;
  /** Sant tills sessionen är läst från supabase-js (eller om Supabase saknas). */
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null }>;
  signUpWithEmail: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  sendPasswordReset: (email: string) => Promise<{ error: string | null }>;
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
      onAuthChanged(data.session?.user?.id ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      onAuthChanged(session?.user?.id ?? null);
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
    signInWithEmail: async (email, password) => {
      const supabase = getSupabase();
      if (!supabase) return { error: "Supabase är inte konfigurerat" };
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error?.message ?? null };
    },
    signUpWithEmail: async (email, password) => {
      const supabase = getSupabase();
      if (!supabase) {
        return { error: "Supabase är inte konfigurerat", needsConfirmation: false };
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      return {
        error: error?.message ?? null,
        needsConfirmation: data.session === null,
      };
    },
    sendPasswordReset: async (email) => {
      const supabase = getSupabase();
      if (!supabase) return { error: "Supabase är inte konfigurerat" };
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      return { error: error?.message ?? null };
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
