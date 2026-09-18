# HP provhäften → questions importer

Imports official högskoleprov PDFs (from studera.nu) into structured question
data + figure PNGs, ready for Supabase.

Everything is driven by **`manifest.json`** — the source of truth for exam id,
title, date, the published pass numbers (which vary: `{1,3,4,5}`, `{2,3,4,5}`,
`{1,2,4,5}`), each pass's type (`kvant`/`verbal`) and URL, and the facit URL.

> **Version policy:** only the *canonical* set recorded in the manifest is
> imported (the primary `facitUrl` + the base pass URLs). Alternate versions are
> skipped (höst 2016 versions 2–4, vår/höst 2017 B/version-2, vår 2018 extra
> versions, höst 2019 version 2). See each exam's `notes` in the manifest.

## Dependencies

- **poppler-utils** (`pdftotext`, `pdfimages`, `pdftoppm`, `pdfinfo`):
  `sudo apt install poppler-utils`
- **tsx** (`npx tsx` — already resolvable via the repo's dev tooling)
- **@supabase/supabase-js** — already in `package.json` (only needed for `insert.ts`)

## Files

```
scripts/import-prov/
├── manifest.json          # source of truth (26 exams, 2012 → 2024)
├── lib/
│   ├── pdf.ts             # poppler-utils wrappers + curl downloader
│   └── parse.ts           # core parser (facit, questions, passages, figures)
├── run.ts                 # CLI: parse exams and print stats/samples
├── insert.ts              # CLI: upsert parsed data into Supabase
├── README.md
├── downloads/<examId>/    # downloaded PDFs (gitignored)
├── parsed/<examId>.json   # parse output (gitignored)
└── figures/               # extracted figure PNGs (gitignored)
```

## Usage

### Parse (verify) two exams

```bash
npx tsx scripts/import-prov/run.ts            # höst 2013 + höst 2024 (default)
npx tsx scripts/import-prov/run.ts hp-2020-10-25   # any single exam
```

Prints per-pass question counts, per-section stats, all flags, and sample
questions. Writes `parsed/hp-YYYY-MM-DD.json` and `figures/*.png`.

### Insert into Supabase (NOT run during verification)

```bash
npx tsx scripts/import-prov/insert.ts hp-2024-10-20
```

Requires in `.env.local`:

- `SUPABASE_SERVICE_ROLE_KEY` (service-role key from Supabase Dashboard →
  Settings → API). The parser/inserter exits with instructions if missing.
- `NEXT_PUBLIC_SUPABASE_URL` (already present).

Idempotent: upserts `public.exams` (id, exam_date, title, status='imported')
and `public.questions` (status='draft'), uploads figures to storage bucket
`prov-figures` under `hp-YYYY-MM-DD/...`.

> **Schema note:** `insert.ts` writes columns beyond the current
> `supabase/migrations/0005_questions.sql` DDL: `questions.exam_id`,
> `exam_date`, `pass_number`, `question_number`, `figure_url`, `source_url`,
> `status`, plus a new `public.exams` table. Those columns/table must exist in
> the database before inserting (add a migration), or the upserts will fail.

## Output shape

`parsed/hp-YYYY-MM-DD.json`:

```jsonc
{
  "examId": "hp-2024-10-20",
  "examDate": "2024-10-20",
  "title": "Högskoleprovet hösten 2024",
  "passes": [
    {
      "examId": "hp-2024-10-20",
      "examDate": "2024-10-20",
      "passNumber": 1,          // from manifest (not hardcoded)
      "passKind": "kvant",      // or "verbal"
      "sourceUrl": "https://…",
      "flags": [],
      "questions": [
        {
          "id": "hp-2024-10-20-p1-q1",
          "kind": "xyz",        // ord|mek|las|xyz|kva|nog|dtk
          "questionNumber": 1,  // 1..40 within the pass
          "prompt": "12x - 54 = 6x + 18\nVad är x?",
          "passage": null,      // LÄS text (only for kind "las")
          "options": ["-6", "-2", "4", "12"],
          "correctIndex": 3,    // 0-based (A=0 … E=4)
          "figureFile": "hp-2024-10-20-p1-q1.png",
          "flags": []
        }
      ]
    }
  ]
}
```

## How parsing works

- **Text** comes from `pdftotext -bbox` word boxes (top-left origin, points).
  Question boundaries are the printed `N.` markers; the printed number is
  authoritative (2-column layouts are disambiguated by x + "nothing to the
  left").
- **Facit** (a 1-page PDF, 4 columns `Provpass N`, 40 letters each) → per-pass
  answer arrays. Column headers are cross-checked against the pass numbers.
- **Sections** per pass (regardless of pass number):
  - kvant: XYZ 1–12, KVA 13–22, NOG 23–28, DTK 29–40 (40 questions)
  - verbal: ORD 1–10, LÄS 11–20, MEK 21–30 (30 questions; ELF is absent from
    the PDFs and is **never** created)
- **Options** are the lettered A–E lines; they're detected as an
  alphabetically-consecutive run (A,B,C,D,E) at one x-indent, which tolerates
  stacked-fraction option text and ignores single letters used as variable
  names inside a stem.
- **LÄS passages** are the flowing text above each `Uppgifter` block, assigned
  to the 2–3 questions that follow it.
- **Figures**: DTK charts/tables live on a dedicated page immediately before
  the question page → rendered full-page to `hp-…-p{N}-fig-{page}.png` and
  shared across the question group. XYZ/KVA/NOG stems (math + geometry, drawn
  as *vector* art that pdftotext garbles) are rendered per-question to
  `hp-…-p{N}-q{Q}.png`.

## Flags (per question, in `flags[]`)

| flag | meaning |
|---|---|
| `facit-letter-mismatch` | facit letter is beyond the parsed option count (A–E vs options found) |
| `missing-figure` | DTK question with no figure page to render |
| `figure-is-text-table` | DTK "figure" is a pure text table (rendered as page image anyway) |
| `missing-passage` | LÄS question with no passage text found |
| `option-count-{n}-expected-{x}` | option count doesn't match the section's norm |
| `no-facit` | no facit column for this pass |

Pass-level flags: `missing-question-{n}`, `unexpected-question-{n}`,
`wrong-question-count (…/…)`, `unattached-images-page-{n} (k)`.

## Known layout quirks (before mass import)

1. **DTK horizontal option grids (2024-era PDFs).** Some DTK question pages
   (e.g. höst 2024 provpass 1 q29–31, provpass 4 q29–31 & q38–40, and höst 2013
   provpass 3 q30–31/q36–37) lay options out as a horizontal row A–D with the
   option text stacked *above* each letter, and the question number at the
   *bottom* of the block. The current parser does not reconstruct these —
   they surface as `option-count-0` + `facit-letter-mismatch`. ~13 of 280
   questions across the two verification exams.
2. **Graph answer options.** A few XYZ/KVA questions have graphs/diagrams as
   the A–D options (no text) — also `option-count-0`. ~2 questions.
3. **Vector math notation.** In 2024 (and some 2013) PDFs the math is vector
   art, not raster images, so `pdftotext` drops/garbles it ("3 x=6", fraction
   digits reordered). The stem is preserved visually via the per-question
   figure PNG; the `prompt` text may look broken.
