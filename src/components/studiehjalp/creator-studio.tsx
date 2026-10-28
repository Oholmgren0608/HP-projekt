"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Eye, Loader2 } from "lucide-react";
import { SUBTESTS } from "@/lib/subtests";
import {
  fetchMyApplications,
  fetchMyProfile,
  saveProfile,
  setProfilePublished,
  type ProfileInput,
} from "@/lib/studiehjalp/api";
import { STATUS_LABEL, TRACK_LABEL, type ExpertProfileRow, type MyApplication } from "@/lib/studiehjalp/types";
import { Spinner, StudiehjalpGate } from "./gate";
import { buttonClass, Field, inputClass, Notice, PageHeader, Panel, PanelTitle, ToggleChip } from "./ui";

export function CreatorStudio() {
  return (
    <StudiehjalpGate flag="experts_apply" requireLogin loginNote="Logga in för att öppna Creator Studio.">
      <StudioContent />
    </StudiehjalpGate>
  );
}

type Loaded = { profile: ExpertProfileRow | null; approved: boolean; apps: MyApplication[] };

function StudioContent() {
  const [data, setData] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const fetchAll = useCallback(async (): Promise<Loaded | string> => {
    const [profile, apps] = await Promise.all([fetchMyProfile(), fetchMyApplications()]);
    if (!profile.ok) return profile.error;
    if (!apps.ok) return apps.error;
    return { profile: profile.data.profile, approved: profile.data.approved, apps: apps.data ?? [] };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetchAll().then((res) => {
      if (cancelled) return;
      if (typeof res === "string") setError(res);
      else setData(res);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchAll]);

  const reload = useCallback(async () => {
    const res = await fetchAll();
    if (typeof res === "string") setError(res);
    else setData(res);
  }, [fetchAll]);

  if (!data) return error ? <Notice tone="error">{error}</Notice> : <Spinner />;

  return (
    <div className="space-y-7">
      <PageHeader
        title="Creator Studio"
        back={{ href: "/studiehjalp", label: "Studiehjälp" }}
        intro="Här sköter du din expertprofil. Senare kommer också videor, guider och intäkter hit."
      />

      {data.apps.length === 0 ? (
        <Notice>
          Du behöver ansöka och bli godkänd som expert innan du kan publicera en profil.{" "}
          <Link href="/studiehjalp/bli-expert" className="font-medium text-[var(--brand)] hover:underline">
            Ansök om att bli expert
          </Link>
        </Notice>
      ) : (
        <Panel>
          <PanelTitle>Granskning</PanelTitle>
          <ul className="mt-3 space-y-1 text-sm text-[var(--ink-soft)]">
            {data.apps.map((a) => (
              <li key={a.id}>
                {TRACK_LABEL[a.track]}: <span className="font-medium text-[var(--ink)]">{STATUS_LABEL[a.status]}</span>
              </li>
            ))}
          </ul>
          {!data.approved ? (
            <p className="mt-3 text-sm text-[var(--ink-muted)]">
              Du kan fylla i profilen redan nu och publicera den när en ansökan är godkänd.{" "}
              <Link href="/studiehjalp/bli-expert" className="font-medium text-[var(--brand)] hover:underline">
                Till ansökan
              </Link>
            </p>
          ) : null}
        </Panel>
      )}

      {data.apps.length > 0 ? (
        <ProfileEditor
          key={data.profile ? "saved" : "new"}
          profile={data.profile}
          approved={data.approved}
          notice={notice}
          onNotice={setNotice}
          onChange={reload}
        />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Panel>
          <PanelTitle>Videor och guider</PanelTitle>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            Inte tillgängligt än. Uppladdning öppnar när vi har valt videotjänst.
          </p>
        </Panel>
        <Panel>
          <PanelTitle>Intäkter</PanelTitle>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            Inte tillgängligt än. Här visas bara verkliga, avräknade belopp när betalningar finns – inga
            uppskattningar.
          </p>
        </Panel>
      </div>
    </div>
  );
}

function toInput(p: ExpertProfileRow | null): ProfileInput {
  return {
    displayName: p?.display_name ?? "",
    headline: p?.headline ?? "",
    bio: p?.bio ?? "",
    method: p?.method ?? "",
    experience: p?.experience ?? "",
    subtests: p?.subtests ?? [],
    languages: p?.languages ?? ["svenska"],
    formats: p?.formats ?? ["online"],
    city: p?.city ?? "",
    price30: p?.price_30 ?? null,
    price60: p?.price_60 ?? null,
    price90: p?.price_90 ?? null,
    freeConsultation: p?.free_consultation ?? false,
    showHpScore: p?.show_hp_score ?? true,
  };
}

function ProfileEditor({
  profile,
  approved,
  notice,
  onNotice: setNotice,
  onChange,
}: {
  profile: ExpertProfileRow | null;
  approved: boolean;
  notice: { tone: "ok" | "error"; text: string } | null;
  onNotice: (notice: { tone: "ok" | "error"; text: string } | null) => void;
  onChange: () => Promise<void>;
}) {
  const [form, setForm] = useState<ProfileInput>(() => toInput(profile));
  const [languages, setLanguages] = useState(() => toInput(profile).languages.join(", "));
  const [busy, setBusy] = useState<"save" | "publish" | null>(null);

  const set = <K extends keyof ProfileInput>(key: K, value: ProfileInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));
  const toggle = (key: "subtests" | "formats", value: string) =>
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value],
    }));
  const price = (text: string) => (text.trim() === "" ? null : Math.round(Number(text)));

  async function handleSave() {
    setBusy("save");
    setNotice(null);
    const res = await saveProfile({
      ...form,
      languages: languages.split(",").map((l) => l.trim()).filter(Boolean),
    });
    setBusy(null);
    if (!res.ok) {
      setNotice({ tone: "error", text: res.error });
      return;
    }
    setNotice({ tone: "ok", text: "Profilen är sparad." });
    await onChange();
  }

  async function handlePublish(next: boolean) {
    setBusy("publish");
    setNotice(null);
    const res = await setProfilePublished(next);
    setBusy(null);
    if (!res.ok) {
      setNotice({ tone: "error", text: res.error });
      return;
    }
    await onChange();
  }

  return (
    <Panel>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PanelTitle>Din profil</PanelTitle>
        <div className="flex flex-wrap items-center gap-2">
          {profile ? (
            <Link href={`/studiehjalp/experter/${profile.public_id}`} className={buttonClass.ghost}>
              <Eye size={15} aria-hidden />
              Förhandsvisa
            </Link>
          ) : null}
          {profile ? (
            profile.published ? (
              <button type="button" className={buttonClass.secondary} onClick={() => void handlePublish(false)} disabled={busy !== null}>
                Avpublicera
              </button>
            ) : (
              <button
                type="button"
                className={buttonClass.primary}
                onClick={() => void handlePublish(true)}
                disabled={busy !== null || !approved}
                title={approved ? undefined : "Kan publiceras när ansökan är godkänd"}
              >
                {busy === "publish" ? <Loader2 size={16} className="animate-spin" aria-hidden /> : null}
                Publicera
              </button>
            )
          ) : null}
        </div>
      </div>
      <p className="mt-1 text-sm text-[var(--ink-muted)]">
        {profile?.published ? "Profilen är publicerad och syns i Hitta experter." : "Profilen är inte publicerad."}
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Visningsnamn" htmlFor="cs-name">
          <input id="cs-name" value={form.displayName} onChange={(e) => set("displayName", e.target.value)} maxLength={60} className={inputClass} />
        </Field>
        <Field label="Rubrik" htmlFor="cs-headline" hint="En mening om vad du hjälper till med.">
          <input id="cs-headline" value={form.headline} onChange={(e) => set("headline", e.target.value)} maxLength={120} className={inputClass} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Presentation" htmlFor="cs-bio">
            <textarea id="cs-bio" value={form.bio} onChange={(e) => set("bio", e.target.value)} maxLength={3000} rows={5} className={inputClass} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Så undervisar jag" htmlFor="cs-method">
            <textarea id="cs-method" value={form.method} onChange={(e) => set("method", e.target.value)} maxLength={2000} rows={3} className={inputClass} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Erfarenhet" htmlFor="cs-experience">
            <textarea id="cs-experience" value={form.experience} onChange={(e) => set("experience", e.target.value)} maxLength={2000} rows={3} className={inputClass} />
          </Field>
        </div>
      </div>

      <div className="mt-5">
        <p className="mb-2 text-sm font-medium text-[var(--ink)]">Delprov du undervisar i</p>
        <div className="flex flex-wrap gap-2">
          {SUBTESTS.map((s) => (
            <ToggleChip key={s.kind} pressed={form.subtests.includes(s.kind)} onClick={() => toggle("subtests", s.kind)}>
              {s.short}
            </ToggleChip>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-sm font-medium text-[var(--ink)]">Upplägg</p>
          <div className="flex flex-wrap gap-2">
            <ToggleChip pressed={form.formats.includes("online")} onClick={() => toggle("formats", "online")}>
              Online
            </ToggleChip>
            <ToggleChip pressed={form.formats.includes("fysiskt")} onClick={() => toggle("formats", "fysiskt")}>
              På plats
            </ToggleChip>
          </div>
        </div>
        <Field label="Ort (om du träffas på plats)" htmlFor="cs-city">
          <input id="cs-city" value={form.city} onChange={(e) => set("city", e.target.value)} maxLength={60} className={inputClass} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Språk" htmlFor="cs-languages" hint="Separera med kommatecken.">
            <input id="cs-languages" value={languages} onChange={(e) => setLanguages(e.target.value)} className={inputClass} />
          </Field>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {(
          [
            ["price30", "Pris 30 minuter"],
            ["price60", "Pris 60 minuter"],
            ["price90", "Pris 90 minuter"],
          ] as const
        ).map(([key, label]) => (
          <Field key={key} label={label} htmlFor={`cs-${key}`} hint="kr, 50–10 000">
            <input
              id={`cs-${key}`}
              type="number"
              inputMode="numeric"
              min={50}
              max={10000}
              step={10}
              value={form[key] ?? ""}
              onChange={(e) => set(key, price(e.target.value))}
              className={inputClass}
            />
          </Field>
        ))}
      </div>
      <p className="mt-2 text-xs text-[var(--ink-muted)]">
        Priserna visas som information. Bokning och betalning via HP Lift öppnar senare; då visas
        plattformens avgift och din andel innan någon bokar.
      </p>

      <div className="mt-5 space-y-2">
        <label className="flex items-start gap-2.5 text-sm text-[var(--ink)]">
          <input type="checkbox" checked={form.freeConsultation} onChange={(e) => set("freeConsultation", e.target.checked)} className="mt-0.5 size-4 accent-[var(--brand)]" />
          Första samtalet är gratis.
        </label>
        <label className="flex items-start gap-2.5 text-sm text-[var(--ink)]">
          <input type="checkbox" checked={form.showHpScore} onChange={(e) => set("showHpScore", e.target.checked)} className="mt-0.5 size-4 accent-[var(--brand)]" />
          Visa mitt granskade HP-resultat och provtillfälle på profilen.
        </label>
      </div>

      {notice ? (
        <Notice tone={notice.tone} className="mt-5">
          {notice.text}
        </Notice>
      ) : null}
      <button type="button" className={`${buttonClass.primary} mt-5`} onClick={() => void handleSave()} disabled={busy !== null}>
        {busy === "save" ? <Loader2 size={16} className="animate-spin" aria-hidden /> : null}
        Spara profilen
      </button>
    </Panel>
  );
}
