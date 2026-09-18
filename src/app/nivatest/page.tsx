import type { Metadata } from "next";
import { MiniLevelTest } from "@/components/mini-level-test";

export const metadata: Metadata = {
  title: "Nivåtest",
  description:
    "Kort minitest med frågor från alla delprov — uppskattar din nivå och bygger veckoplanen.",
};

export default function NivatestPage() {
  return <MiniLevelTest />;
}
