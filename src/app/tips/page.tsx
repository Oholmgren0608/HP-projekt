import { Suspense } from "react";
import type { Metadata } from "next";
import { TipsView } from "@/components/tips-view";

export const metadata: Metadata = {
  title: "Tips",
  description: "Strategier och tips för att höja ditt HP-resultat.",
};

export default function TipsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-8 w-56 animate-pulse rounded-lg bg-[var(--mist)]" />
          <div className="h-48 animate-pulse rounded-[10px] bg-card/70" />
        </div>
      }
    >
      <TipsView />
    </Suspense>
  );
}
