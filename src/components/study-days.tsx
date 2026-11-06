"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Timer } from "lucide-react";
import { formatDateLong } from "@/lib/exam-date";
import {
  DEFAULT_STUDY_DAYS,
  STUDY_DAYS_EVENT,
  WEEKDAY_NAMES,
  WEEKDAY_SHORT,
  SKIPPED_TASKS_EVENT,
  loadSkippedTasks,
  loadStudyDays,
  saveStudyDays,
  type SkippedTasks,
  weekdayOf,
  type TodayState,
  type TodayTask,
} from "@/lib/study-days";

/** Överhoppade pass, uppdaterade när de ändras här eller i en annan flik. */
export function useSkippedTasks(): SkippedTasks {
  const [skipped, setSkipped] = useState<SkippedTasks>(() =>
    typeof window === "undefined" ? {} : loadSkippedTasks(),
  );
  useEffect(() => {
    const refresh = () => setSkipped(loadSkippedTasks());
    window.addEventListener(SKIPPED_TASKS_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(SKIPPED_TASKS_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  return skipped;
}

/** Pluggdagarna, uppdaterade när de ändras här eller i en annan flik. */
export function useStudyDays(): [number[], (days: number[]) => void] {
  const [days, setDays] = useState<number[]>(() =>
    typeof window === "undefined" ? [...DEFAULT_STUDY_DAYS] : loadStudyDays(),
  );
  useEffect(() => {
    const refresh = () => setDays(loadStudyDays());
    window.addEventListener(STUDY_DAYS_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(STUDY_DAYS_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  const update = (next: number[]) => {
    if (next.length === 0) return; // minst en pluggdag
    saveStudyDays(next);
    setDays(loadStudyDays());
  };
  return [days, update];
}

/** Sju knappar, en per veckodag. Minst en dag måste vara vald. */
export function StudyDaysPicker({
  days,
  onChange,
  minutesPerDay,
}: {
  days: readonly number[];
  onChange: (days: number[]) => void;
  minutesPerDay: number | null;
}) {
  const selected = new Set(days);
  return (
    <fieldset className="mt-4 max-w-xl rounded-xl border border-[var(--line-strong)] bg-card/70 px-4 py-3">
      <legend className="sr-only">Pluggdagar</legend>
      <p className="text-sm font-medium text-[var(--ink)]">Pluggdagar</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {WEEKDAY_SHORT.map((label, day) => {
          const on = selected.has(day);
          return (
            <button
              key={label}
              type="button"
              aria-pressed={on}
              aria-label={WEEKDAY_NAMES[day]}
              disabled={on && selected.size === 1}
              onClick={() =>
                onChange(on ? days.filter((d) => d !== day) : [...days, day])
              }
              className={`min-h-11 min-w-11 rounded-lg border px-2 text-sm font-medium capitalize transition disabled:cursor-not-allowed ${
                on
                  ? "border-[var(--brand)] bg-[var(--accent-soft)] text-[var(--ink)]"
                  : "border-[var(--line-strong)] bg-card text-[var(--ink-muted)] hover:border-[var(--ink-soft)]"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-sm text-[var(--ink-muted)]">
        Veckans uppgifter fördelas på de här dagarna
        {minutesPerDay ? `, ungefär ${minutesPerDay} min per dag` : ""}.
      </p>
    </fieldset>
  );
}

function TaskLine({ item, onSkip }: { item: TodayTask; onSkip?: (item: TodayTask) => void }) {
  return (
    <li className="flex items-start gap-3">
      <span
        aria-hidden
        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border ${
          item.done ? "border-[var(--brand)] bg-[var(--brand)] text-primary-foreground" : "border-[var(--line-strong)]"
        }`}
      >
        {item.done ? <Check className="size-3" /> : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block font-medium ${item.done ? "text-[var(--ink-muted)] line-through" : "text-[var(--ink)]"}`}>
          {item.task.title}
        </span>
        <span className="flex items-center gap-1 text-xs text-[var(--ink-muted)]">
          <Timer className="size-3" aria-hidden />~{item.task.minutes} min
          {item.done ? " · klar" : ""}
          {!item.done && item.skipped
            ? " · överhoppad"
            : !item.done && item.movedFrom !== null
              ? ` · flyttad från ${WEEKDAY_NAMES[item.movedFrom]}`
              : ""}
        </span>
      </span>
      {onSkip && !item.done && !item.skipped ? (
        <button
          type="button"
          onClick={() => onSkip(item)}
          className="min-h-11 shrink-0 rounded-md px-2 text-sm font-medium text-[var(--brand)] underline-offset-4 hover:underline"
        >
          Hoppa över
        </button>
      ) : null}
    </li>
  );
}

const cardClass =
  "relative flex flex-col overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--card)] p-5 shadow-soft sm:p-6";

function startHref(item: TodayTask) {
  return `/plan?week=${item.week}&start=${encodeURIComponent(item.task.id)}`;
}

/** "Idag"-kortet på översikten: dagens pass enligt pluggdagarna. */
export function TodayCard({
  state,
  onSkip,
}: {
  state: TodayState;
  /** Hoppa över ett av dagens pass (flyttas till nästa pluggdag). */
  onSkip?: (item: TodayTask) => void;
}) {
  if (state.kind === "not-started") {
    return (
      <div className={cardClass}>
        <p className="text-[13px] font-medium text-[var(--ink-muted)]">Idag</p>
        <h2 className="mt-2 font-[family-name:var(--font-display)] font-semibold text-2xl text-[var(--ink)]">
          Planen börjar {formatDateLong(state.startsOn)}
        </h2>
        <p className="mt-2 font-medium text-[var(--ink-muted)]">
          Fram till dess kan du börja på vecka 1 eller öva fritt.
        </p>
        <div className="mt-auto flex flex-wrap gap-3 pt-5">
          <Link
            href="/plan"
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[var(--brand)] px-6 text-sm font-semibold text-primary-foreground shadow-soft transition hover:shadow-pop"
          >
            Se veckoplanen
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    );
  }

  // Missade pass har flyttats framåt (scheduleWeek). Får något inte plats har
  // veckan krympt: säg det lugnt, utan att räkna upp vad som missats.
  const earlier =
    state.dropped > 0 ? (
      <p className="mt-3 text-sm text-[var(--ink-muted)]">
        Veckan har krympt så att dagarna inte blir för tunga: {state.dropped} pass med lägst
        prioritet får inte plats längre.{" "}
        <Link href={`/plan?week=${state.week}`} className="font-medium text-[var(--brand)] underline-offset-4 hover:underline">
          Visa veckan
        </Link>
      </p>
    ) : null;

  if (state.kind === "rest-day") {
    return (
      <div className={cardClass}>
        <p className="text-[13px] font-medium text-[var(--ink-muted)]">Idag · vilodag</p>
        <h2 className="mt-2 font-[family-name:var(--font-display)] font-semibold text-2xl text-[var(--ink)]">
          Ingen uppgift idag
        </h2>
        {state.next ? (
          <>
            <p className="mt-2 font-medium text-[var(--ink-muted)]">
              Nästa pluggdag är {WEEKDAY_NAMES[weekdayOf(state.next.date)]} {formatDateLong(state.next.date)}:
            </p>
            <ul className="mt-3 space-y-3">
              {state.next.tasks.map((item) => (
                <TaskLine key={`${item.week}:${item.task.id}`} item={item} />
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-2 font-medium text-[var(--ink-muted)]">Vila, eller repetera med flashcards.</p>
        )}
        {earlier}
      </div>
    );
  }

  const next = state.tasks.find((t) => !t.done);
  return (
    <div className={cardClass}>
      <p className="text-[13px] font-medium text-[var(--ink-muted)]">
        Idag · vecka {state.week}
      </p>
      <h2 className="mt-2 font-[family-name:var(--font-display)] font-semibold text-2xl text-[var(--ink)]">
        {next ? "Dagens pass" : "Dagens pass är klara"}
      </h2>
      <ul className="mt-4 space-y-3">
        {state.tasks.map((item) => (
          <TaskLine key={item.task.id} item={item} onSkip={onSkip} />
        ))}
      </ul>
      {earlier}
      <div className="mt-auto flex flex-wrap gap-3 pt-5">
        {next ? (
          <Link
            href={startHref(next)}
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[var(--brand)] px-6 text-sm font-semibold text-primary-foreground shadow-soft transition hover:shadow-pop"
          >
            Starta övning
            <ArrowRight className="size-4" />
          </Link>
        ) : null}
        <Link
          href="/plan"
          className="inline-flex min-h-11 items-center rounded-md border border-[var(--line-strong)] bg-transparent px-5 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--mist)]"
        >
          Hela veckoplanen
        </Link>
      </div>
    </div>
  );
}
