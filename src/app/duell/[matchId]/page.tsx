import { DuelMatchView } from "@/components/duel/duel-match";

export default async function DuelMatchPage(
  props: PageProps<"/duell/[matchId]">,
) {
  const { matchId } = await props.params;
  return <DuelMatchView matchId={matchId} />;
}
