import type { Metadata } from "next";
import { AmaHub } from "@/components/alla-mot-alla/ama-hub";

export const metadata: Metadata = {
  title: "Alla mot alla",
  description: "Gruppspel med HP-frågor: alla får samma fråga samtidigt, i privata rum eller mot slumpade motståndare.",
};

export default async function AllaMotAllaPage(props: PageProps<"/alla-mot-alla">) {
  const searchParams = await props.searchParams;
  const kod = typeof searchParams.kod === "string" ? searchParams.kod : "";
  return <AmaHub initialCode={kod} />;
}
