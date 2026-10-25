import { Suspense } from "react";
import type { Metadata } from "next";
import { PlanView } from "@/components/plan-view";

export const metadata: Metadata = {
  title: "Veckoplan",
  description:
    "Din personliga veckoplan med prioriterade delprov, tidsfördelning och interaktiva övningar.",
};

export default function PlanPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-8 w-56 animate-pulse rounded-lg bg-[var(--mist)]" />
          <div className="h-48 animate-pulse rounded-[10px] bg-card/70" />
        </div>
      }
    >
      <PlanView />
    </Suspense>
  );
}
