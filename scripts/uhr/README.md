# UHR:s kvantitativa frågor

Verktyg för att få in UHR:s kvantitativa provfrågor (XYZ, KVA, NOG, DTK) i frågebanken. Bakgrund och beslut:
`docs/uhr-fragor/plan.md`. Tillstånd: `docs/juridik/uhr-tillstand-kvant.md`.

Kräver poppler-utils (`pdftotext`, `pdftoppm`) och `npm ci` (sharp).

## Steg

1. **Förbered** (laddar ner PDF:erna vid behov, renderar sidorna och skriver facit):

   ```bash
   npx tsx scripts/uhr/prepare.ts                  # alla 52 provpass
   npx tsx scripts/uhr/prepare.ts hp-2024-10-20    # ett prov
   ```

   Sidbilderna och underlaget hamnar i `content/uhr/.arbete/` (ej i git), facit i `content/uhr/facit.json`.

2. **Skriv av** ett provpass: en AI följer `AVSKRIFT.md` och skriver `content/uhr/<examId>-p<N>.json`. Den löser
   varje uppgift utan facit och skriver förklaringen.

3. **Figurer:** `npx tsx scripts/uhr/figur.ts <examId>-p<N>` skriver WebP till `public/uhr/<examId>/`.
   Förstoring vid avskriften: `npx tsx scripts/uhr/figur.ts --zoom <examId>-p<N> <sida> x0 y0 x1 y1 [--dpi 600] [--rotate 90]`.

4. **Kontroll:** `npx tsx scripts/uhr/kontroll.ts <examId>-p<N>` (utan argument: alla). Frågor där AI:ns svar
   skiljer sig från facit gås igenom med facit och får en `verificationNote`. Sätt sedan resultatet med
   `npx tsx scripts/uhr/kontroll.ts --write <examId>-p<N>`.

5. **Uppladdning** som utkast (servern har nycklarna; kör torrkörningen först):

   ```bash
   npm run fragebank:upload -- --uhr --dry-run
   npm run fragebank:upload -- --uhr                 # eller med prov/provpass som argument
   ```

   Ett utkast som redan har en riktig förklaring (t.ex. redigerat på /review) ersätts bara med
   `--skriv-over-utkast`. Publicerade och refuserade frågor rörs aldrig.

6. **Publicera** efter stickprov på /review och kör sedan `npm run fragebank:export`.

## Filer

- `content/uhr/<examId>-p<N>.json`: avskriften (format i `AVSKRIFT.md`, typer i `lib.ts`)
- `content/uhr/facit.json`: UHR:s facit per prov och provpass
- `public/uhr/<examId>/p<N>-q<M>.webp`: figur till en uppgift; `p<N>-s<sida>.webp`: DTK-underlag som delas av
  flera uppgifter
