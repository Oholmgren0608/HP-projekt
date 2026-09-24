import { Suspense } from "react";
import type { Metadata } from "next";
import { FeedbackForm } from "@/components/feedback/feedback-form";

export const metadata: Metadata = {
  title: "Hjälp & feedback",
  description:
    "Skicka önskemål, idéer och förbättringsförslag — eller rapportera ett problem med frågor, prov eller tekniken.",
};

export default function FeedbackPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-8 w-56 animate-pulse rounded-lg bg-[var(--mist)]" />
          <div className="h-64 animate-pulse rounded-2xl bg-[var(--mist)]" />
        </div>
      }
    >
      <FeedbackForm />
    </Suspense>
  );
}
