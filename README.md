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

Kör migrationsfilerna i Supabase Dashboard → SQL Editor, i nummerordning:

- `0001_user_state.sql` — `user_state`-tabellen med RLS (varje användare
  ser bara sina egna rader), för molnsynk.
- `0002_duel_pvp.sql` — spelarprofiler (ELO/statistik), matcher,
  per-fråga-svar och matchmaking-kö, plus SECURITY DEFINER-funktioner för
  ranking.
- `0003_duel_reviews.sql` — recensioner och betyg efter dueller, rapporter,
  flaggning av osportsliga konton och bot-svårighetsjustering.
- `0004_duel_integrity.sql` — server-auktoritativ rättning (facit-tabell),
  tätare RLS, mindre profilexponering och viktad `received_rating_count`
  för dueller.
- `0005_questions.sql` — Supabase-backade övningsfrågor: tabellerna
  `questions` och `reflect_prompts` (ORD, MEK, LÄS, ELF, DTK, XYZ, KVA,
  NOG).
- `0006_exam_import.sql` — kolumner och tabeller för import-pipelinen
  (`exams`, frågemetadata och `prov-figures`-bucketen).
- `0007_usernames.sql` — unikt användarnamn per profil (`username`,
  skiftlägesokänsligt index och profil-RPC:er).

`0002`–`0004` behövs bara om du vill använda Duell-funktionen.
Vill du köra allt i ett svep finns `supabase/combined_migrations.sql`
(0001 → 0010) att klistra in direkt i SQL Editor.

Dessutom finns härdnings- och topplista-migrationerna från feature-grenen.
Efter merge-omskrivningen ligger de efter main-kedjan (`0001`–`0007`):

- `0008_duel_rpc_hardening.sql` — härdar kö-/avboknings-RPC:erna
  (`search_path` och rättigheter).
- `0009_leaderboard.sql` — vecko-XP-topplista för gamification.
- `0010_duel_rpc_wrapper_hardening.sql` — flyttar RPC-implementationerna
  till schemat `private` och ersätter dem i `public` med tunna
  `SECURITY INVOKER`-wrappers, så klientanropen är oförändrade.
  `0010_duel_rpc_wrapper_hardening_verify.sql` jämför läget före/efter och
  `0010_duel_rpc_wrapper_hardening_rollback.sql` återställer läget före
  0010. Båda dessa manuella verktyg ligger i `supabase/manual/` (utanför
  migrations-mappen) så att de aldrig plockas upp av en automatisk körning.

> **OBS 0008–0010 (feature-kedjan):** `0008`–`0010` definierar om samma
> duel-RPC:er som `0004_duel_integrity.sql` redan definierar. Körs båda i
> ordning vinner `0008`–`0010` (de ligger sist), så granska om
> wrapper-härdningen i `0010` fortfarande behövs innan du kör dem — annars
> kan main:s integritetshärdning i `0004` skrivas över.
>
> `supabase/manual/0010_duel_rpc_wrapper_hardening_rollback.sql` och
> `..._verify.sql` är **manuella verktyg**, inte migrationer. Rollback-filen
> ångrar `0010` och får aldrig köras automatiskt; de ligger därför i
> `supabase/manual/` i stället för i `supabase/migrations/`.

> **Varning:** `supabase_migrations.schema_migrations` är tom även om
> 0001–0007 redan har körts (manuellt i SQL Editor). Därför misslyckas
> `supabase db push` — den tror att inga migrationer är applicerade. Kör
> istället följande en gång för att markera dem som tillämpade:
>
> ```bash
> supabase migration repair --status applied 0001 0002 0003 0004 0005 0006 0007 --linked
> ```

### Känd risk: duellpoäng litar på klienten (migration 0011, ej genomförd)

Duellmotorn räknar i dag ut rätt/fel och tidsåtgång i klienten och skickar
siffrorna till servern, som lagrar och rankar utifrån dem. Det betyder att
en användare med utvecklarverktyg kan manipulera sin ELO och statistik.
Planen är migration 0011 (ännu inte skriven eller körd):

1. Ny tabell `duel_questions` (question_id + correct_index) så att rätt
   svar lagras på servern.
2. Klienten skickar bara det valda svaret (och eventuell tidsåtgång som
   information) — aldrig en egen "correct"-flagga.
3. Servern räknar om rätt svar, vinnare och ELO utifrån de lagrade
   correct_index-värdena; klientens räkningar ignoreras helt.

Inget av detta är tillämpat i databasen ännu. Tills 0011 är skriven och körd
ska duellstatistik betraktas som ej manipulationssäker.

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
