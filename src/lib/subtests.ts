import type { PracticeKind } from "@/lib/practice";

/**
 * En enda källa till sanning för de åtta HP-delproven.
 *
 * Varje delprov har ett id (`SectionId`), ett övnings-`kind` (lägre-case,
 * kopplat till frågebankerna), fullständigt namn, kortetikett, antal frågor på
 * det riktiga provet, vilket block det tillhör samt mål-tempo i sekunder per
 * fråga (samma värden som tidigare användes i `practice-pace.ts`).
 */
export const SUBTESTS = [
  {
    id: "KVA",
    kind: "kva",
    name: "Kvantitativa jämförelser",
    short: "KVA",
    total: 20,
    block: "kvant",
    secPerQuestion: 70,
  },
  {
    id: "DTK",
    kind: "dtk",
    name: "Diagram, tabeller och kartor",
    short: "DTK",
    total: 24,
    block: "kvant",
    secPerQuestion: 100,
  },
  {
    id: "XYZ",
    kind: "xyz",
    name: "Matematik problemlösning",
    short: "XYZ",
    total: 24,
    block: "kvant",
    secPerQuestion: 82,
  },
  {
    id: "NOG",
    kind: "nog",
    name: "Kvantitativa resonemang",
    short: "NOG",
    total: 12,
    block: "kvant",
    secPerQuestion: 82,
  },
  {
    id: "ORD",
    kind: "ord",
    name: "Ordförståelse",
    short: "ORD",
    total: 20,
    block: "verbal",
    secPerQuestion: 50,
  },
  {
    id: "LAS",
    kind: "las",
    name: "Läsförståelse svenska",
    short: "LÄS",
    total: 20,
    block: "verbal",
    secPerQuestion: 110,
  },
  {
    id: "MEK",
    kind: "mek",
    name: "Meningskomplettering",
    short: "MEK",
    total: 20,
    block: "verbal",
    secPerQuestion: 75,
  },
  {
    id: "ELF",
    kind: "elf",
    name: "Läsförståelse engelska",
    short: "ELF",
    total: 20,
    block: "verbal",
    secPerQuestion: 110,
  },
] as const satisfies readonly {
  id: string;
  kind: Exclude<PracticeKind, "reflect">;
  name: string;
  short: string;
  total: number;
  block: "kvant" | "verbal";
  secPerQuestion: number;
}[];

export type Subtest = (typeof SUBTESTS)[number];
export type SectionId = Subtest["id"];

export const SUBTEST_BY_ID = SUBTESTS.reduce<Record<SectionId, Subtest>>(
  (acc, s) => {
    acc[s.id] = s;
    return acc;
  },
  {} as Record<SectionId, Subtest>,
);
