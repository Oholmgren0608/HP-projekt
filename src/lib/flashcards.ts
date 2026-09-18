import { ORD_BANK } from "@/lib/practice";
import { LIBRARY_TEXTS } from "@/lib/reading-library";

export type Flashcard = {
  id: string;
  front: string;
  back: string;
  source: string;
};

function fromOrdPrompt(prompt: string): string {
  const m =
    prompt.match(/ordet\s+[”"]([^”"]+)[”"]/i) ||
    prompt.match(/[”"]([^”"]+)[”"]/);
  return m?.[1] ?? prompt.replace(/^Vad betyder\s+/i, "").replace(/\?$/, "");
}

const ORD_CARDS: Flashcard[] = ORD_BANK.map((q) => ({
  id: `ord-${q.id}`,
  front: fromOrdPrompt(q.prompt),
  back: q.options[q.correctIndex],
  source: "ORD-bank",
}));

const READING_CARDS: Flashcard[] = LIBRARY_TEXTS.flatMap((t) =>
  t.focusWords.map((w) => ({
    id: `read-${t.id}-${w.word}`,
    front: w.word,
    back: w.meaning,
    source: t.title,
  })),
);

const CONNECTOR_CARDS: Flashcard[] = [
  { id: "kon-emellertid", front: "emellertid", back: "dock / trots det (kontrast)", source: "MEK-konnektorer" },
  { id: "kon-saledes", front: "således", back: "alltså / följaktligen (slutsats)", source: "MEK-konnektorer" },
  { id: "kon-daremot", front: "däremot", back: "i stället / å andra sidan (kontrast)", source: "MEK-konnektorer" },
  { id: "kon-foljaktligen", front: "följaktligen", back: "därför / som en följd (orsak→verkan)", source: "MEK-konnektorer" },
  { id: "kon-oaktat", front: "oaktat", back: "trots / oavsett (formellt)", source: "MEK-konnektorer" },
  { id: "kon-isynnerhet", front: "i synnerhet", back: "särskilt / framför allt", source: "MEK-konnektorer" },
  { id: "kon-respektive", front: "respektive", back: "var och en för sig / i tur och ordning", source: "MEK-konnektorer" },
  { id: "kon-destomer", front: "desto mer / ju … desto", back: "ju X, desto Y (korrelation)", source: "MEK-konnektorer" },
  { id: "kon-likval", front: "likväl", back: "ändå / trots det", source: "MEK-konnektorer" },
  { id: "kon-tvartom", front: "tvärtom", back: "motsatsen gäller", source: "MEK-konnektorer" },
  { id: "kon-dessutom", front: "dessutom", back: "utöver det / tillägg", source: "MEK-konnektorer" },
  { id: "kon-namligen", front: "nämligen", back: "förklaring / preciserar föregående", source: "MEK-konnektorer" },
];

/**
 * Unika kort: samma kategori + framsida behålls första gången. Kategorin
 * härleds ur id-prefixet ("ord-", "read-", "kon-") så att läsningskort vars
 * framsida krockar med ett ORD-kort (t.ex. "adekvat", "koherent",
 * "tautologi") inte längre slängs bort.
 */
function dedupe(cards: Flashcard[]): Flashcard[] {
  const seen = new Set<string>();
  const out: Flashcard[] = [];
  for (const c of cards) {
    const category = c.id.split("-")[0];
    const key = `${category}:${c.front.toLowerCase().trim()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}

export const ALL_FLASHCARDS = dedupe([
  ...ORD_CARDS,
  ...READING_CARDS,
  ...CONNECTOR_CARDS,
]);

export type DeckFilter = "alla" | "ord" | "lasning" | "konnektorer";

export function filterDeck(filter: DeckFilter): Flashcard[] {
  if (filter === "ord") return ALL_FLASHCARDS.filter((c) => c.id.startsWith("ord-"));
  if (filter === "lasning") return ALL_FLASHCARDS.filter((c) => c.id.startsWith("read-"));
  if (filter === "konnektorer") return ALL_FLASHCARDS.filter((c) => c.id.startsWith("kon-"));
  return ALL_FLASHCARDS;
}

export type CardProgress = {
  correct: number;
  wrong: number;
  last?: "correct" | "wrong";
};

export type ProgressMap = Record<string, CardProgress>;
