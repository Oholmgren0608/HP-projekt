# HP Lift — Studieplan för Högskoleprovet

Mata in dina HP-resultat (normpoäng + råpoäng per delprov) så bygger sidan om prioritering, tidsfördelning och veckoplan.

## Kom igång

Kräver Node.js 20.9 eller nyare. I WSL, från `~/hp-lift`:

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

Kör `supabase/migrations/0001_user_state.sql` i Supabase Dashboard →
SQL Editor. Skapar `user_state`-tabellen med RLS (varje användare ser bara
sina egna rader).

Alla migrationer ligger i `supabase/migrations/` och körs i Supabase
Dashboard → SQL Editor i ordning: `0001_user_state.sql`,
`0002_duel_pvp.sql`, `0003_duel_reviews.sql`,
`0004_duel_rpc_hardening.sql`, `0005_leaderboard.sql` och
`0006_duel_rpc_wrapper_hardening.sql`. Migration 0006 flyttar
RPC-implementationerna till schemat `private` och ersätter dem i `public`
med tunna `SECURITY INVOKER`-wrappers, så att klientanropen är oförändrade.
`0006_duel_rpc_wrapper_hardening_verify.sql` kan köras både före och efter
0006 för att jämföra läget, och
`0006_duel_rpc_wrapper_hardening_rollback.sql` återställer läget före 0006
om migrationen behöver rullas tillbaka.

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
