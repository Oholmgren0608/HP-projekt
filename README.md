# HP Lift — Studieplan för Högskoleprovet

Mata in dina HP-resultat (normpoäng + råpoäng per delprov) så bygger sidan om prioritering, tidsfördelning och veckoplan.

## Kom igång

Kräver Node.js 20.9 eller nyare. I WSL, från projektmappen (`~/pi/Webappar/HP-projekt`):

```bash
npm install
npm run dev
```

Öppna [http://127.0.0.1:43123](http://127.0.0.1:43123).

För lokal utveckling med hot reload: `npm run dev` (samma port).

## Vad appen innehåller

- **Nivåtest** — för dig som är ny på HP eller känner dig rostig: ett kort, otidsatt minitest med frågor från alla delprov. Resultatet uppskattar din nivå och bygger veckoplanen automatiskt.
- **Resultatformulär** — spara normpoäng, delprovspoäng, timmar/vecka och veckor till prov; planen genereras om lokalt
- Interaktiv veckoplan med övningar för alla åtta delprov (KVA, DTK, XYZ, NOG, ORD, LÄS, MEK, ELF)
- Övningshubbar per delprov med valfritt antal frågor, tidtaget mini-prov och daglig repetition (SRS)
- Flashcards, läsbibliotek och officiella gamla HP-prov (PDF från UHR)
- **Duell** — frågedueller mot andra spelare (PvP) eller en bot, med
  ELO-ranking, matchmaking-kö, privata matcher via kod, matchhistorik och
  recensioner efter avslutad match
- **Gamification** — XP, nivåer, streak, dagliga uppdrag och achievements,
  med en vecko-XP-topplista

## Scripts

- `npm run dev` — utvecklingsserver
- `npm run build` — produktionsbygge
- `npm run start` — kör byggt resultat
- `npm run lint` — ESLint

## Supabase (valfritt — appen funkar anonymt utan)

Appen synkar all sparad data till ett Supabase-konto när användaren loggar
in med Google. Utan inloggning sparas allt i localStorage som tidigare.

### 1. Miljövariabler

Kopiera `.env.local.example` till `.env.local` och fyll i
`NEXT_PUBLIC_SUPABASE_URL` och `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
Du hittar båda i Supabase Dashboard: klicka på **Connect** uppe till höger
i projektöversikten, eller gå till **Settings → API Keys**. Använd en
**Publishable key** (`sb_publishable_...`) i
`NEXT_PUBLIC_SUPABASE_ANON_KEY` — aldrig en Secret key.

### 2. Databas

Kör migrationsfilerna i Supabase Dashboard → SQL Editor, i nummerordning.
`supabase/migrations/` innehåller nu exakt `0001`–`0009`. Statusen nedan är
verifierad mot live-databasen med read-only REST-prober.

| Migration | Innehåll | Status i live-DB | Bevis |
| --- | --- | --- | --- |
| `0001_user_state` | `user_state`-tabellen med RLS (varje användare ser bara sina egna rader), för molnsynk | APPLIED | — |
| `0002_duel_pvp` | spelarprofiler (ELO/statistik), matcher, per-fråga-svar och matchmaking-kö, plus ranking-RPC:er | APPLIED | — |
| `0003_duel_reviews` | recensioner och betyg efter dueller, rapporter, flaggning och bot-svårighetsjustering | APPLIED | — |
| `0004_duel_integrity` | server-auktoritativ rättning (`duel_questions`), tätare RLS, vyn `duel_public_profiles` och viktad `received_rating_count` | PENDING | `duel_questions` och vyn `duel_public_profiles` saknas |
| `0005_questions` | Supabase-backade övningsfrågor: `questions` och `reflect_prompts` (ORD, MEK, LÄS, ELF, DTK, XYZ, KVA, NOG) | PENDING | tabellerna saknas → PostgREST `PGRST205` |
| `0006_exam_import` | kolumner och tabeller för import-pipelinen (`exams`, frågemetadata och `prov-figures`-bucketen) | PENDING | `exams` saknas och bucketen `prov-figures` finns inte |
| `0007_usernames` | unikt användarnamn per profil (`username`, skiftlägesokänsligt index och profil-RPC:er) | PENDING | `player_profiles.username` saknas → `42703` |
| `0008_duel_rpc_hardening` | härdar kö-/avboknings-RPC:erna (`search_path` och rättigheter) | ALREADY APPLIED UNDER OLD NAME | kördes tidigare som `0004_duel_rpc_hardening` (går inte att verifiera via REST) |
| `0009_leaderboard` | vecko-XP-topplista för gamification | ALREADY APPLIED UNDER OLD NAME | `leaderboard_entries` finns; kördes tidigare som `0005_leaderboard` |

**Rekommenderad åtgärd för de fyra PENDING-migrationerna:** kör
`supabase/manual/apply-0004-0007.sql` — verbatim `0004`+`0005`+`0006`+`0007`
följt av en read-only efterkontroll. Det är det säkraste sättet att synka
live-databasen, eftersom filen bara innehåller det som saknas.

`0002`–`0004` behövs bara om du vill använda Duell-funktionen. I appen just
nu innebär de fyra PENDING-migrationerna att övningsfrågorna bara fungerar
via den lokala fallbacken och att `/prov`-listan över importerade prov är
tom.

`supabase/combined_migrations.sql` (0001 → 0009) ska fortfarande **inte**
klistras in blint: `0001`–`0003`, `0008` och `0009` finns redan i
live-databasen och skulle köras om i onödan. Använd `apply-0004-0007.sql`
i stället.

> **Varning:** `supabase_migrations.schema_migrations` är tom (eller
> ofullständig) trots att `0001`–`0003` samt `0008`–`0009` redan är körda
> manuellt i SQL Editor. Därför misslyckas `supabase db push` — den tror att
> inga migrationer är applicerade. Markera de redan körda som tillämpade en
> gång:
>
> ```bash
> supabase migration repair --status applied 0001 0002 0003 0008 0009 --linked
> ```

> **OBS `0010` (flyttad till `supabase/manual/`):**
> `0010_duel_rpc_wrapper_hardening.sql` är inte längre en migration. Den
> återskapar de **gamla** RPC-signaturerna och skulle därför backa
> `0004_duel_integrity`s server-auktoritativa design och bryta klienten.
> Filen får **aldrig** köras mot nuvarande kod och sparas bara som
> referens, tillsammans med `..._rollback.sql` och `..._verify.sql` i
> `supabase/manual/`.

### Duellpoäng litar på klienten i live — åtgärdas av `0004_duel_integrity`

Live-databasen kör i dag de gamla RPC-varianterna (5/3/4 argument) som tar
emot rätt/fel och poäng från klienten; facit finns bara i frontend. En
användare med utvecklarverktyg kan därför manipulera sin ELO och statistik
**i live-miljön**.

Svagheten är redan löst i koden: `0004_duel_integrity` tar bort de
klienttrustade signaturerna och skapar server-auktoritativa 4/1/2-args-varianter
som läser facit ur den nya tabellen `duel_questions`. Migrationen är dock
**inte** applicerad i live-databasen ännu (se tabellen ovan), så risken
kvarstår där tills den körs.

**Åtgärd:** kör `0004_duel_integrity` — enklast via
`supabase/manual/apply-0004-0007.sql`. Ingen ny migration behövs; `0004` gör
redan detta.

### 3. Google-inloggning

- Skapa en OAuth-klient i Google Cloud Console (OAuth consent screen +
  Web application-klient).
- I Supabase: Authentication → Providers → Google: fyll i Client ID och
  Client Secret.
- Authentication → URL Configuration: lägg till
  `http://127.0.0.1:43123` och `http://localhost:43123`.

### Synk-logik

Vid första inloggningen mergas lokala data med molnet, nyckel för nyckel —
nyaste värdet vinner (lokal skrivtid vs. molnets `updated_at`). Därefter är
molnet källa till sanning och localStorage fungerar som offline-cache.
`src/lib/sync/storage-sync.ts` är en drop-in-ersättning för
`localStorage.getItem/setItem`.
