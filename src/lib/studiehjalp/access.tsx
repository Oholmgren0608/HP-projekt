"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/supabase/auth-context";
import { getSupabase } from "@/lib/supabase/client";
import type { StaffRole } from "./types";

/**
 * Vad den inloggade (eller utloggade) användaren får se av Studiehjälp:
 * funktionsflaggor och egna roller, från RPC:n studiehjalp_access. Används för
 * att visa fliken och länkar – själva behörigheten avgörs alltid i databasen.
 * Om RPC:n saknas (före migration 0029) eller misslyckas visas ingenting.
 */
type AccessState = { flags: Record<string, boolean>; roles: StaffRole[]; loading: boolean };
type Access = AccessState & {
  hasFlag: (key: string) => boolean;
  hasRole: (role: StaffRole) => boolean;
  isStaff: boolean;
  refresh: () => Promise<void>;
};

const EMPTY: AccessState = { flags: {}, roles: [], loading: false };

const AccessContext = createContext<Access>({
  ...EMPTY,
  loading: true,
  hasFlag: () => false,
  hasRole: () => false,
  isStaff: false,
  refresh: async () => {},
});

async function fetchAccess(): Promise<AccessState> {
  const supabase = getSupabase();
  if (!supabase) return EMPTY;
  const { data, error } = await supabase.rpc("studiehjalp_access");
  const row = Array.isArray(data) ? data[0] : null;
  if (error || !row) return EMPTY;
  return { flags: row.flags ?? {}, roles: (row.roles ?? []) as StaffRole[], loading: false };
}

export function StudiehjalpAccessProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<AccessState>({ ...EMPTY, loading: true });
  const userId = user?.id ?? null;

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    void fetchAccess().then((next) => {
      if (!cancelled) setState(next);
    });
    return () => {
      cancelled = true;
    };
  }, [authLoading, userId]);

  const refresh = useCallback(async () => {
    setState(await fetchAccess());
  }, []);

  const value: Access = {
    ...state,
    hasFlag: (key) => state.flags[key] === true,
    hasRole: (role) => state.roles.includes(role),
    isStaff: state.roles.length > 0,
    refresh,
  };
  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}

export function useStudiehjalpAccess(): Access {
  return useContext(AccessContext);
}
