# HP Lift — Studieplan för Högskoleprovet

Mata in dina HP-resultat (normpoäng + råpoäng per delprov) så bygger sidan om prioritering, tidsfördelning och veckoplan.

## Kom igång

Kräver Node.js 20.9 eller nyare. I WSL, från `~/pi/Webappar/HP-projekt`:

```bash
npm install
npm run dev
```

Öppna [http://127.0.0.1:43123](http://127.0.0.1:43123).

För lokal utveckling med hot reload: `npm run dev` (samma port).

## Vad appen innehåller

- **Nivåtest** — för dig som är ny på HP eller känner dig rostig: ett kort, otidsatt minitest med frågor från alla delprov. Resultatet uppskattar din nivå och bygger veckoplanen automatiskt.
- **Resultatformulär** — spara normpoäng, delprovspoäng, timmar/vecka och veckor till prov; planen genereras om lokalt
- Interaktiv veckoplan med övningar (ORD, MEK, LÄS, ELF, DTK)
- Flashcards, läsbibliotek och officiella gamla HP-prov (PDF från UHR)
- **Duell** — frågedueller mot andra (PvP) eller botar med ELO-ranking,
  matchmaking-kö, privata matcher via kod, matchhistorik och recensioner
  efter avslutad match
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

Migrationerna i `supabase/migrations/` har körts manuellt i Supabase
Dashboard → SQL Editor, i ordning:

- `0001_user_state.sql` — `user_state`-tabellen med RLS (varje användare
  ser bara sina egna rader).
- `0002_duel_pvp.sql` — spelarprofiler (ELO/statistik), matcher,
  per-fråga-svar och matchmaking-kö, plus SECURITY DEFINER-funktioner för
  ranking.
- `0003_duel_reviews.sql` — recensioner och betyg efter dueller, flaggning
  av osportsliga konton och bot-svårighetsjustering.
- `0004_duel_rpc_hardening.sql` — härdar kö-/avboknings-RPC:erna
  (`search_path` och rättigheter).
- `0005_leaderboard.sql` — vecko-XP-topplista för gamification.
- `0006_duel_rpc_wrapper_hardening.sql` — flyttar RPC-implementationerna
  till schemat `private` och ersätter dem i `public` med tunna
  `SECURITY INVOKER`-wrappers, så klientanropen är oförändrade.
  `0006_duel_rpc_wrapper_hardening_verify.sql` jämför läget före/efter och
  `0006_duel_rpc_wrapper_hardening_rollback.sql` återställer läget före
  0006.

> **Varning:** `supabase_migrations.schema_migrations` är tom även om
> 0001–0006 redan har körts (manuellt i SQL Editor). Därför misslyckas
> `supabase db push` — den tror att inga migrationer är applicerade. Kör
> istället följande en gång för att markera dem som tillämpade:
>
> ```bash
> supabase migration repair --status applied 0001 0002 0003 0004 0005 0006 --linked
> ```

### Känd risk: duellpoäng litar på klienten (migration 0007, ej genomförd)

Duellmotorn räknar i dag ut rätt/fel och tidsåtgång i klienten och skickar
siffrorna till servern, som lagrar och rankar utifrån dem. Det betyder att
en användare med utvecklarverktyg kan manipulera sin ELO och statistik.
Planen är migration 0007 (ännu inte skriven eller körd):

1. Ny tabell `duel_questions` (question_id + correct_index) så att rätt
   svar lagras på servern.
2. Klienten skickar bara det valda svaret (och eventuell tidsåtgång som
   information) — aldrig en egen "correct"-flagga.
3. Servern räknar om rätt svar, vinnare och ELO utifrån de lagrade
   correct_index-värdena; klientens räkningar ignoreras helt.

Inget av detta är tillämpat i databasen ännu. Tills 0007 är skriven och körd
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
