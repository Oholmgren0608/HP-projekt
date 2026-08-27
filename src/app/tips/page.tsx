import { Suspense } from "react";
import { TipsView } from "@/components/tips-view";

export default function TipsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-8 w-56 animate-pulse rounded-lg bg-[var(--mist)]" />
          <div className="h-48 animate-pulse rounded-2xl bg-white/70" />
        </div>
      }
    >
      <TipsView />
    </Suspense>
  );
}
