import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { loadJson, saveJson } from "@/lib/storage";
import { useHydrated } from "@/lib/use-hydrated";

/**
 * Delad load+save-mönster för komponenter som speglar en localStorage-nyckel
 * i React-tillstånd: `useState(() => loadX())` + `useEffect(() => saveX(value))`
 * gated bakom `useHydrated()`.
 *
 * - Initieras från `loadJson(key, fallback)` (fallback under SSR / när nyckeln
 *   saknas).
 * - Sparar via `saveJson` först efter hydrering, så att den serverrenderade
 *   fallbacken aldrig skriver över lagrad data.
 * - Returnerar även `ready` så att anropare som måste vänta på hydrering innan
 *   de renderar storage-härledd data kan behålla sitt nuvarande beteende.
 */
export function usePersistentState<T>(
  key: string,
  fallback: T,
): [T, Dispatch<SetStateAction<T>>, boolean] {
    const [value, setValue] = useState<T>(() => loadJson(key, fallback));
  const ready = useHydrated();
  const savedRef = useRef(JSON.stringify(value));

  useEffect(() => {
    if (!ready) return;
    // Skriv bara när något faktiskt ändrats: annars får nyckeln ny tidsstämpel
    // vid varje sidladdning och sync-mergen tror att lokalt är nyare än molnet.
    const serialized = JSON.stringify(value);
    if (serialized === savedRef.current) return;
    savedRef.current = serialized;
    saveJson(key, value);
  }, [key, value, ready]);

  return [value, setValue, ready];
}
