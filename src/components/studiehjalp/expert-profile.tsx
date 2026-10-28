"use client";

import { useEffect, useState } from "react";
import { MapPin, Video } from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-context";
import { fetchExpert } from "@/lib/studiehjalp/api";
import { FORMAT_LABEL, formatSek, type ExpertDirectoryEntry } from "@/lib/studiehjalp/types";
import { subtestLabel } from "./expert-search";
import { Spinner, StudiehjalpGate } from "./gate";
import { Chip, ExpertBadges, Notice, PageHeader, Panel, PanelTitle } from "./ui";

export function ExpertProfileView({ publicId }: { publicId: string }) {
  return (
    <StudiehjalpGate flag="experts_public">
      <ProfileContent publicId={publicId} />
    </StudiehjalpGate>
  );
}

function ProfileContent({ publicId }: { publicId: string }) {
  const { user } = useAuth();
  const [expert, setExpert] = useState<ExpertDirectoryEntry | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const viewerId = user?.id ?? null;

  useEffect(() => {
    let cancelled = false;
    void fetchExpert(publicId).then((res) => {
      if (cancelled) return;
      if (!res.ok) {
        setError(res.error);
        setState("error");
      } else if (!res.data) {
        setState("missing");
      } else {
        setExpert(res.data);
        setState("ready");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [publicId, viewerId]);

  if (state === "loading") return <Spinner />;
  if (state === "error") return <Notice tone="error">{error}</Notice>;
  if (state === "missing" || !expert) {
    return (
      <div className="space-y-5">
        <PageHeader title="Experten finns inte" back={{ href: "/studiehjalp/experter", label: "Alla experter" }} />
        <Notice>Profilen är inte publicerad, eller så finns den inte längre.</Notice>
      </div>
    );
  }

  const prices = [
    { label: "30 minuter", value: expert.price_30 },
    { label: "60 minuter", value: expert.price_60 },
    { label: "90 minuter", value: expert.price_90 },
  ].filter((p) => p.value !== null);

  return (
    <div className="space-y-6">
      <PageHeader
        title={expert.display_name}
        intro={expert.headline || undefined}
        back={{ href: "/studiehjalp/experter", label: "Alla experter" }}
      />

      {!expert.published ? (
        <Notice tone="warn">Förhandsvisning: profilen är inte publicerad och syns bara för dig.</Notice>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          {expert.bio ? (
            <Panel>
              <PanelTitle>Om mig</PanelTitle>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[var(--ink-soft)]">{expert.bio}</p>
            </Panel>
          ) : null}
          {expert.method ? (
            <Panel>
              <PanelTitle>Så undervisar jag</PanelTitle>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[var(--ink-soft)]">
                {expert.method}
              </p>
            </Panel>
          ) : null}
          {expert.experience ? (
            <Panel>
              <PanelTitle>Erfarenhet</PanelTitle>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[var(--ink-soft)]">
                {expert.experience}
              </p>
            </Panel>
          ) : null}
          <Panel>
            <PanelTitle>Omdömen</PanelTitle>
            <p className="mt-2 text-sm text-[var(--ink-muted)]">
              Inga omdömen än. Omdömen kan bara lämnas efter en genomförd och betald lektion via HP Lift,
              och bokning öppnar senare.
            </p>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel>
            <PanelTitle>Granskning</PanelTitle>
            <div className="mt-3">
              <ExpertBadges
                detailed
                hpCheck={expert.hp_check}
                hpTotal={expert.hp_total}
                hpTest={expert.hp_test}
                teacherVerified={expert.teacher_verified}
                teacherSubjects={expert.teacher_subjects}
                identityChecked={expert.identity_checked}
                checkedAt={expert.verified_at}
              />
            </div>
          </Panel>
          <Panel>
            <PanelTitle>Delprov och upplägg</PanelTitle>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {expert.subtests.map((s) => (
                <Chip key={s}>{subtestLabel(s)}</Chip>
              ))}
            </div>
            <ul className="mt-3 space-y-1.5 text-sm text-[var(--ink-soft)]">
              <li className="flex items-center gap-2">
                <Video size={15} className="text-[var(--ink-muted)]" aria-hidden />
                {expert.formats.map((f) => FORMAT_LABEL[f] ?? f).join(", ")}
              </li>
              {expert.city ? (
                <li className="flex items-center gap-2">
                  <MapPin size={15} className="text-[var(--ink-muted)]" aria-hidden />
                  {expert.city}
                </li>
              ) : null}
              {expert.languages.length > 0 ? <li>Språk: {expert.languages.join(", ")}</li> : null}
            </ul>
          </Panel>
          <Panel>
            <PanelTitle>Priser</PanelTitle>
            {prices.length > 0 ? (
              <ul className="mt-3 space-y-1 text-sm">
                {prices.map((p) => (
                  <li key={p.label} className="flex justify-between gap-3">
                    <span className="text-[var(--ink-soft)]">{p.label}</span>
                    <span className="font-medium text-[var(--ink)]">{formatSek(p.value)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-[var(--ink-muted)]">Inga priser angivna.</p>
            )}
            {expert.free_consultation ? (
              <p className="mt-3 text-sm text-[var(--ink-soft)]">Första samtalet är gratis.</p>
            ) : null}
            <p className="mt-3 text-xs text-[var(--ink-muted)]">
              Priserna sätter experten själv. Bokning och betalning via HP Lift öppnar senare; då visas
              totalpris och avgifter innan du betalar.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
