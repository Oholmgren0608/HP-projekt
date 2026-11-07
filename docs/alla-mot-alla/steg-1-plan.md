# Steg 1 – stängd frågepool och duellfix: genomförandeplan

Status: **byggd 2026-11-07** (Oscar gav klartecken att bygga alla planer).
Bakgrund: [spec.md](spec.md) och [ADR 0001](../adr/0001-stangd-fragepool.md).

## Mål

När steg 1 är klart:

- når ingen fråga ur spelpoolen en klient med facit innan frågan har stängt för spelaren,
- väljer servern frågorna i varje duell, mäter svarstiden och rättar,
- räknas botarnas svar ut på servern,
- är duellerna utan DTK och har tid per fråga efter delprov,
- är "Duel answers reach the browser" stängd i `docs/KNOWN_ISSUES.md`.

## Hålen som täpps (nuläge)

| Hål | Var | Följd |
|---|---|---|
| Duellfrågornas facit är publika | `questions_select_published` (0017), `fallback-bank.json` | Svaret kan slås upp |
| Klienten väljer fråge-id | `buildDuelQuiz` i `src/lib/duel/questions.ts`; `duel_submit_answer` kontrollerar inte att frågan hör till matchen | Kan svara på valfria, kända frågor |
| Klienten rapporterar sin svarstid | `duel_submit_answer(p_time_ms)` | Kan alltid ange snabbaste tid |
| Klienten rapporterar botens resultat | `duel_finish_bot(p_bot_correct)` (0004) | Ranked-ELO kan fejkas mot bot |
| Botens svar simuleras med facit i webbläsaren | `src/lib/duel/bot.ts` | Kräver facit på klienten |
| Matchens frågor och facit sparas i localStorage | `MATCH_QUESTIONS_KEY` i `questions.ts`, `BOT_ANSWERS_KEY` i `duel-match.tsx` | Poolen läcker till webbläsaren |

## Databas (nya migrationer, numrerade efter 0034)

### 0035 – spelpool

- `questions.pool text not null default 'ovning' check (pool in ('ovning','spel'))`.
- `questions_select_published` ersätts: `status = 'published' and pool = 'ovning'`. Ingen klient kan längre läsa
  spelpoolen. Exportskriptet (`fragebank:export`) läser med anon-nyckeln och följer därför policyn automatiskt.
- `questions_sync_duel_facit` och engångsfyllningen ändras så att `duel_questions` bara innehåller publicerade
  frågor med `pool = 'spel'` (tabellen blir spelpoolens facit; inga policies, som i dag).
- Index på `(pool, status, kind)`.

### 0036 – flytta 200 frågor till spelpoolen (data)

- 40 publicerade frågor per delprov (ord, mek, xyz, kva, nog) utan öppna felrapporter får `pool = 'spel'`.
  Urvalet är deterministiskt (`order by md5(id)`), så dry run och skarp körning väljer samma frågor.
- Inget raderas. Ändringen går att backa genom att sätta `pool = 'ovning'` igen (rollback-SQL i
  `supabase/manual/`).

### 0037 – duellerna rättas och tidmäts på servern

- Ny tabell `duel_match_questions (match_id, idx 0–9, question_id, kind)`, utan policies för klienter.
  Servern fyller den när matchen startar (`duel_start_bot_match`, matchning i kön, `duel_join_private`), med
  2 frågor per delprov ur spelpoolen, i första hand frågor ingen av spelarna fått de senaste 30 dagarna.
- Ny tabell `duel_question_serves (match_id, user_id, idx, served_at)`: när spelaren fick frågan.
- Ny RPC `duel_next_question(p_match_id)`: returnerar spelarens nästa fråga **utan** `correct_index` och
  `explain` (id, kind, prompt, passage, options, figure_url, index, tidsgräns) och sparar `served_at`.
- `duel_submit_answer(p_match_id, p_idx, p_chosen)`: kontrollerar att spelaren hör till matchen, att frågan
  är matchens fråga nummer `p_idx` och att den har serverats. Tiden räknas som `now() - served_at`, och ett
  svar efter tidsgränsen (plus 2 s marginal för nätet) räknas som obesvarat. Returnerar `correct_index` och
  `explain` för just den frågan.
- Tidsgräns per delprov: ORD 20 s, MEK 45 s, KVA 75 s, XYZ och NOG 90 s.
- Ny RPC `duel_review(p_match_id)`: alla tio frågor med facit och förklaring, men först när spelaren är klar.
- Bot: `duel_finish_bot(p_match_id)` utan `p_bot_correct`. Servern simulerar botens svar per fråga med
  träffsäkerhet efter ELO (samma formel som `botAccuracy`, 0,35–0,85) och sparar dem, så ställningen kan visas.
- `duel_claim_stall_win`: tidsgränserna räknas om (längsta match blir 10 × 90 s i stället för 10 × 40 s).
- Gamla signaturer (`duel_submit_answer` med `p_question_id`/`p_time_ms`, `duel_finish_bot(uuid, integer)`)
  tas bort, så att det gamla, fuskbara flödet inte finns kvar.

Alla RPC:er: `security definer`, `set search_path = public`, `revoke` från `public, anon`, `grant` till
`authenticated`, som de befintliga duell-RPC:erna (0008/0016).

## Frågebanken och /review

- `scripts/fragebank/upload.ts`: valet `--pool spel` laddar upp frågor som utkast till spelpoolen.
- `/review` (staff): vid publicering väljer granskaren **Övning** eller **Pool**, och en räknare visar antal
  publicerade poolfrågor per delprov mot målet 80. Granskningen och audit-loggningen fungerar som i dag.
- Efter 0035/0036: kör `fragebank:export` (via run_script) så att offlinekopian tappar de 200 poolfrågorna.

## Appen

- `src/lib/duel/questions.ts`: `buildDuelQuiz`, `readStored` och `writeStored` ersätts med anrop till
  `duel_next_question` och `duel_review`. Inga frågor eller svar från poolen sparas i localStorage.
- `src/lib/duel/bot.ts`: simuleringen i webbläsaren tas bort; ställningen mot boten hämtas från servern.
- `src/components/duel/duel-match.tsx`: frågan hämtas en i taget, svaret skickas med index, och rätt svar och
  förklaring visas från RPC-svaret. Nedräkningen visar delprovets tid. Gamla matcher som pågår vid
  driftsättningen avslutas som "avbrutna" (de har inga serverade frågor).
- `DUEL_KINDS` blir `["ord", "mek", "xyz", "kva", "nog"]`.
- Felkort skapas inte av duellfrågor.
- Övningen påverkas bara av att banken krymper; inga kodändringar där.

## Tester

- **PGlite-harnessen** (`~/.cache/hp-db-test`) mot migrationerna 0035–0037. Varje säkerhetstest försöker bryta
  skyddet:
  - anon och authenticated kan inte läsa `questions` med `pool = 'spel'`, inte `duel_questions`, inte
    `duel_match_questions`,
  - `duel_next_question` returnerar aldrig `correct_index` eller `explain`,
  - svar på en fråga som inte hör till matchen, på en fråga som inte serverats eller på någon annans match
    avvisas,
  - svar efter tidsgränsen räknas som obesvarat, oavsett vad klienten skickar,
  - `duel_review` före matchens slut avvisas,
  - `duel_finish_bot` kan inte påverka botens resultat från klienten,
  - de gamla signaturerna finns inte längre.
- **Vitest:** urvalet av frågor (2 per delprov, ingen DTK), tidsgränser per delprov, botens träffsäkerhet,
  att inget från poolen skrivs till localStorage.
- **Webbläsare (Brave, headless):** en botduell och en privat duell från början till slut, i ljust och mörkt
  läge och i mobilbredd, samt en kontroll av att nätverkstrafiken inte innehåller `correct_index` före svaret.
- Typkontroll, lint, `npm test` och `npm run build`.

## Driftsättning

1. Migrationerna 0035–0037 prövas med `push_migrations` (dry run) och appliceras.
2. `fragebank:export` körs så att offlinekopian uppdateras, och koden commitas till main.
3. Mellan att databasen uppdateras och att Vercel driftsatt den nya koden fungerar duellerna inte (några
   minuter). Pågående matcher avslutas som avbrutna. Övning påverkas inte.

## Dokumentation (i samma ändring)

- `docs/KNOWN_ISSUES.md`: "Duel answers reach the browser" stängs, med migrationer och tester.
- AGENTS.md §6: tid per delprov, DTK bort ur duellerna, spelpoolen; §5: nya tabeller och RPC:er.
- GLOSSARY.md: Duell (utan DTK, tid per delprov).
- README: duellbeskrivningen om den nämner DTK eller 40 s.

## Risker och öppna punkter

- **Läckage över tid:** facit visas efter varje fråga, så poolen sprids långsamt. Hanteras med påfyllning mot
  80 per delprov (ADR 0001).
- **Färre övningsfrågor:** övningen tappar 40 frågor per delprov (från cirka 200 till 160).
- **Gamla klienter:** en webbläsare med gammal kod får fel vid duell tills sidan laddas om. Duellvyn visar då
  "Ladda om sidan för att spela".
- Steg 2 (Alla mot alla, privata rum) och steg 3 (slumpad lobby) får egna planer och återanvänder poolen,
  serverade frågor och serverns tidmätning härifrån.
