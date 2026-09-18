import type { Metadata } from "next";
import { DuelHub } from "@/components/duel/duel-hub";

export const metadata: Metadata = {
  title: "Duell",
  description:
    "Frågedueller mot andra spelare eller botar med ELO-ranking, matchmaking och privata matcher.",
};

export default async function DuelPage(props: PageProps<"/duell">) {
  const searchParams = await props.searchParams;
  const kod =
    typeof searchParams.kod === "string" ? searchParams.kod : "";

  return <DuelHub initialCode={kod} />;
}
