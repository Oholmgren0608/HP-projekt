/**
 * Läser alla rader sida för sida. Fungerar oavsett projektets radtak
 * (PostgREST `max_rows`, 1000 som standard): nästa sida börjar efter de rader
 * som faktiskt kom, så ett lägre tak kapar inte resultatet tyst. Frågan som
 * skickas in måste ha en entydig sortering. Begär den antalet
 * (`select(..., { count: "exact" })`) slutar läsningen när alla rader kommit;
 * annars när en tom sida kommer.
 *
 * Returnerar null om någon sida gav fel.
 */
export async function fetchAllPages<T>(
  fetchPage: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: unknown; count?: number | null }>,
  pageSize = 1000,
): Promise<T[] | null> {
  const rows: T[] = [];
  // Övre gräns som skydd mot en oändlig loop om servern skulle ignorera range.
  for (let pages = 0; pages < 1000; pages += 1) {
    const { data, error, count } = await fetchPage(rows.length, rows.length + pageSize - 1);
    if (error) return null;
    const page = data ?? [];
    rows.push(...page);
    if (page.length === 0 || (typeof count === "number" && rows.length >= count)) return rows;
  }
  return rows;
}
