# Bildförklaringar till UHR-frågorna

Varje publicerad UHR-fråga med bild får en bildförklaring till facit: frågans egen bild ur provhäftet visas igen
efter svaret, med markeringar som förklarar svaret och en kort bildtext (Oscar, 2026-11-20). Markeringarna visas i
övningen, provpassen, nivåtestet, Dagens repetition, duellernas och Alla mot allas genomgång och på /review.

Formatet och ritningen finns i `src/lib/content/uhr-marks.ts`, visningen i `src/components/uhr-mark-figure.tsx`.

## Arbetsgång för ett provpass

```bash
export FONTCONFIG_FILE=$HOME/.cache/hp-browser/fonts.conf   # bara i agentmiljön, för text i förhandsbilderna
npx tsx scripts/uhr/forklaring.ts lista hp-2019-10-20-p1          # frågorna, facit, förklaringen och bilden med rutnät
# skriv public/uhr/forklaring/hp-2019-10-20-p1.json
npx tsx scripts/uhr/forklaring.ts kontroll hp-2019-10-20-p1       # formatet, bildens mått, att alla frågor finns
npx tsx scripts/uhr/forklaring.ts rendera hp-2019-10-20-p1        # förhandsbilder att titta på
```

1. Kör `lista`. Läs frågan, facit och förklaringen. Titta på arbetsbilden (PNG med rutnät: tunna linjer var 50:e
   pixel och tal var 100:e). Koordinaterna är bildens egna pixlar, med origo uppe till vänster.
2. Bestäm vad i bilden som förklarar svaret, och skriv markeringarna.
3. Kör `kontroll` tills den inte visar några fel.
4. Kör `rendera` och titta på **varje** förhandsbild. Ligger markeringarna exakt där de ska? Täcker en etikett något
   man behöver se? Rätta och rendera igen. Beskär gärna en förhandsbild för att se detaljer.
5. Alla frågor som `lista` visar ska ha en markering när du är klar (`kontroll` säger "saknar markeringar" annars).

`kontroll` skriver också om `src/lib/content/uhr-marks-passes.json`, listan över provpass som har en fil i
`public/uhr/forklaring/`. Appen hämtar bara filer som står i listan, så att provpass utan bildförklaringar inte ger
404-fel i konsolen. Committa listan tillsammans med provpassets fil; ett test i `src/lib/content/uhr-marks.test.ts`
stoppar en lista som inte stämmer med mappen. Skriptet läser själv listan, så om filen saknas eller är trasig (t.ex.
efter en merge-konflikt): skriv `[]` i den och kör `kontroll` igen.

## Filen

```json
{
  "examId": "hp-2019-10-20",
  "passNumber": 1,
  "marks": {
    "hp-2019-10-20-p1-q29": {
      "image": "/uhr/hp-2019-10-20/p1-s16.webp",
      "width": 1284,
      "height": 1764,
      "scale": 0.45,
      "caption": "Fritidsaktiviteter: cirka 2 750 + 3 300 + 3 900 ≈ 10 000 tusen kronor, alltså 10 miljoner kronor.",
      "shapes": [
        { "type": "box", "x": 902, "y": 1330, "w": 300, "h": 318 },
        { "type": "label", "x": 948, "y": 1486, "text": "2 750" }
      ]
    }
  }
}
```

`image`, `width` och `height` står i `lista`. Formerna:

| Typ | Fält | Till vad |
| --- | --- | --- |
| `box` | `x, y, w, h` | Ram med svag fyllning runt rätt rad, kolumn, stapel, kartdel eller figurdel |
| `ellipse` | `cx, cy, rx, ry` | Ring runt en punkt, en vinkel eller ett tal |
| `line` | `x1, y1, x2, y2`, `dashed` (valfri) | Hjälplinje: höjd, diagonal, avläsningslinje från axel till kurva |
| `arrow` | `x1, y1, x2, y2` (spetsen i x2, y2) | Pekar från en etikett till det den gäller |
| `polygon` | `points: [[x, y], …]` (minst tre) | Fyllt område, t.ex. en area som räknas ut eller en del av en figur |
| `label` | `x, y, text`, `anchor` (`start`, `middle`, `end`; standard `middle`) | Kort text, högst 24 tecken: ett mått, ett avläst värde, en vinkel |

En etikett centreras på `x, y` (lodrätt alltid, vågrätt med `anchor: "middle"`). Den får en vit kant, så den syns ovanpå
linjer, men den ska inte täcka tal eller linjer som behövs.

`scale` (0,3–3, standard 1) styr storleken på text, linjer och pilar. Etiketterna ska bli ungefär lika höga som bildens
egna tal, eller lite högre. På hela DTK-sidor (cirka 1 300 px breda) passar oftast 0,4–0,6. På små geometribilder (under
cirka 600 px) passar 1–1,3.

Det finns en färg, Skymningsblå, och den väljs inte. Grönt och rött används aldrig.

## Bildtexten (`caption`)

Skriv en mening på svenska, högst 160 tecken, som säger vad markeringarna visar och hur det ger svaret. Den ska stämma
med förklaringen, men upprepa den inte ordagrant. Exempel:

- "Axlarna delar femhörningen i en kvadrat och två trianglar: 4 + 2 + 4 = 10 areaenheter."
- "Basvinklarna är 180° − 130° = 50° och 180° − 117° = 63°, så v = 180° − 50° − 63° = 67°."
- "Raden för 2014 och kolumnen för kvinnor möts vid 48 procent."

Skriv i samma ton som förklaringarna: saklig och lugn. Inga utrop och ingen emoji.

## Vad som ska markeras

- **DTK:** ringa in eller rama in exakt den del av tabellen, diagrammet eller kartan som svaret bygger på: rätt rad och
  kolumn, rätt staplar eller rätt område. Skriv avlästa värden som etiketter när en uträkning behövs. Täck inte talen.
  Flera frågor kan ha samma bild. Varje fråga får egna markeringar för just den frågan.
- **Geometri (XYZ, KVA, NOG):** visa uträknade mått och vinklar som etiketter vid rätt sida eller vinkel. Rita
  hjälplinjer streckade, och fyll områden som räknas ut med `polygon`.
- **Grafer och koordinatsystem:** streckade avläsningslinjer från axeln till kurvan eller punkten, med etikett för
  värdet. Rama in skärningspunkter med `ellipse`.
- **NOG:** markera det varje påstående ger, om bilden hjälper, t.ex. etiketterna "(1)" och "(2)" vid de mått
  påståendena talar om.
- Är bilden bara en del av frågan, t.ex. en formel, en tabell eller en figur med beteckningar, så markera den del som
  avgör svaret.

Talen och måtten måste stämma med bilden, facit och förklaringen. Läs av noga med hjälp av rutnätet. Verkar
förklaringen fel, ändra inte i `content/uhr/`. Skriv det i din rapport.

## Regler för den som gör markeringarna

- Skriv bara i `public/uhr/forklaring/<provpass>.json` för ditt eget provpass. Rör inga andra filer (listan över
  provpass uppdaterar `kontroll` själv).
- Committa inte, och kör inte bygget eller hela testsviten. Det gör den som samordnar.
- Rapportera när du är klar:
  - hur många frågor du markerade,
  - att `kontroll` visar 0 fel,
  - frågor där du var osäker eller där förklaringen verkar fel.
