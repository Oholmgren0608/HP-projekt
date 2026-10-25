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
- `npm run fragebank:validate` / `fragebank:kontroll` / `fragebank:upload` /
  `fragebank:export` — arbetsflödet för nya övningsfrågor (se nedan)
- `npm run fragebank:aldre` / `fragebank:balansera` — andra kontrollen och
  jämnare svarspositioner för de äldre frågorna (se nedan)

## Frågebanken

Databasen (`public.questions`) är sanningen för alla frågor. Nya
övningsfrågor tas fram så här:

1. Skriv frågorna i `content/ovningsfragor/<delprov>.json` (id
   `ovn-<delprov>-001` …). Kör `npm run fragebank:validate` – den kontrollerar
   bland annat antal svarsalternativ (ORD och NOG har fem, som på provet),
   att rätt svar är spritt över positionerna och att inget är en dubblett.
2. Andra kontrollen: `npm run fragebank:kontroll -- blind <delprov>` skriver
   de frågor som inte redan kontrollerats, utan facit, till
   `content/ovningsfragor/.andra-kontroll/`. En
   annan AI än den som skrev frågorna löser dem och skriver
   `<delprov>.svar.json`; `npm run fragebank:kontroll -- merge <delprov>`
   markerar varje fråga som ense eller oense.
3. `npm run fragebank:upload -- --dry-run`, sedan `npm run fragebank:upload`
   (eller `-- elf las` för bara vissa delprov) lägger in nya frågor som
   utkast (kräver `SUPABASE_SERVICE_ROLE_KEY` i `.env.local`). Frågor som
   redan finns i databasen rörs inte – efter uppladdningen ändras de på
   `/review`.
4. Teamet gör stickprov på `/review`. "Publicera … ense" publicerar bara
   frågor där andra kontrollen var ense och som saknar felrapporter; oense
   frågor godkänns en och en.
5. `npm run fragebank:export` skriver om reservbanken
   `src/lib/content/fallback-bank.json` från databasen.

Användare kan rapportera fel i en fråga efter ett pass. När tre olika
användare har öppna felrapporter dras frågan tillbaka till utkast, och
rapporterna visas på `/review` (vyn "Att granska" visar även publicerade
frågor med enstaka rapporter). Rapporterna stängs när frågan publiceras igen
eller markeras som hanterade.

### De äldre frågorna

De 146 frågor som fanns innan `content/ovningsfragor/` har gått igenom samma
andra kontroll. Resultatet ligger i `content/aldre-fragor/andra-kontrollen.json`
(121 ense, 25 oense). När migration `0017` är körd:

1. `npm run fragebank:aldre -- apply --dry-run`, sedan utan `--dry-run`, skriver
   resultatet till databasen. De oense frågorna syns under "Att granska" på
   `/review` tillsammans med anteckningen om vad som är fel.
2. `npm run fragebank:balansera -- --dry-run`, sedan utan flaggan, jämnar ut
   rätt svars position i ORD, LÄS och ELF (i dag är rätt svar B i 21 av 24
   ORD-frågor). Bara ordningen ändras. XYZ och de flesta DTK-frågor har tal
   eller etiketter i stigande ordning och behöver nya distraktorer för hand.
3. `npm run fragebank:export` så att reservbanken följer med.

Provfrågor som importeras ur UHR:s prov (`scripts/import-prov`) är
upphovsrättsskyddade. De används bara som förlagor och kan aldrig publiceras
(databasen stoppar det från migration `0017`).

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
verifierad mot live-databasen (Management-API-frågor + en Playwright-körning
av appen mot live-DB). Samtliga migrationer `0001`–`0010` finns nu i
live-databasen; `0004`–`0007` kördes i dag, `0008`–`0010` kördes tidigare
under sina dåvarande namn.

| Migration | Innehåll | Status i live-DB | Bevis |
| --- | --- | --- | --- |
| `0001_user_state` | `user_state`-tabellen med RLS (varje användare ser bara sina egna rader), för molnsynk | APPLIED | — |
| `0002_duel_pvp` | spelarprofiler (ELO/statistik), matcher, per-fråga-svar och matchmaking-kö, plus ranking-RPC:er | APPLIED | — |
| `0003_duel_reviews` | recensioner och betyg efter dueller, rapporter, flaggning och bot-svårighetsjustering | APPLIED | — |
| `0004_duel_integrity` | server-auktoritativ rättning (`duel_questions`), tätare RLS, vyn `duel_public_profiles` och viktad `received_rating_count` | APPLIED (i dag) | `duel_questions` 136 rader och vyn `duel_public_profiles` finns; RPC-signaturerna matchar klienten och de gamla 5/3/4-args-varianterna är borta |
| `0005_questions` | Supabase-backade övningsfrågor: `questions` och `reflect_prompts` (ORD, MEK, LÄS, ELF, DTK, XYZ, KVA, NOG) | APPLIED (i dag) | `questions` 146 rader, `reflect_prompts` 3 rader; publika SELECT-policyer för anon+authenticated |
| `0006_exam_import` | kolumner och tabeller för import-pipelinen (`exams`, frågemetadata och `prov-figures`-bucketen) | APPLIED (i dag) | `exams` finns med 0 rader (ingen import körd ännu) |
| `0007_usernames` | unikt användarnamn per profil (`username`, skiftlägesokänsligt index och profil-RPC:er) | APPLIED (i dag) | kolumnen `player_profiles.username` finns |
| `0008_duel_rpc_hardening` | härdar kö-/avboknings-RPC:erna (`search_path` och rättigheter) | APPLIED UNDER OLD NAME | kördes tidigare som `0004_duel_rpc_hardening` (går inte att verifiera via REST) |
| `0009_leaderboard` | vecko-XP-topplista för gamification | APPLIED UNDER OLD NAME | `leaderboard_entries` finns med 3 policyer; kördes tidigare som `0005_leaderboard` |
| `0010_duel_rpc_wrapper_hardening` | flyttar RPC-implementationerna till `private` och exponerar tunna `public`-wrappers | APPLIED UNDER OLD NAME | `private.*`-implementationerna för de 16 RPC:erna finns kvar; kördes tidigare som `0006_duel_rpc_wrapper_hardening` |

Kontrollerat i den applicerade databasen:

- `duel_questions` har RLS påslaget och **0 policyer** — facit går inte att
  läsa från klienten.
- `questions`, `reflect_prompts` och `exams` har publika SELECT-policyer för
  `anon` och `authenticated`.
- Publika RPC-signaturer matchar klienten:
  `duel_submit_answer(uuid, text, integer, integer)`,
  `duel_mark_finished(uuid)`, `duel_finish_bot(uuid, integer)`,
  `duel_start_bot_match(text)` och
  `duel_submit_review(uuid, integer, text, text, text)`. `EXECUTE` = true för
  `authenticated`, false för `anon`.
- Körning av appen mot live-DB (anonymt, ingen inloggning): alla sidor 200,
  ORD-övning hämtar frågor från Supabase (`/rest/v1/questions` 200, 146
  rader; `/rest/v1/reflect_prompts` 200, 3 rader), ingen `PGRST205` och
  ingen lokal fallback behövs. `/prov` visar "Inga importerade prov ännu"
  eftersom `exams` har 0 rader — import-pipelinen måste köras för att fylla
  den. 404-sidorna är fortsatt korrekta och inga databasskrivningar skedde
  (endast läsningar).

**Status för åtgärden:** `supabase/manual/apply-0004-0007.sql` är **körd**
(consumed) — den kördes i sin helhet i dag och sparas bara som dokumentation
över exakt vad som applicerades. Ingen ny migration behövs.

`supabase/combined_migrations.sql` (0001 → 0009) ska fortfarande **inte**
klistras in blint: samtliga `0001`–`0009` finns redan i live-databasen och
skulle köras om i onödan.

> **Varning:** `supabase_migrations.schema_migrations` är fortfarande **tom**
> — Management-API-körningen registrerar inga versioner. Därför misslyckas
> `supabase db push` — den tror att inga migrationer är applicerade. Markera
> de redan körda som tillämpade en gång:
>
> ```bash
> supabase migration repair --status applied 0001 0002 0003 0004 0005 0006 0007 0008 0009 0010 --linked
> ```
>
> Obs: `0010` kördes i praktiken under sitt gamla namn
> `0006_duel_rpc_wrapper_hardening`, så dess ledger-rad motsvarar inte någon
> fil i `supabase/migrations/`. Alternativet är att fortsätta köra filerna
> manuellt i nummerordning.

> **OBS `0010` (kvar i `supabase/manual/`):**
> `0010_duel_rpc_wrapper_hardening.sql` är inte längre en migration. Den
> återskapar de **gamla** RPC-signaturerna och skulle därför backa
> `0004_duel_integrity`s server-auktoritativa design och bryta klienten.
> Resultatet av den finns redan i live-databasen (de 16
> `private.*`-implementationerna), men de är nu **föräldralösa** — de publika
> funktionerna kommer från `0004` i stället. Det är ofarliga rester. Filen
> får **aldrig** köras igen och sparas bara som referens, tillsammans med
> `..._rollback.sql` och `..._verify.sql` i `supabase/manual/`.

### Duellpoäng: server-auktoritativ rättning i live (risken stängd)

Risken är **stängd i live-databasen**. `0004_duel_integrity` är applicerad, så
rättningen är server-auktoritativ: facit ligger i `duel_questions` (RLS påslaget
med **0 policyer**, alltså oläsbart från klienten) och klienten skickar varken
rätt/fel eller totalpoäng. De gamla klienttrustade RPC-signaturerna (5/3/4
argument) är borttagna och ersatta av de server-auktoritativa varianterna som
klienten anropar.

**Kvarvarande kunskapslucka:** de klientflöden som kräver en inloggad session
är fortfarande **otestade** mot live-DB — matchmaking och poängsättning i
dueller, att sätta användarnamn, publicering av recensioner samt
provimporten. Det är en testlucka, inte en känd bugg.

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
