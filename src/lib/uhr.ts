/**
 * UHR:s frågor ur tidigare högskoleprov (Provfrågor, id "hp-<datum>-p<n>-q<m>").
 *
 * Sedan 0040 får de kvantitativa (XYZ, KVA, NOG, DTK) publiceras: UHR har gett
 * tillstånd (docs/juridik/uhr-tillstand-kvant.md). De verbala är fortfarande
 * spärrade i databasen och når aldrig klienten. UHR-frågorna väljs före
 * AI-frågorna (`preferUhr`), och varje UHR-fråga visar sin källa (`uhrSource`).
 */

/** Delprov där UHR:s frågor får visas. */
export const UHR_KINDS: readonly string[] = ["xyz", "kva", "nog", "dtk"];

export function isUhrQuestionId(id: string): boolean {
  return id.startsWith("hp-");
}

/** En UHR-fråga som får visas: kvantitativ. Verbala UHR-frågor visas aldrig. */
export function isAllowedUhrQuestion(q: { id: string; kind: string }): boolean {
  return isUhrQuestionId(q.id) && UHR_KINDS.includes(q.kind);
}

/** Importens platshållare i stället för en förklaring (scripts/import-prov/insert.ts). */
export function isPlaceholderExplain(explain: string | null | undefined): boolean {
  const t = (explain ?? "").trim();
  return t === "" || t.startsWith("Förklaring saknas ännu") || t.startsWith("FLAGGOR:");
}

/**
 * Får Provfrågan publiceras? Samma regel som databasens villkor
 * questions_provfraga_publicering (0040): UHR-id med exam_id, kvantitativt
 * delprov, övningspoolen och en riktig förklaring.
 */
export function isPublishableProvfraga(q: {
  id: string;
  kind: string;
  examId: string | null;
  explain: string | null;
  pool?: string | null;
}): boolean {
  return (
    q.examId != null &&
    isUhrQuestionId(q.id) &&
    UHR_KINDS.includes(q.kind) &&
    (q.pool ?? "ovning") === "ovning" &&
    !isPlaceholderExplain(q.explain)
  );
}

const MONTHS = [
  "januari", "februari", "mars", "april", "maj", "juni",
  "juli", "augusti", "september", "oktober", "november", "december",
];
/** År med två vårprov; där skrivs datumet ut för att skilja dem åt. */
const TWO_SPRING_EXAMS = new Set([2021, 2022]);

/**
 * Källan till en UHR-fråga, t.ex. "Högskoleprovet hösten 2019, provpass 1,
 * uppgift 3". null för appens egna frågor.
 */
export function uhrSource(id: string): string | null {
  const m = /^hp-(\d{4})-(\d{2})-(\d{2})-p(\d)-q(\d{1,2})$/.exec(id);
  if (!m) return null;
  const [year, month, day, pass, number] = m.slice(1).map(Number);
  if (month < 1 || month > 12) return null;
  const season = month <= 6 ? "våren" : "hösten";
  const date = month <= 6 && TWO_SPRING_EXAMS.has(year) ? ` (${day} ${MONTHS[month - 1]})` : "";
  return `Högskoleprovet ${season} ${year}${date}, provpass ${pass}, uppgift ${number}`;
}

/**
 * UHR-frågorna först, sedan appens egna (stabil: ordningen inom varje grupp
 * behålls). Används inom varje nivå i frågevalet, så att osedda frågor
 * fortfarande går före sedda.
 */
export function preferUhr<T extends { id: string }>(questions: T[]): T[] {
  const uhr: T[] = [];
  const own: T[] = [];
  for (const q of questions) (isUhrQuestionId(q.id) ? uhr : own).push(q);
  return uhr.length === 0 ? questions : [...uhr, ...own];
}
