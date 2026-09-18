import { storageGet, storageSet } from "@/lib/sync/storage-sync";

/**
 * Läser en JSON-serialiserad nyckel från storage och tolkar den.
 * Returnerar `fallback` om vi kör på servern, nyckeln saknas eller
 * tolkningen misslyckas.
 */
export function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = storageGet(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  storageSet(key, JSON.stringify(value));
}

/** Skickar en enkel DOM-händelse (no-op på servern). */
export function emitEvent(name: string): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(name));
}
