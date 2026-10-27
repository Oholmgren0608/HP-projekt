import type { Metadata } from "next";
import { ExamsView } from "@/components/exams-view";

export const metadata: Metadata = {
  title: "Prov",
  description:
    "Hela provpass och snabbprov i provets tempo, plus gamla högskoleprov (PDF från UHR).",
};

export default function ExamsPage() {
  return <ExamsView />;
}
