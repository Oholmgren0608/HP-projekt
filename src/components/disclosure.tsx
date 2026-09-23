"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type DisclosureProps = {
  /** Rubrik i den klickbara sammanfattningsraden. */
  title: ReactNode;
  /** Kort metarad under rubriken, t.ex. "8 delprov · 24 råd". */
  subtitle?: ReactNode;
  /** Liten etikett till höger om rubriken, t.ex. en badge. */
  hint?: ReactNode;
  /** Startar öppen (används när sektionen är mål för en ankarlänk, t.ex. /tips?section=MEK). */
  defaultOpen?: boolean;
  /** "inverted" = mörk panel (bg-foreground/text-background) i stället för kort. */
  variant?: "card" | "inverted";
  /** Får veta när sektionen öppnas/stängs (t.ex. för att kvittera "NY"-markeringar). */
  onOpenChange?: (open: boolean) => void;
  /** Sätts på <details> så att t.ex. #ankare och scroll-margin fungerar. */
  id?: string;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
};

/**
 * Vikbar sektion, alltid stängd när sidan laddas (även desktop) så att långa
 * sidor blir korta att skanna. Använder native <details>/<summary> för
 * tangentbord, skärmläsare och sökindexering; användarens egen växling vinner.
 */
export function Disclosure({
  title,
  subtitle,
  hint,
  defaultOpen = false,
  variant = "card",
  onOpenChange,
  id,
  className,
  bodyClassName,
  children,
}: DisclosureProps) {
  const [manual, setManual] = useState<boolean | null>(null);

  const open = manual ?? defaultOpen;
  const inverted = variant === "inverted";

  return (
    <details
      id={id}
      open={open}
      onToggle={(event) => {
        setManual(event.currentTarget.open);
        onOpenChange?.(event.currentTarget.open);
      }}
      className={cn(
        "group scroll-mt-24 overflow-hidden rounded-2xl border",
        inverted
          ? "border-transparent bg-foreground text-background"
          : "border-[var(--line)] bg-card/75",
        className,
      )}
    >
      <summary
        className={cn(
          "flex cursor-pointer list-none items-center gap-3 p-5 transition focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--ring)] sm:p-6 [&::-webkit-details-marker]:hidden",
          inverted ? "hover:bg-background/10" : "hover:bg-[var(--accent-soft)]/40",
        )}
      >
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span
              className={cn(
                "font-[family-name:var(--font-display)] text-xl sm:text-2xl",
                !inverted && "text-[var(--ink)]",
              )}
            >
              {title}
            </span>
            {hint}
          </span>
          {subtitle ? (
            <span
              className={cn(
                "mt-1 block text-sm",
                inverted ? "text-background/70" : "text-[var(--ink-muted)]",
              )}
            >
              {subtitle}
            </span>
          ) : null}
        </span>
        <ChevronDown
          className={cn(
            "size-5 shrink-0 transition-transform group-open:rotate-180",
            inverted ? "text-background/70" : "text-[var(--ink-muted)]",
          )}
          aria-hidden
        />
      </summary>
      <div
        className={cn(
          "border-t px-5 pb-5 pt-4 sm:px-6 sm:pb-6",
          inverted ? "border-background/15" : "border-[var(--line)]",
          bodyClassName,
        )}
      >
        {children}
      </div>
    </details>
  );
}
