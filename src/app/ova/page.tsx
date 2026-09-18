import type { Metadata } from "next";
import { PracticeHubV2 } from "@/components/practice-hub-v2";

export const metadata: Metadata = {
  title: "Öva",
  description:
    "Öva på HP-delprov (ORD, MEK, LÄS, ELF, DTK, XYZ, KVA, NOG) — välj delprov och antal frågor.",
};

export default function PracticePage() {
  return <PracticeHubV2 />;
}
