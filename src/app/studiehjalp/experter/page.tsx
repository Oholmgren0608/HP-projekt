import type { Metadata } from "next";
import { ExpertSearch } from "@/components/studiehjalp/expert-search";

export const metadata: Metadata = {
  title: "Hitta experter",
  description: "Experter på högskoleprovet med granskat resultat eller lärarlegitimation.",
};

export default function ExpertsPage() {
  return <ExpertSearch />;
}
