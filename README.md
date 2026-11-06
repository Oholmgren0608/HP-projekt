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
- Interaktiv veckoplan med övningar för alla åtta delprov (KVA, DTK, XYZ, NOG, ORD, LÄS, MEK, ELF). Kräver konto;
  utan konto syns vecka 1 som förhandsvisning
- Övningshubbar per delprov med valfritt antal frågor, tidtaget mini-prov och daglig repetition (SRS)
- Flashcards, läsbibliotek och officiella gamla HP-prov (PDF från UHR)
- **Duell** — frågedueller mot andra spelare (PvP) eller en bot, med
  ELO-ranking, matchmaking-kö, privata matcher via kod, matchhistorik och
  recensioner efter avslutad match
- **Gamification** — XP, nivåer, streak, dagliga uppdrag och achievements

## Kända problem

Öppna problem med påverkan och status står i
[docs/KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md).

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

Migrationerna ligger i `supabase/migrations/` och appliceras med
`npm run db:push` (provkör först med `npm run db:dry`). Hur kommandona sätts
upp (Supabase CLI och variablerna i `.env.local`) står i
[AGENTS.md §4](AGENTS.md#4-commands).

Två saker i `supabase/` är inte migrationer:

- `supabase/manual/` innehåller SQL som körs för hand, som rollback och
  kontroller. `apply-0004-0007.sql` i den mappen är redan körd och sparas bara
  som dokumentation.
- `supabase/combined_migrations.sql` är en gammal kopia av `0001`–`0009`, som
  redan finns i live-databasen. Kör den inte.

> **OBS `supabase/manual/0010_duel_rpc_wrapper_hardening.sql`:** filen är inte
> en migration (migrationen `0010` är `0010_duel_queue_ttl.sql`) och får
> **aldrig** köras. Den återskapar de gamla duell-RPC:erna som tar emot
> rätt/fel och poäng från klienten och skulle backa den server-auktoritativa
> rättningen från `0004_duel_integrity`. Den sparas bara som referens,
> tillsammans med `..._rollback.sql` och `..._verify.sql`.

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
