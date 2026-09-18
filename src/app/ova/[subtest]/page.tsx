import { PracticeSubtestSelector } from "@/components/practice-subtest-selector";
import type { PracticeKind } from "@/lib/practice";

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
    return (
      <div className="rounded-2xl border border-[var(--line)] bg-white/70 p-6">
        <p className="text-lg text-[var(--ink)]">Delprovet &quot;{subtest}&quot; hittades inte.</p>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Gå tillbaka till övningen och välj ett giltigt delprov.
        </p>
      </div>
    );
  }

  return <PracticeSubtestSelector subtest={subtest as PracticeKind} />;
}
