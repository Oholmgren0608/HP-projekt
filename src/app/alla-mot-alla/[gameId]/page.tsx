import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AmaGame } from "@/components/alla-mot-alla/ama-game";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const metadata: Metadata = { title: "Alla mot alla" };

export default async function AllaMotAllaGamePage(props: PageProps<"/alla-mot-alla/[gameId]">) {
  const { gameId } = await props.params;
  if (!UUID_RE.test(gameId)) notFound();
  return <AmaGame gameId={gameId} />;
}
