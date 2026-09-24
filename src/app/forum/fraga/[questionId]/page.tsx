import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ForumThreadScreen } from "@/components/forum/forum-thread";

// Fråge-id:n kommer från frågebankerna (t.ex. `ord-12`) och importerade prov;
// därför en tillåtande kontroll i stället för ett strikt mönster.
const QUESTION_ID_RE = /^[A-Za-z0-9_-]{1,80}$/;

export const metadata: Metadata = {
  title: "Diskussion",
};

export default async function ForumQuestionPage(
  props: PageProps<"/forum/fraga/[questionId]">,
) {
  const { questionId } = await props.params;
  if (!QUESTION_ID_RE.test(questionId)) {
    notFound();
  }
  return <ForumThreadScreen questionId={questionId} />;
}
