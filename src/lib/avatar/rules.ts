/**
 * Regler och tolkning för den automatiska kontrollen av profilbilder
 * (docs/profilbild/plan.md). Själva anropet till Claude ligger i moderation.ts
 * (bara servern); det här är ren logik som går att testa. Importeras inte av
 * klienten, så att reglerna inte skickas med i webbläsarens bundle.
 */


export const MODERATION_SYSTEM_PROMPT = `Du granskar profilbilder i HP Lift, en studieapp för Högskoleprovet som används av gymnasieelever (ofta under 18) och vuxna. Bilden visas för andra användare i forum och spel.

Godkänn vanliga profilbilder: foton av personer (även ansikten), djur, natur, föremål, tecknat, mönster och logotyper som inte bryter mot reglerna.

Underkänn bilden om den innehåller något av följande:
- sexual: nakenhet, sexuellt eller utmanande innehåll, underkläder i sexuell pose
- violence: våld, blod, skador, vapen riktade mot någon eller vapen i hotfullt sammanhang
- drugs: droger, drogbruk eller tydlig alkoholhets
- hate: hatsymboler, extremistsymboler (t.ex. hakkors, SS-runor) eller nedsättande innehåll om en grupp
- harassment: kränkande, hotfull eller grov text eller gest riktad mot någon
- personal_info: telefonnummer, adress, e-post, användarnamn i sociala medier eller annan kontaktuppgift
- impersonation: skärmdump av en annan persons profil eller tydligt försök att utge sig för att vara någon annan (t.ex. personal i appen)
- self_harm: självskada eller uppmaning till självskada
- other: annat som är olämpligt för en studieapp med minderåriga

Är du osäker, underkänn. Svara bara med JSON enligt schemat. "reason" ska vara en kort förklaring på svenska som kan visas för användaren (högst 120 tecken, utan att beskriva bilden i detalj).`;

export const MODERATION_SCHEMA = {
  type: "object",
  properties: {
    allowed: { type: "boolean" },
    category: {
      type: "string",
      enum: ["ok", "sexual", "violence", "drugs", "hate", "harassment", "personal_info", "impersonation", "self_harm", "other"],
    },
    reason: { type: "string" },
  },
  required: ["allowed", "category", "reason"],
  additionalProperties: false,
} as const;

export type ModerationOutcome =
  | { decision: "approved" }
  | { decision: "rejected"; category: string; reason: string }
  /** Kontrollen gick inte att göra: bilden väntar på teamet. */
  | { decision: "unavailable"; detail: string };

/** Ett förenklat svar från Messages API (det som tolkningen behöver). */
export type ModerationResponse = {
  stop_reason: string | null;
  content: { type: string; text?: string }[];
};

const FALLBACK_REASON = "Bilden följer inte reglerna för profilbilder.";

/**
 * Tolkar Claudes svar. Ett avböjande (refusal) räknas som underkänt: modellen
 * vill inte bedöma bilden, och då ska den inte synas för minderåriga. Ett svar
 * som inte går att tolka lämnas till teamet.
 */
export function interpretModeration(response: ModerationResponse): ModerationOutcome {
  if (response.stop_reason === "refusal") {
    return { decision: "rejected", category: "other", reason: FALLBACK_REASON };
  }
  const text = response.content.find((b) => b.type === "text")?.text;
  if (!text) return { decision: "unavailable", detail: `inget svar (${response.stop_reason ?? "okänt"})` };
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { decision: "unavailable", detail: "svaret var inte JSON" };
  }
  if (!parsed || typeof parsed !== "object") return { decision: "unavailable", detail: "oväntat svar" };
  const { allowed, category, reason } = parsed as { allowed?: unknown; category?: unknown; reason?: unknown };
  if (typeof allowed !== "boolean") return { decision: "unavailable", detail: "oväntat svar" };
  // Ett "godkänt" med en överträdelsekategori är motsägelsefullt; var försiktig.
  if (allowed && (category === undefined || category === "ok")) return { decision: "approved" };
  const cleanReason =
    typeof reason === "string" && reason.trim().length > 0 ? reason.trim().slice(0, 160) : FALLBACK_REASON;
  return { decision: "rejected", category: typeof category === "string" ? category : "other", reason: cleanReason };
}
