import { PracticeSubtestSelector } from "@/components/practice-subtest-selector";
import type { PracticeKind } from "@/lib/practice";
import { notFound } from "next/navigation";

const VALID_SUBTESTS: PracticeKind[] = [
  "ord",
  "mek",
  "las",
  "elf",
  "xyz",
  "kva",
  "nog",
  "dtk",
];

export default async function SubtestPage(props: PageProps<"/ova/[subtest]">) {
  const { subtest: rawSubtest } = await props.params;
  const subtest = rawSubtest.toLowerCase();

  if (!VALID_SUBTESTS.includes(subtest as PracticeKind)) {
    notFound();
  }

  return <PracticeSubtestSelector subtest={subtest as PracticeKind} />;
}
