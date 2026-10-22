"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "./client";

/** Nuvarande URL utan hash — OAuth ska komma tillbaka till samma sida. */
function currentUrl(): string {
  if (typeof window === "undefined") return "";
  return window.location.origin + window.location.pathname + window.location.search;
}
import { onAuthChanged } from "@/lib/sync/storage-sync";

// Återställningslänken loggar in användaren (PASSWORD_RECOVERY). Flaggan ligger
// i sessionStorage eftersom inloggningens molnsynk kan ladda om sidan innan
// användaren hunnit välja ett nytt lösenord.
const RECOVERY_KEY = "hp-lift-password-recovery";

function readRecoveryFlag(): boolean {
  try {
    return window.sessionStorage.getItem(RECOVERY_KEY) === "1";
  } catch {
    return false;
  }
}

function writeRecoveryFlag(on: boolean) {
  try {
    if (on) window.sessionStorage.setItem(RECOVERY_KEY, "1");
    else window.sessionStorage.removeItem(RECOVERY_KEY);
  } catch {
    /* sessionStorage kan vara avstängt — prompten visas då bara till nästa reload */
  }
}

type AuthState = {
  /** Inloggad användare, eller null. */
  user: User | null;
  /** Sant tills sessionen är läst från supabase-js (eller om Supabase saknas). */
  loading: boolean;
  /** Unikt användarnamn från player_profiles, eller null om det ej valts. */
  username: string | null;
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
  /** Sant efter att en återställningslänk öppnats, tills lösenordsprompten stängts. */
  passwordRecovery: boolean;
  /** Sparar ett nytt lösenord för den inloggade användaren. */
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  /** Stänger "välj nytt lösenord" (efter bytet, eller utan att byta). */
  dismissPasswordRecovery: () => void;
  /** Skickar ett nytt bekräftelsemejl till en adress som inte hunnit bekräftas. */
  resendConfirmation: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  /** Sätter/sparar användarnamnet. Returnerar ett svenskt felmeddelande vid fel. */
  setUsername: (name: string) => Promise<{ error: string | null }>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsernameState] = useState<string | null>(null);
  // Env-variabler är inbakade vid build: samma värde på server och klient,
  // så initialvärdet ger ingen hydreringsmismatch.
  const [loading, setLoading] = useState(() => isSupabaseConfigured());
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  // Senast tillämpade användar-id, så att en långsam profilhämtning inte
  // skriver över en nyare användare (t.ex. vid snabb utloggning/inloggning).
  const appliedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return; // Inte konfigurerat — loading är redan false.

    let cancelled = false;
    const client = supabase;

    // Hämtar profilraden (skapar den vid behov) och returnerar användarnamnet.
    async function loadUsername(): Promise<string | null> {
      try {
        const { data, error } = await client.rpc("profile_ensure");
        if (error) {
          console.warn("[auth] profile_ensure:", error.message);
          return null;
        }
        return data?.username ?? null;
      } catch (e) {
        console.warn("[auth] profile_ensure:", e);
        return null;
      }
    }

    async function applyUser(u: User | null) {
      if (cancelled) return;
      const userId = u?.id ?? null;
      appliedUserIdRef.current = userId;
      setUser(u);

      if (userId) {
        // Håll loading kvar tills profilen (och därmed användarnamnet) lästs.
        const name = await loadUsername();
        if (cancelled || appliedUserIdRef.current !== userId) return;
        setUsernameState(name);
      } else {
        setUsernameState(null);
      }
      if (!cancelled) setLoading(false);
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) {
        // Efter en reload mitt i en återställning: fortsätt visa prompten.
        if (data.session?.user && readRecoveryFlag()) setPasswordRecovery(true);
        if (!data.session) writeRecoveryFlag(false);
        void applyUser(data.session?.user ?? null);
        onAuthChanged(data.session?.user?.id ?? null);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === "PASSWORD_RECOVERY") {
        writeRecoveryFlag(true);
        setPasswordRecovery(true);
      } else if (event === "SIGNED_OUT") {
        writeRecoveryFlag(false);
        setPasswordRecovery(false);
      }
      void applyUser(session?.user ?? null);
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
    username,
        signInWithGoogle: async () => {
      const supabase = getSupabase();
      if (!supabase) return;
      await supabase.auth.signInWithOAuth({
        provider: "google",
        // Behåll sökväg och query (t.ex. /duell?kod=ABC123) så djupa länkar
        // fungerar även när användaren måste logga in först.
        options: { redirectTo: currentUrl() },
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
    passwordRecovery,
    updatePassword: async (password) => {
      const supabase = getSupabase();
      if (!supabase) return { error: "Supabase är inte konfigurerat" };
      const { error } = await supabase.auth.updateUser({ password });
      if (error) return { error: error.message };
      // Klart — men prompten visar sin bekräftelse tills användaren stänger
      // den (dismissPasswordRecovery), så användarnamnsprompten inte hamnar ovanpå.
      writeRecoveryFlag(false);
      return { error: null };
    },
    dismissPasswordRecovery: () => {
      writeRecoveryFlag(false);
      setPasswordRecovery(false);
    },
    resendConfirmation: async (email) => {
      const supabase = getSupabase();
      if (!supabase) return { error: "Supabase är inte konfigurerat" };
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: window.location.origin },
      });
      return { error: error?.message ?? null };
    },
    signOut: async () => {
      const supabase = getSupabase();
      if (!supabase) return;
      await supabase.auth.signOut();
    },
    setUsername: async (name) => {
      const supabase = getSupabase();
      if (!supabase) return { error: "Supabase är inte konfigurerat" };
      const { data, error } = await supabase.rpc("profile_set_username", {
        p_username: name,
      });
      if (error) {
        const msg = error.message ?? "";
        if (msg.includes("TAKEN")) {
          return { error: "Användarnamnet är upptaget. Välj ett annat." };
        }
        if (msg.includes("INVALID")) {
          return { error: "3–20 tecken: bokstäver, siffror, _ eller -." };
        }
        return { error: error.message };
      }
      setUsernameState(data?.username ?? name);
      return { error: null };
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth måste användas inuti <AuthProvider>");
  return ctx;
}
