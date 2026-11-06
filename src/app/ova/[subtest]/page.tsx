import { PracticeSubtestSelector } from "@/components/practice-subtest-selector";
import type { PracticeKind } from "@/lib/practice";
import { SUBTESTS } from "@/lib/subtests";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

const VALID_SUBTESTS: readonly PracticeKind[] = SUBTESTS.map((s) => s.kind);

export async function generateMetadata(props: PageProps<"/ova/[subtest]">): Promise<Metadata> {
  const { subtest } = await props.params;
  const info = SUBTESTS.find((s) => s.kind === subtest.toLowerCase());
  return info ? { title: `Öva ${info.name.toLowerCase()}` } : {};
}

export default async function SubtestPage(props: PageProps<"/ova/[subtest]">) {
  const { subtest: rawSubtest } = await props.params;
  const subtest = rawSubtest.toLowerCase();

  if (!VALID_SUBTESTS.includes(subtest as PracticeKind)) {
    notFound();
  }

  return <PracticeSubtestSelector subtest={subtest as PracticeKind} />;
}
