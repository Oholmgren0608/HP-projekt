import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, BadgeCheck, GraduationCap, IdCard, FileCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate, formatHp, type CheckType } from "@/lib/studiehjalp/types";

/** Gemensamma byggstenar för Studiehjälps sidor, i samma stil som resten av appen. */

export const buttonClass = {
  primary:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--brand)] px-4 text-sm font-medium text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60",
  secondary:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[var(--line-strong)] bg-card px-4 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--mist)] disabled:cursor-not-allowed disabled:opacity-60",
  ghost:
    "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-[var(--brand)] transition hover:bg-[var(--accent-soft)] disabled:cursor-not-allowed disabled:opacity-60",
  danger:
    "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-[var(--coral-ink)] transition hover:bg-[var(--coral-soft)] disabled:cursor-not-allowed disabled:opacity-60",
};

export const inputClass =
  "w-full rounded-lg border border-[var(--line-strong)] bg-card px-3 py-2 text-sm text-[var(--ink)] outline-none ring-[var(--brand)] placeholder:text-[var(--ink-muted)] focus:ring-2";

export function PageHeader({
  title,
  intro,
  back,
}: {
  title: string;
  intro?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <header className="space-y-3">
      {back ? (
        <Link
          href={back.href}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--ink-muted)] hover:text-[var(--ink)]"
        >
          <ArrowLeft size={14} aria-hidden />
          {back.label}
        </Link>
      ) : null}
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--ink)] sm:text-4xl">
        {title}
      </h1>
      {intro ? <div className="max-w-2xl text-[var(--ink-muted)]">{intro}</div> : null}
    </header>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-xl border border-[var(--line)] bg-card p-5 sm:p-6", className)}>
      {children}
    </section>
  );
}

export function PanelTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-lg font-semibold text-[var(--ink)]">{children}</h2>;
}

const NOTICE_TONE = {
  info: "border-[var(--line)] bg-[var(--accent-soft)] text-[var(--ink)]",
  ok: "border-transparent bg-[var(--success-soft)] text-[var(--success-ink)]",
  warn: "border-transparent bg-[var(--energy-soft)] text-[var(--energy-ink)]",
  error: "border-transparent bg-[var(--coral-soft)] text-[var(--coral-ink)]",
};

export function Notice({
  tone = "info",
  children,
  className,
}: {
  tone?: keyof typeof NOTICE_TONE;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("rounded-lg border px-4 py-3 text-sm leading-relaxed", NOTICE_TONE[tone], className)}
    >
      {children}
    </div>
  );
}

export function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: ReactNode;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-[var(--ink)]">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-[var(--ink-muted)]">{hint}</p> : null}
    </div>
  );
}

export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-[var(--mist)] px-2.5 py-0.5 text-xs font-medium text-[var(--ink-soft)]",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ToggleChip({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-9 items-center rounded-full border px-3 text-sm font-medium transition-colors",
        pressed
          ? "border-[var(--brand)] bg-[var(--accent-soft)] text-[var(--brand)]"
          : "border-[var(--line-strong)] bg-card text-[var(--ink-soft)] hover:bg-[var(--mist)]",
      )}
    >
      {children}
    </button>
  );
}

/**
 * Märkena på en expert. Texterna säger exakt vad som har kontrollerats och hur
 * (specen §2.1, §3): inget märke påstår kontroll via myndighet.
 */
export function ExpertBadges({
  hpCheck,
  hpTotal,
  hpTest,
  teacherVerified,
  teacherSubjects,
  identityChecked,
  checkedAt,
  detailed = false,
}: {
  hpCheck: CheckType | null;
  hpTotal: number | null;
  hpTest: string | null;
  teacherVerified: boolean;
  teacherSubjects: string;
  identityChecked: boolean;
  checkedAt?: string | null;
  detailed?: boolean;
}) {
  const items: { icon: typeof BadgeCheck; title: string; detail: string }[] = [];
  if (hpCheck) {
    const score = hpTotal !== null ? ` ${formatHp(hpTotal)}` : "";
    const test = hpTest ? ` (${hpTest})` : "";
    items.push({
      icon: hpCheck === "live_portal" ? BadgeCheck : FileCheck,
      title:
        hpCheck === "live_portal"
          ? `Verifierat HP-resultat${score}`
          : `HP-resultat granskat${score}`,
      detail:
        hpCheck === "live_portal"
          ? `HP Lift har sett resultatet i den officiella resultattjänsten${test}. Minst 1,20 krävs.`
          : `HP Lift har granskat ett officiellt resultatbesked${test}. Minst 1,20 krävs. Resultatet är inte kontrollerat direkt hos myndigheten.`,
    });
  }
  if (teacherVerified) {
    items.push({
      icon: GraduationCap,
      title: "Legitimerad lärare",
      detail: `Kontrollerat i Skolverkets lärarregister${teacherSubjects ? ` – behörighet: ${teacherSubjects}` : ""}.`,
    });
  }
  if (identityChecked) {
    items.push({
      icon: IdCard,
      title: "ID-handling granskad",
      detail: "HP Lift har granskat en ID-handling manuellt. Det är inte en BankID-kontroll.",
    });
  }
  if (items.length === 0) return null;

  if (!detailed) {
    return (
      <ul className="flex flex-wrap gap-1.5" aria-label="Granskning">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.title}>
              <span
                title={item.detail}
                className="inline-flex items-center gap-1 rounded-full bg-[var(--success-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--success-ink)]"
              >
                <Icon size={13} aria-hidden />
                {item.title}
              </span>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <ul className="space-y-2.5" aria-label="Granskning">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <li key={item.title} className="flex gap-2.5">
            <Icon size={18} className="mt-0.5 shrink-0 text-[var(--success-ink)]" aria-hidden />
            <div>
              <p className="text-sm font-medium text-[var(--ink)]">{item.title}</p>
              <p className="text-xs text-[var(--ink-muted)]">
                {item.detail}
                {checkedAt ? ` Granskat ${formatDate(checkedAt)}.` : ""}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
