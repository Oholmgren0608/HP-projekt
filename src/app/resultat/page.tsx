import type { Metadata } from "next";
import { ResultsView } from "@/components/results-view";

export const metadata: Metadata = {
  title: "Resultat",
  description:
    "Mata in dina HP-resultat och delprovspoäng för att generera en ny personlig plan.",
};

export default function ResultsPage() {
  return <ResultsView />;
}
