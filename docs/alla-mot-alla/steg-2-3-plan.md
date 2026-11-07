# Steg 2 och 3 – Alla mot alla: plan

Status: byggd 2026-11-07 (Oscar gav klartecken att bygga alla planer utan ny godkännanderunda).
Bakgrund: [spec.md](spec.md), [ADR 0001](../adr/0001-stangd-fragepool.md), steg 1 ([steg-1-plan.md](steg-1-plan.md)).

## Databas (allt i migration 0038)

Tabeller (RLS på; spelare kan läsa sitt eget spels rad och spelarlistan, inget annat):

- `ama_games`: spelet. `mode` ('private'/'lobby'), `status` ('waiting'/'active'/'finished'/'cancelled'),
  `phase` ('starting'/'question'/'reveal'), `current_idx`, `phase_ends_at`, `kinds`, `extended` (Längre tid),
  `invite_code`, `host`, `lobby_full_at` (när fjärde spelaren kom), `created_at`, `started_at`, `finished_at`.
- `ama_players`: deltagare (`player_id`, `user_id` eller bot, `display_name`, `is_bot`, `score`, `correct`,
  `correct_time_ms`, `left_at`). Poängen uppdateras först när en fråga stängs.
- `ama_questions` och `ama_answers`: spelets frågor och svar. Inga policies; bara RPC:erna läser dem.

Servern äger takten. Varje fas har en sluttid i databasen. `ama_tick` (anropas av `ama_state` och `ama_submit`)
låser spelet och går vidare när sluttiden passerat eller alla spelare svarat:

- `starting` (3 s) → `question` (tid efter delprov, ×1,5 med Längre tid) → `reveal` (6 s) → nästa fråga …
- När en fråga stängs räknas poängen: rätt svar ger 600 + 400 × (återstående tid / frågans tid), avrundat;
  fel och inget svar ger 0. Botarnas svar räknas ut här (cirka 60 % rätt).
- Efter tionde frågan blir spelet `finished`.

RPC:er (security definer, bara `authenticated`):

| RPC | Vad |
|---|---|
| `ama_create_private(p_kinds, p_extended)` | Skapar rum med kod; skaparen är första spelare |
| `ama_join_private(p_code)` | Går med i ett väntande rum (max 30) |
| `ama_update_settings(p_game_id, p_kinds, p_extended)` | Skaparen ändrar delprov och Längre tid i lobbyn |
| `ama_start(p_game_id)` | Skaparen startar (minst 2 spelare); servern väljer 10 frågor ur spelpoolen |
| `ama_leave(p_game_id)` | Lämna: i lobbyn tas spelaren bort (skaparen avbryter rummet), under spelet markeras hen som borta |
| `ama_submit(p_game_id, p_idx, p_chosen)` | Svar på aktuell fråga; servern mäter tiden. Facit skickas inte |
| `ama_state(p_game_id)` | Hela läget för spelaren: fråga utan facit under frågefasen, facit, fördelning och topp 5 i reveal, slutställning och genomgång när spelet är slut |
| `ama_find_match()` | Slumpad lobby: gå med i en väntande lobby eller skapa en |

Slumpad lobby: 4–8 spelare. När den fjärde ansluter sätts `lobby_full_at`; spelet startar 30 s senare
eller direkt vid 8. Har lobbyn färre än 4 spelare 60 s efter att den skapades fylls den med botar upp till 4
och startar. En spelare kan bara stå i en väntande lobby i taget.

## Appen

- Ny route `/alla-mot-alla` (navigationen: Öva → Alla mot alla, bredvid Duell). Kräver inloggning och nätverk.
- Hubb: Sök match, Skapa rum (delprov + Längre tid), Gå med med kod. Länk `/alla-mot-alla?kod=ABC123`.
- Spelvy `/alla-mot-alla/[id]`: lobby (kod, länk, spelare, inställningar, Starta), fråga (alternativ, nedräkning,
  "Svar skickat"), reveal (rätt svar, fördelning, topp 5 och egen placering), slut (placering, poäng,
  genomgång, förslag "Öva mer på …").
- Läget hämtas med `ama_state`: vid Realtime-uppdatering av spelets rad, när fasens tid går ut och som
  reserv var tredje sekund.
- XP via samma händelse som en duell (`duel_end`, vinst för förstaplats), deduplicerad på spelets id.
- Poolens frågor blir inte felkort och sparas inte i webbläsaren.

## Tester

- PGlite: RLS och rättigheter (utomstående ser inget, inget facit före reveal, svar efter tiden räknas inte,
  bara skaparen startar/ändrar), poängformeln, tidsstyrningen, lobbyns start och botar.
- Vitest: poängformel och hjälpfunktioner i klienten.
- Webbläsare: ett privat rum med två spelare och en slumpad lobby med botar, mobil och desktop, ljust och
  mörkt läge.
