import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sidan finns inte",
};

export default function NotFound() {
  return (
    <div className="max-w-xl py-10">
      <p className="text-[13px] text-[var(--ink-muted)]">404</p>
      <h1 className="mt-2 text-[28px] leading-[34px] text-[var(--ink)]">Sidan finns inte</h1>
      <p className="mt-2 text-[var(--ink-muted)]">
        Länken kan vara fel eller gammal. Gå till översikten för att fortsätta plugga.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-10 items-center rounded-md bg-[var(--brand)] px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-[var(--brand-deep)]"
      >
        Till översikten
      </Link>
    </div>
  );
}
