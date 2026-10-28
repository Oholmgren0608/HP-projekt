"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { CalendarCheck, Clapperboard, Search, ShieldCheck, Sparkles, UserPlus } from "lucide-react";
import { useStudiehjalpAccess } from "@/lib/studiehjalp/access";
import { StudiehjalpGate } from "./gate";
import { Notice, PageHeader } from "./ui";

function HubCard({
  href,
  icon: Icon,
  title,
  children,
  status,
}: {
  href?: string;
  icon: typeof Search;
  title: string;
  children: ReactNode;
  status?: string;
}) {
  const body = (
    <>
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--brand)]">
          <Icon size={18} aria-hidden />
        </span>
        <h2 className="text-base font-semibold text-[var(--ink)]">{title}</h2>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-[var(--ink-muted)]">{children}</p>
      {status ? <p className="mt-3 text-xs font-medium text-[var(--ink-muted)]">{status}</p> : null}
    </>
  );
  if (!href) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--line-strong)] bg-card/60 p-5" aria-disabled>
        {body}
      </div>
    );
  }
  return (
    <Link
      href={href}
      className="block rounded-xl border border-[var(--line)] bg-card p-5 transition-colors hover:border-[var(--line-strong)] hover:bg-[var(--mist)]"
    >
      {body}
    </Link>
  );
}

export function StudiehjalpHub() {
  return (
    <StudiehjalpGate flag="studiehjalp">
      <HubContent />
    </StudiehjalpGate>
  );
}

function HubContent() {
  const access = useStudiehjalpAccess();
  return (
    <div className="space-y-7">
      <PageHeader
        title="Studiehjälp"
        intro="Hitta en granskad expert för det delprov du vill bli bättre på, eller ansök om att bli expert själv."
      />

      {access.isStaff ? (
        <Notice>
          Studiehjälp är i pilot. Du ser den eftersom du är med i teamet. Delar som står på
          ”Bara teamet” i adminvyn syns inte för andra användare.
        </Notice>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {access.hasFlag("experts_public") ? (
          <HubCard href="/studiehjalp/experter" icon={Search} title="Hitta experter">
            Experter med minst 1,20 på högskoleprovet eller lärarlegitimation, granskade av HP Lift.
            Ordningen roteras varje dag – ingen kan betala för en bättre plats.
          </HubCard>
        ) : null}
        {access.hasFlag("experts_apply") ? (
          <HubCard href="/studiehjalp/bli-expert" icon={UserPlus} title="Bli expert">
            Har du minst 1,20 i totalresultat eller är du legitimerad lärare? Ansök, ladda upp ditt
            underlag och bli granskad.
          </HubCard>
        ) : null}
        {access.hasFlag("experts_apply") ? (
          <HubCard href="/studiehjalp/creator-studio" icon={Sparkles} title="Creator Studio">
            Din expertprofil: presentation, delprov, priser och om profilen ska synas.
          </HubCard>
        ) : null}
        <HubCard icon={Clapperboard} title="Videor och guider" status="Kommer senare">
          Videor och guider från experterna. Vi väljer videotjänst först.
        </HubCard>
        <HubCard icon={CalendarCheck} title="Mina bokningar" status="Kommer senare">
          Bokning och betalning av lektioner öppnar när betaltjänsten är på plats.
        </HubCard>
        {access.isStaff ? (
          <HubCard href="/studiehjalp/admin" icon={ShieldCheck} title="Admin">
            Granska ansökningar, hantera roller och funktionsflaggor och se loggen.
          </HubCard>
        ) : null}
      </div>
    </div>
  );
}
