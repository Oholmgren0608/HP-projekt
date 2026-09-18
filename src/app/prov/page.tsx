import type { Metadata } from "next";
import { ExamsView } from "@/components/exams-view";

export const metadata: Metadata = {
  title: "Gamla prov",
  description:
    "Officiella gamla högskoleprov (PDF från UHR) för realistisk provträning.",
};

export default function ExamsPage() {
  return <ExamsView />;
}
