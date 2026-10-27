"use client";

import { useState } from "react";
import { OfficialExamsBrowser } from "@/components/official-exams-browser";
import { ProvpassSession, type ExamPhase } from "@/components/provpass-session";
import { TimedMockExam } from "@/components/timed-mock-exam";
import { cn } from "@/lib/utils";

type Mode = "provpass" | "snabbprov";

export function ExamsView() {
  // Medan ett prov pågår eller gås igenom visas bara det provet. Båda
  // komponenterna förblir monterade (bara dolda) så att inget tillstånd tappas.
  const [active, setActive] = useState<Mode | null>(null);

  const track = (mode: Mode) => (phase: ExamPhase) =>
    setActive(phase === "intro" ? null : mode);

  return (
    <div className="space-y-8 sm:space-y-10">
      {active === null ? (
        <div>
          <h1 className="text-[28px] leading-[34px] text-[var(--ink)] sm:text-4xl sm:leading-tight">
            Prov
          </h1>
          <p className="mt-2 max-w-2xl text-[var(--ink-muted)]">
            Träna i provets tempo med appens egna frågor, eller läs gamla provhäften från UHR.
          </p>
        </div>
      ) : null}

      <div className={cn("grid gap-4", active === null && "md:grid-cols-2")}>
        <div className={cn(active !== null && active !== "provpass" && "hidden")}>
          <ProvpassSession onPhaseChange={track("provpass")} />
        </div>
        <div className={cn(active !== null && active !== "snabbprov" && "hidden")}>
          <TimedMockExam onPhaseChange={track("snabbprov")} />
        </div>
      </div>

      {active === null ? <OfficialExamsBrowser /> : null}
    </div>
  );
}
