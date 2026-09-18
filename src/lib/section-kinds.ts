import type { PracticeKind } from "@/lib/practice-types";
import type { SectionId } from "@/lib/study-plan";

export const KIND_TO_SECTION: Record<Exclude<PracticeKind, "reflect">, SectionId> = {
  ord: "ORD",
  mek: "MEK",
  las: "LAS",
  elf: "ELF",
  dtk: "DTK",
  xyz: "XYZ",
  kva: "KVA",
  nog: "NOG",
};

export function kindToSection(kind: string): SectionId | null {
  const k = kind.toLowerCase() as Exclude<PracticeKind, "reflect">;
  return KIND_TO_SECTION[k] ?? null;
}

export function sectionToKinds(id: SectionId): PracticeKind[] {
  return [id.toLowerCase() as Exclude<PracticeKind, "reflect">];
}
