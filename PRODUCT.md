# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

A mobile app is planned as a Capacitor wrapper around the same Next.js app (see `docs/KNOWN_ISSUES.md` and the
offline investigation). Its design language stays web; offline practice is a core requirement for it.

## Users

Everyone preparing for Högskoleprovet (HP), with no single primary group (Oscar, 2026-11-06): first-time takers in
upper secondary school as well as people retaking the test to raise their score, often alongside school or work and
often on a phone. Experts in the Studiehjälp pilot (18+, staff-gated) are a secondary audience. Younger students may
contact experts, so age and guardian questions matter there (`docs/juridik/`).

## Product Purpose

HP Lift is a study tool for HP: the user enters their level (scores or the nivåtest), gets a prioritised veckoplan
towards their provdatum, and practises against it with original questions, error cards ("Dagens repetition"), mock
tests and a score forecast. Success is a user who knows what to do today and raises their normerad poäng.

## Positioning

Confirmed differentiators against hpguiden, HP-appen and similar:

- **A personal veckoplan** built from the user's level, provdatum and pluggdagar, showing what to do today and adapting
  when sessions are missed.
- **Free without an account:** practice, nivåtest, results and forecast work for guests; data syncs after login. Only
  the veckoplan requires an account (later a subscription).
- **Community and experts:** duels with ELO, a question forum, and Studiehjälp with verified experts.
- **Planned:** a Kahoot-style live quiz game built on HP questions (not designed or built yet).

## Operating Context

- Short sessions on a phone and longer ones on a computer; the sidebar (desktop) and tab bar (mobile) are the main
  navigation.
- The calendar is anchored to the official test dates (spring and autumn, from UHR); the plan covers at most the last
  16 weeks before the test.
- Questions go through automatic checks, a blind second-AI solve and a human spot check before publishing.

## Capabilities and Constraints

- Eight delprov in two block (verbal: ORD, LÄS, MEK, ELF; kvantitativ: KVA, DTK, XYZ, NOG). Full provpass: 40 questions
  in 55 minutes (80 with extended time). See `GLOSSARY.md` for terminology.
- UHR's official questions are never shown to users; they are only models for writing new ones (AGENTS.md §1).
- The forecast is a rough estimate, not UHR's normering; it must not be presented as official.
- Practice answers are public by design; anything competitive or paid must be enforced on the server.
- Out of scope until decided: payments and payouts, subscription tiers and ads, video/Creator Studio (AGENTS.md §2).
- Undecided: the Kahoot-style game, the subscription model, and how plans longer than 16 weeks should start.

## Brand Commitments

- Name: **HP Lift**. UI language Swedish.
- Voice: calm and matter-of-fact ("lugn och saklig", confirmed 2026-11-06). Direct, no guilt or hype, e.g. "Veckan har
  krympt så att dagarna inte blir för tunga".
- The existing visual system is "Lugn" (`.superdesign/design-system.md`, AGENTS.md §7); green and red mean right and
  wrong answers only.

## Evidence on Hand

- About 1,600 published original practice questions with explanations, about 200 per delprov.
- Official HP test dates for 2027 (10 April, 24 October), confirmed by Oscar.
- No testimonials, user numbers, score-improvement data or press exist; future work must not invent them.

## Product Principles

1. The user should always know what to do today, and the plan adapts instead of piling up guilt.
2. Core practice stays free and works without an account and offline.
3. Honest numbers: estimates are labelled as estimates, and nothing competitive relies on data the client controls.
4. Trust through review: questions and experts are checked before anyone sees them.
5. Calm over hype: the tone and the interface lower stress during a stressful test period.

## Accessibility & Inclusion

- Every screen works in light and dark mode and at mobile width (AGENTS.md §9).
- Extended test time (80 minutes, e.g. for dyslexia) is supported in timed practice.
