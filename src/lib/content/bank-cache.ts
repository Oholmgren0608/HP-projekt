/**
 * Frågebankens cache i IndexedDB.
 *
 * Med UHR-frågorna är banken över 3,5 miljoner tecken som JSON. I localStorage
 * (cirka 5 miljoner tecken per webbplats) skulle den ta nästan hela utrymmet
 * från användarens egna data, och då kan övningshistorik och felkort inte
 * sparas. IndexedDB har betydligt större kvot. Saknas IndexedDB eller går den
 * inte att öppna (privat läge i vissa webbläsare) finns ingen cache; den
 * bundlade banken fungerar ändå offline.
 */

const DB_NAME = "hp-lift";
const STORE = "cache";
/** En databas som inte öppnas (t.ex. blockerad av en annan flik) får inte hålla upp övningen. */
const OPEN_TIMEOUT_MS = 2_000;

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    let settled = false;
    const finish = (db: IDBDatabase | null) => {
      if (settled) {
        db?.close();
        return;
      }
      settled = true;
      clearTimeout(timer);
      resolve(db);
    };
    const timer = setTimeout(() => finish(null), OPEN_TIMEOUT_MS);
    try {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
      };
      request.onsuccess = () => finish(request.result);
      request.onerror = () => finish(null);
      request.onblocked = () => finish(null);
    } catch {
      finish(null);
    }
  });
}

/** Värdet för `key`, eller null om det saknas eller inte går att läsa. */
export async function readCacheValue<T>(key: string): Promise<T | null> {
  const db = await openDb();
  if (!db) return null;
  try {
    return await new Promise<T | null>((resolve) => {
      const request = db.transaction(STORE, "readonly").objectStore(STORE).get(key);
      request.onsuccess = () => resolve((request.result as T | undefined) ?? null);
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  } finally {
    db.close();
  }
}

/** Sparar `value` under `key`. Sant om det gick. */
export async function writeCacheValue(key: string, value: unknown): Promise<boolean> {
  const db = await openDb();
  if (!db) return false;
  try {
    return await new Promise<boolean>((resolve) => {
      const transaction = db.transaction(STORE, "readwrite");
      transaction.objectStore(STORE).put(value, key);
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => resolve(false);
      transaction.onabort = () => resolve(false);
    });
  } catch {
    return false;
  } finally {
    db.close();
  }
}
