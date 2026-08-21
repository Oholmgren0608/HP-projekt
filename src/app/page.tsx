import { Badge } from "@/components/ui/badge";
import { WeekTracker } from "@/components/week-tracker";
import {
  DAILY_TEMPLATE,
  PROFILE,
  RESOURCES,
  SECTIONS,
  STRATEGY,
  priorityLabel,
} from "@/lib/study-plan";

function PriorityBadge({ priority }: { priority: (typeof SECTIONS)[0]["priority"] }) {
  const label = priorityLabel(priority);
  if (priority === "huvudfokus") {
    return (
      <Badge className="border-transparent bg-[var(--accent)] text-white hover:bg-[var(--accent)]">
        {label}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-[var(--line)] text-[var(--ink-soft)]">
      {label}
    </Badge>
  );
}

export default function Home() {
  return (
    <div className="relative min-h-full overflow-x-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 10% -10%, color-mix(in oklab, var(--accent) 18%, transparent), transparent 55%), radial-gradient(ellipse 60% 40% at 90% 5%, color-mix(in oklab, var(--lagoon) 22%, transparent), transparent 50%), linear-gradient(180deg, var(--fog) 0%, var(--paper) 38%, var(--fog) 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.35]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%12121a2a' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <div className="flex items-baseline gap-2">
          <span className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--ink)]">
            HP Lift
          </span>
          <span className="hidden text-sm text-[var(--ink-muted)] sm:inline">
            studieplan för höstens prov
          </span>
        </div>
        <a
          href="#plan"
          className="rounded-md bg-[var(--ink)] px-3.5 py-2 text-sm font-medium text-[var(--paper)] transition hover:bg-[var(--ink-soft)]"
        >
          Till 8-veckorsplanen
        </a>
      </header>

      <main>
        <section className="mx-auto grid w-full max-w-6xl gap-10 px-5 pb-16 pt-6 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:pt-10">
          <div className="animate-rise">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              Personlig HP-strategi
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-[clamp(2.4rem,6vw,4.2rem)] leading-[1.05] tracking-tight text-[var(--ink)]">
              HP Lift
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-[var(--ink-muted)] sm:text-xl">
              Du är stark på kvantitativt ({PROFILE.previousQuant.toString().replace(".", ",")}
              ) och engelska. Flaskhalsen är svenska verbala — ORD, LÄS och MEK. Den här planen
              lägger merparten av tiden där, utan att tappa dina styrkor.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#plan"
                className="inline-flex items-center justify-center rounded-md bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Börja vecka 1
              </a>
              <a
                href="#strategi"
                className="inline-flex items-center justify-center rounded-md border border-[var(--line)] bg-white/50 px-5 py-2.5 text-sm font-medium text-[var(--ink)] backdrop-blur-sm transition hover:border-[var(--ink-soft)]"
              >
                Se strategin
              </a>
            </div>
          </div>

          <aside className="animate-rise-delay rounded-2xl border border-[var(--line)] bg-white/75 p-5 shadow-[0_20px_50px_-30px_rgba(18,42,48,0.5)] backdrop-blur-md sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
              Utgångsläge
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-[var(--ink-muted)]">Kvantitativt</dt>
                <dd className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
                  {PROFILE.previousQuant.toString().replace(".", ",")}
                </dd>
                <dd className="text-xs text-[var(--lagoon)]">styrka · underhåll</dd>
              </div>
              <div>
                <dt className="text-sm text-[var(--ink-muted)]">Verbalt</dt>
                <dd className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
                  {PROFILE.previousVerbal.toString().replace(".", ",")}
                </dd>
                <dd className="text-xs text-[var(--accent)]">huvudfokus</dd>
              </div>
              <div>
                <dt className="text-sm text-[var(--ink-muted)]">Mål snitt</dt>
                <dd className="text-xl font-semibold text-[var(--ink)]">
                  {PROFILE.targetOverall}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-[var(--ink-muted)]">Tempo</dt>
                <dd className="text-xl font-semibold text-[var(--ink)]">
                  ~{PROFILE.hoursPerWeek} h/vecka · {PROFILE.weeksUntilExam} v
                </dd>
              </div>
            </dl>
            <p className="mt-5 border-t border-[var(--line)] pt-4 text-sm leading-relaxed text-[var(--ink-muted)]">
              Realistiskt mål: lyft verbala till {PROFILE.targetVerbal} medan kvantitativa hålls
              runt 1,4–1,5. Det ger ofta mer snitt än att jaga matte-tiondelar.
            </p>
          </aside>
        </section>

        <section id="strategi" className="border-y border-[var(--line)] bg-white/40 py-14">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <h2 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)] sm:text-4xl">
              Strategin i fyra punkter
            </h2>
            <p className="mt-2 max-w-2xl text-[var(--ink-muted)]">
              En klar riktning innan schemat: var du lägger tid — och var du inte gör det.
            </p>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {STRATEGY.map((item, i) => (
                <article
                  key={item.title}
                  className="animate-rise border-l-2 border-[var(--accent)] pl-4"
                  style={{ animationDelay: `${0.05 * i}s` }}
                >
                  <h3 className="text-lg font-semibold text-[var(--ink)]">{item.title}</h3>
                  <p className="mt-2 text-[var(--ink-muted)] leading-relaxed">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
          <h2 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)] sm:text-4xl">
            Delprov — vad du gör med varje
          </h2>
          <p className="mt-2 max-w-2xl text-[var(--ink-muted)]">
            Svenska sektionerna får huvuddelen av tiden. ELF och kvant hålls varma.
          </p>
          <div className="mt-8 space-y-6">
            {SECTIONS.map((section) => (
              <article
                key={section.id}
                className="rounded-xl border border-[var(--line)] bg-white/65 p-5 backdrop-blur-sm sm:p-6"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
                    {section.name}
                  </h3>
                  <PriorityBadge priority={section.priority} />
                </div>
                <p className="mt-3 max-w-3xl text-[var(--ink-muted)]">{section.why}</p>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {section.methods.map((m) => (
                    <li
                      key={m}
                      className="flex gap-2 text-sm leading-relaxed text-[var(--ink-soft)]"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--lagoon)]" />
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-sm font-medium text-[var(--ink)]">
                  Veckans mål:{" "}
                  <span className="font-normal text-[var(--ink-muted)]">{section.weeklyGoal}</span>
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-[var(--line)] bg-[var(--ink)] py-14 text-[var(--paper)]">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl">
              En vanlig studiedag
            </h2>
            <p className="mt-2 max-w-2xl text-white/70">
              Håll det enkelt. ORD varje dag, läsning varje dag, ett längre teknikpass de flesta
              dagar.
            </p>
            <ol className="mt-8 space-y-4">
              {DAILY_TEMPLATE.map((row, i) => (
                <li
                  key={row.slot}
                  className="grid gap-1 border-b border-white/15 pb-4 sm:grid-cols-[14rem_1fr] sm:gap-6"
                >
                  <span className="text-sm font-medium text-[var(--lagoon)]">
                    {i + 1}. {row.slot}
                  </span>
                  <span className="text-white/90">{row.item}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="plan" className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
          <h2 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)] sm:text-4xl">
            8-veckorsplan med checklista
          </h2>
          <p className="mt-2 max-w-2xl text-[var(--ink-muted)]">
            Bas → teknik → fullprov → finish. Bocka av uppgifter — progressen sparas i webbläsaren.
          </p>
          <div className="mt-8">
            <WeekTracker />
          </div>
        </section>

        <section className="border-t border-[var(--line)] bg-white/50 py-14">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <h2 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
              Material
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {RESOURCES.map((r) => (
                <div
                  key={r.title}
                  className="rounded-lg border border-[var(--line)] bg-[var(--paper)] p-4"
                >
                  <h3 className="font-semibold text-[var(--ink)]">{r.title}</h3>
                  <p className="mt-2 text-sm text-[var(--ink-muted)]">{r.body}</p>
                  {r.href ? (
                    <a
                      href={r.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-block text-sm font-medium text-[var(--accent)] underline-offset-4 hover:underline"
                    >
                      Öppna gamla prov →
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-5 py-10 text-sm text-[var(--ink-muted)] sm:px-8">
        <p>
          HP Lift är en träningsplan — inte ett facit. Justera veckotiden efter ditt schema, men
          behåll fördelningen: mest svenska, lite underhåll på styrkorna.
        </p>
      </footer>
    </div>
  );
}
