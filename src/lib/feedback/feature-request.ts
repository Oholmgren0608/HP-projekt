/**
 * Domänen för "Hjälp & feedback": två kanaler som delar samma fält och samma
 * kö i databasen (public.feature_requests, se 0015_feature_requests.sql).
 *
 * - idea    → 💡 Skicka önskemål (idéer, nya funktioner, förbättringar)
 * - problem → ⚠ Rapportera ett problem (buggar, felaktiga frågor, tekniska fel)
 *
 * Kanalernas texter ligger här (inte i formuläret) så att båda ingångarna -
 * profilen och sidfoten - visar exakt samma beskrivning.
 */

export type FeatureRequestKind = "idea" | "problem";

export type FeatureRequestStatus =
  | "new"
  | "reviewing"
  | "planned"
  | "implemented"
  | "declined";

export type FeatureRequestCategory =
  | "new_feature"
  | "improvement"
  | "questions"
  | "design"
  | "analytics"
  | "wrong_question"
  | "technical"
  | "account"
  | "duel"
  | "other";

export const REQUEST_LIMITS = {
  titleMin: 3,
  titleMax: 120,
  descriptionMin: 10,
  descriptionMax: 4000,
  reasonMax: 2000,
} as const;

export type RequestChannel = {
  kind: FeatureRequestKind;
  emoji: string;
  /** Kort etikett i menyer och kanalväljaren. */
  label: string;
  /** En rad om vad kanalen är till för. */
  description: string;
  /** Rubrik över formuläret. */
  heading: string;
  titlePlaceholder: string;
  descriptionLabel: string;
  descriptionPlaceholder: string;
  reasonLabel: string;
  reasonPlaceholder: string;
  submitLabel: string;
  successTitle: string;
  successBody: string;
};

export const REQUEST_CHANNELS: Record<FeatureRequestKind, RequestChannel> = {
  idea: {
    kind: "idea",
    emoji: "💡",
    label: "Skicka önskemål",
    description:
      "Har du en idé som kan göra HP-plattformen bättre? Skicka ditt förslag till oss.",
    heading: "Vad gäller ditt önskemål?",
    titlePlaceholder: "Exempel: Lägg till möjlighet att tävla mot vänner",
    descriptionLabel: "Beskriv ditt önskemål",
    descriptionPlaceholder:
      "Berätta vad du skulle vilja se på plattformen och hur du tycker att det borde fungera...",
    reasonLabel: "Varför skulle detta vara användbart? (valfritt)",
    reasonPlaceholder:
      "Beskriv gärna hur funktionen skulle hjälpa dig eller andra användare...",
    submitLabel: "Skicka önskemål",
    successTitle: "Tack för ditt förslag!",
    successBody:
      "Ditt önskemål har skickats och hjälper oss att utveckla plattformen vidare.",
  },
  problem: {
    kind: "problem",
    emoji: "⚠",
    label: "Rapportera ett problem",
    description:
      "Har något gått fel? Beskriv problemet så tittar vi på det — fel och buggar hör hemma här, idéer hör hemma i önskemålskanalen.",
    heading: "Vad gäller problemet?",
    titlePlaceholder: "Exempel: Rätt svar markeras som fel i XYZ",
    descriptionLabel: "Beskriv problemet",
    descriptionPlaceholder:
      "Beskriv vad som hände, var i appen det hände och vad du förväntade dig...",
    reasonLabel: "Hur kan vi återskapa problemet? (valfritt)",
    reasonPlaceholder:
      "Till exempel delprov, vilket prov, vilken webbläsare eller vilket steg som utlöste felet...",
    submitLabel: "Skicka problemrapport",
    successTitle: "Tack för din rapport!",
    successBody:
      "Din rapport har skickats och hjälper oss att hitta och rätta felet.",
  },
};

export const REQUEST_CATEGORIES: Record<
  FeatureRequestKind,
  { value: FeatureRequestCategory; label: string }[]
> = {
  idea: [
    { value: "new_feature", label: "Ny funktion" },
    { value: "improvement", label: "Förbättring av befintlig funktion" },
    { value: "questions", label: "Nya frågor eller prov" },
    { value: "design", label: "Design & användarupplevelse" },
    { value: "analytics", label: "Statistik & analys" },
    { value: "other", label: "Annat" },
  ],
  problem: [
    { value: "wrong_question", label: "Fel i en fråga eller ett prov" },
    { value: "technical", label: "Tekniskt fel (bugg)" },
    { value: "account", label: "Konto och inloggning" },
    { value: "duel", label: "Duell och matchning" },
    { value: "other", label: "Annat" },
  ],
};

/** Felmeddelande på svenska, eller null när allt är ifyllt och inom gränserna. */
export function validateFeatureRequest(input: {
  title: string;
  description: string;
  reason: string;
}): string | null {
  const title = input.title.trim();
  const description = input.description.trim();
  const reason = input.reason.trim();

  if (title.length < REQUEST_LIMITS.titleMin) return "Fyll i en rubrik.";
  if (title.length > REQUEST_LIMITS.titleMax) {
    return `Rubriken får vara högst ${REQUEST_LIMITS.titleMax} tecken.`;
  }
  if (description.length < REQUEST_LIMITS.descriptionMin) return "Fyll i en beskrivning.";
  if (description.length > REQUEST_LIMITS.descriptionMax) {
    return `Beskrivningen får vara högst ${REQUEST_LIMITS.descriptionMax} tecken.`;
  }
  if (reason.length > REQUEST_LIMITS.reasonMax) {
    return `Det valfria fältet får vara högst ${REQUEST_LIMITS.reasonMax} tecken.`;
  }
  return null;
}
