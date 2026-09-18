import { PracticeSubtestSelector } from "@/components/practice-subtest-selector";
import type { PracticeKind } from "@/lib/practice";
import { SUBTESTS } from "@/lib/subtests";
import { notFound } from "next/navigation";

const VALID_SUBTESTS: readonly PracticeKind[] = SUBTESTS.map((s) => s.kind);

export default async function SubtestPage(props: PageProps<"/ova/[subtest]">) {
  const { subtest: rawSubtest } = await props.params;
  const subtest = rawSubtest.toLowerCase();

  if (!VALID_SUBTESTS.includes(subtest as PracticeKind)) {
    notFound();
  }

  return <PracticeSubtestSelector subtest={subtest as PracticeKind} />;
}
