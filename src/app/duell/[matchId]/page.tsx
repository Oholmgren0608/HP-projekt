import { notFound } from "next/navigation";
import { DuelMatchView } from "@/components/duel/duel-match";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function DuelMatchPage(
  props: PageProps<"/duell/[matchId]">,
) {
  const { matchId } = await props.params;
  // Malformerade id:n ger en riktig 404; ett välformat UUID som bara inte
  // finns behåller sin nuvarande in-page/Database-miss i DuelMatchView.
  if (!UUID_RE.test(matchId)) {
    notFound();
  }
  return <DuelMatchView matchId={matchId} />;
}
