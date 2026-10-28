import type { Metadata } from "next";
import { ExpertApplication } from "@/components/studiehjalp/expert-application";

export const metadata: Metadata = {
  title: "Bli expert",
  description: "Ansök om att bli expert i HP Lifts Studiehjälp.",
};

export default function BecomeExpertPage() {
  return <ExpertApplication />;
}
