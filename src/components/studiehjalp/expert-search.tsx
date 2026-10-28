"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MapPin, Search, Video } from "lucide-react";
import { SUBTESTS } from "@/lib/subtests";
import { searchExperts, type SearchFilters } from "@/lib/studiehjalp/api";
import { FORMAT_LABEL, formatSek, type ExpertSearchRow } from "@/lib/studiehjalp/types";
import { Spinner, StudiehjalpGate } from "./gate";
import { buttonClass, Chip, ExpertBadges, Field, inputClass, Notice, PageHeader, ToggleChip } from "./ui";

const PAGE = 30;

const INITIAL: SearchFilters = {
  subtest: null,
  format: null,
  language: null,
  maxPrice: null,
  minHp: null,
  query: "",
  sort: "rotation",
};

export function subtestLabel(kind: string): string {
  return SUBTESTS.find((s) => s.kind === kind)?.short ?? kind.toUpperCase();
}

export function ExpertSearch() {
  return (
    <StudiehjalpGate flag="experts_public">
      <SearchContent />
    </StudiehjalpGate>
  );
}

function SearchContent() {
  const [filters, setFilters] = useState<SearchFilters>(INITIAL);
  const [queryInput, setQueryInput] = useState("");
  const [languageInput, setLanguageInput] = useState("");
  const [rows, setRows] = useState<ExpertSearchRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fritext och språk skickas först när användaren har slutat skriva en stund.
  useEffect(() => {
    const query = queryInput.trim();
    const language = languageInput.trim() || null;
    if (query === filters.query && language === filters.language) return;
    const id = setTimeout(() => {
      setLoading(true);
      setFilters((f) => ({ ...f, query, language }));
    }, 300);
    return () => clearTimeout(id);
  }, [queryInput, languageInput, filters.query, filters.language]);

  useEffect(() => {
    let cancelled = false;
    void searchExperts(filters, PAGE, 0).then((res) => {
      if (cancelled) return;
      setLoading(false);
      if (!res.ok) {
        setError(res.error);
        setRows([]);
        setTotal(0);
        return;
      }
      setError(null);
      setRows(res.data);
      setTotal(Number(res.data[0]?.total_count ?? 0));
    });
    return () => {
      cancelled = true;
    };
  }, [filters]);

  function update(patch: Partial<SearchFilters>) {
    setLoading(true);
    setFilters((f) => ({ ...f, ...patch }));
  }

  async function loadMore() {
    const res = await searchExperts(filters, PAGE, rows.length);
    if (res.ok) setRows((r) => [...r, ...res.data]);
  }

  const filtered =
    filters.subtest !== null ||
    filters.format !== null ||
    filters.language !== null ||
    filters.maxPrice !== null ||
    filters.minHp !== null ||
    filters.query !== "";

  return (
    <div className="space-y-7">
      <PageHeader
        title="Hitta experter"
        back={{ href: "/studiehjalp", label: "Studiehjälp" }}
        intro={
          <>
            Alla experter är granskade av HP Lift: minst 1,20 på högskoleprovet eller lärarlegitimation
            kontrollerad i Skolverkets register. Ordningen roteras varje dag så att nya experter syns –
            ingen kan betala för en bättre plats.
          </>
        }
      />

      <div className="space-y-4 rounded-xl border border-[var(--line)] bg-card p-4 sm:p-5">
        <label className="relative block">
          <span className="sr-only">Sök på namn eller presentation</span>
          <Search
            size={16}
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]"
          />
          <input
            type="search"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder="Sök på namn eller presentation…"
            className={`${inputClass} pl-9`}
          />
        </label>

        <div>
          <p className="mb-2 text-sm font-medium text-[var(--ink)]">Delprov</p>
          <div className="flex flex-wrap gap-2">
            <ToggleChip pressed={filters.subtest === null} onClick={() => update({ subtest: null })}>
              Alla
            </ToggleChip>
            {SUBTESTS.map((s) => (
              <ToggleChip
                key={s.kind}
                pressed={filters.subtest === s.kind}
                onClick={() => update({ subtest: filters.subtest === s.kind ? null : s.kind })}
              >
                {s.short}
              </ToggleChip>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Upplägg" htmlFor="sh-format">
            <select
              id="sh-format"
              value={filters.format ?? ""}
              onChange={(e) => update({ format: e.target.value || null })}
              className={inputClass}
            >
              <option value="">Alla</option>
              <option value="online">Online</option>
              <option value="fysiskt">På plats</option>
            </select>
          </Field>
          <Field label="Språk" htmlFor="sh-language">
            <input
              id="sh-language"
              value={languageInput}
              onChange={(e) => setLanguageInput(e.target.value)}
              placeholder="t.ex. engelska"
              className={inputClass}
            />
          </Field>
          <Field label="Högst pris per timme" htmlFor="sh-price">
            <input
              id="sh-price"
              type="number"
              inputMode="numeric"
              min={0}
              step={50}
              value={filters.maxPrice ?? ""}
              onChange={(e) => update({ maxPrice: e.target.value ? Number(e.target.value) : null })}
              placeholder="kr"
              className={inputClass}
            />
          </Field>
          <Field
            label="Lägsta HP-resultat"
            htmlFor="sh-hp"
            hint={filters.minHp !== null ? "Visar bara experter som visar sitt resultat." : undefined}
          >
            <select
              id="sh-hp"
              value={filters.minHp ?? ""}
              onChange={(e) => update({ minHp: e.target.value ? Number(e.target.value) : null })}
              className={inputClass}
            >
              <option value="">Alla</option>
              {[1.2, 1.4, 1.6, 1.8].map((v) => (
                <option key={v} value={v}>
                  {v.toFixed(2).replace(".", ",")} eller mer
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Field label="Ordning" htmlFor="sh-sort">
            <select
              id="sh-sort"
              value={filters.sort}
              onChange={(e) => update({ sort: e.target.value as SearchFilters["sort"] })}
              className={inputClass}
            >
              <option value="rotation">Roterande (standard)</option>
              <option value="price">Lägst pris först</option>
              <option value="newest">Senast granskade först</option>
            </select>
          </Field>
          {filtered ? (
            <button
              type="button"
              className={buttonClass.ghost}
              onClick={() => {
                setQueryInput("");
                setLanguageInput("");
                update(INITIAL);
              }}
            >
              Rensa filter
            </button>
          ) : null}
        </div>
      </div>

      {error ? <Notice tone="error">{error}</Notice> : null}

      {loading ? (
        <Spinner label="Söker…" />
      ) : rows.length === 0 ? (
        <Notice>
          {filtered
            ? "Inga experter matchar filtren."
            : "Det finns inga publicerade experter än. Vill du bli den första? Ansök under Bli expert."}
        </Notice>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-[var(--ink-muted)]">
            {total === 1 ? "1 expert" : `${total} experter`}
          </p>
          <ul className="grid gap-3 md:grid-cols-2">
            {rows.map((row) => (
              <li key={row.public_id}>
                <ExpertCard row={row} />
              </li>
            ))}
          </ul>
          {rows.length < total ? (
            <button type="button" className={buttonClass.secondary} onClick={() => void loadMore()}>
              Visa fler
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}

function ExpertCard({ row }: { row: ExpertSearchRow }) {
  return (
    <Link
      href={`/studiehjalp/experter/${row.public_id}`}
      className="block h-full rounded-xl border border-[var(--line)] bg-card p-5 transition-colors hover:border-[var(--line-strong)] hover:bg-[var(--mist)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-[var(--ink)]">{row.display_name}</h2>
          {row.headline ? <p className="mt-0.5 text-sm text-[var(--ink-soft)]">{row.headline}</p> : null}
        </div>
        {row.price_60 !== null ? (
          <p className="shrink-0 text-right text-sm font-medium text-[var(--ink)]">
            {formatSek(row.price_60)}
            <span className="block text-xs font-normal text-[var(--ink-muted)]">per timme</span>
          </p>
        ) : null}
      </div>
      <div className="mt-3">
        <ExpertBadges
          hpCheck={row.hp_check}
          hpTotal={row.hp_total}
          hpTest={row.hp_test}
          teacherVerified={row.teacher_verified}
          teacherSubjects={row.teacher_subjects}
          identityChecked={row.identity_checked}
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {row.subtests.map((s) => (
          <Chip key={s}>{subtestLabel(s)}</Chip>
        ))}
      </div>
      <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--ink-muted)]">
        <span className="inline-flex items-center gap-1">
          <Video size={13} aria-hidden />
          {row.formats.map((f) => FORMAT_LABEL[f] ?? f).join(", ")}
        </span>
        {row.city ? (
          <span className="inline-flex items-center gap-1">
            <MapPin size={13} aria-hidden />
            {row.city}
          </span>
        ) : null}
        {row.languages.length > 0 ? <span>{row.languages.join(", ")}</span> : null}
        {row.free_consultation ? <span>Gratis första samtal</span> : null}
      </p>
    </Link>
  );
}
