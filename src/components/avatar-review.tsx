"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabase, requireSupabase, type Database } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/auth-context";
import { LoginPanel } from "@/components/auth/login-panel";
import { avatarUrl } from "@/lib/avatar/store";
import { decideAvatar } from "@/app/admin/profilbilder/actions";

type QueueItem = Database["public"]["Functions"]["avatar_review_queue"]["Returns"][number];

/** Teamets granskningskö för profilbilder (rollerna admin och moderator). */
export function AvatarReview() {
  const { user, loading } = useAuth();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = requireSupabase();
    const { data: can } = await supabase.rpc("avatar_can_review", {});
    setAllowed(Boolean(can));
    if (!can) return;
    const { data, error: e } = await supabase.rpc("avatar_review_queue", {});
    if (e) setError(e.message);
    else setQueue(data ?? []);
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        if (!cancelled) await load();
      } catch {
        if (!cancelled) setAllowed(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, load]);

  async function decide(userId: string, decision: "approve" | "reject") {
    setBusy(userId);
    setError(null);
    const { data } = (await getSupabase()?.auth.getSession()) ?? { data: { session: null } };
    const r = await decideAvatar({ accessToken: data.session?.access_token ?? "", userId, decision });
    if (!r.ok) setError(r.error);
    await load();
    setBusy(null);
  }

  if (loading || (user && allowed === null)) {
    return <div className="h-40 animate-pulse rounded-[10px] bg-card" />;
  }
  if (!user) {
    return (
      <div className="mx-auto max-w-xl space-y-6 text-center">
        <h1 className="font-[family-name:var(--font-display)] font-semibold text-2xl text-[var(--ink)]">Granska profilbilder</h1>
        <LoginPanel />
      </div>
    );
  }
  if (!allowed) {
    return (
      <div className="mx-auto max-w-xl text-center">
        <h1 className="font-[family-name:var(--font-display)] font-semibold text-2xl text-[var(--ink)]">Sidan finns inte</h1>
        <p className="mt-2 text-[var(--ink-muted)]">Den här sidan är bara för teamet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 sm:space-y-10">
      <div>
        <h1 className="mt-2 font-[family-name:var(--font-display)] font-semibold text-3xl tracking-tight text-[var(--ink)] sm:text-4xl">
          Granska profilbilder
        </h1>
        <p className="mt-2 max-w-2xl text-[var(--ink-muted)]">
          Bilder som väntar på teamet (kontrollen svarade inte) och bilder som dolts efter tre rapporter. Varje beslut
          sparas i revisionsloggen.
        </p>
      </div>
      {error ? (
        <p className="rounded-lg border border-[var(--destructive)]/30 bg-[var(--coral-soft)] px-4 py-3 text-sm text-[var(--destructive)]" role="alert">
          {error}
        </p>
      ) : null}
      {queue.length === 0 ? (
        <p className="rounded-[10px] border border-[var(--line)] bg-card p-6 text-[var(--ink-muted)]">Inget att granska just nu.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {queue.map((item) => (
            <li key={item.user_id} className="flex gap-4 rounded-[10px] border border-[var(--line)] bg-card p-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarUrl(item.path)} alt={`Profilbild för ${item.display_name}`} width={256} height={256} className="size-24 shrink-0 rounded-full border border-[var(--line)] object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-[var(--ink)]">{item.display_name}</p>
                <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
                  {item.status === "pending" ? "Väntar på teamet" : `Dold efter ${item.reports.length} rapporter`}
                </p>
                {item.reports.length > 0 ? (
                  <ul className="mt-2 list-disc space-y-0.5 pl-4 text-sm text-[var(--ink-soft)]">
                    {item.reports.map((r, i) => (
                      <li key={i}>{r.reason}</li>
                    ))}
                  </ul>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy === item.user_id}
                    onClick={() => void decide(item.user_id, "approve")}
                    className="inline-flex min-h-10 items-center rounded-md bg-[var(--brand)] px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-[var(--brand-deep)] disabled:opacity-50"
                  >
                    Godkänn
                  </button>
                  <button
                    type="button"
                    disabled={busy === item.user_id}
                    onClick={() => void decide(item.user_id, "reject")}
                    className="inline-flex min-h-10 items-center rounded-md border border-[var(--line-strong)] px-4 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--mist)] disabled:opacity-50"
                  >
                    Ta bort bilden
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
