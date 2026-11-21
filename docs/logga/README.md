# Loggan

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="hp-topp-logga-mork.svg">
  <img src="hp-topp-logga.svg" alt="HP Topp" height="64">
</picture>

En bergsklättrare i profil med hjälm, ryggsäck, stegjärn och en isyxa i varje hand, på väg uppför eggen på
ett berg format efter K2, i en Skymningsblå ruta. Klättraren går åt samma håll som poängen ska: uppåt.
Bestämd av Oscar 2026-11-20 (ersatte vandraren från 2026-11-10 och kabinbanan från 2026-11-08).
Samma klättrare, i samma pose och på en lika brant egg (62 grader), finns i sidans bakgrund
(`src/components/mountain-backdrop.tsx`); testet `mountain-backdrop.test.ts` larmar om lutningarna glider isär.

## Filer

| Fil | Till vad |
| --- | --- |
| `hp-topp-logga.svg` | Ordbilden (märke + "HP Topp") på ljus bakgrund |
| `hp-topp-logga-mork.svg` | Ordbilden på mörk bakgrund |
| `hp-topp-symbol.svg`, `hp-topp-symbol-mork.svg` | Bara märket, från 20 px och uppåt |
| `hp-topp-symbol-liten.svg` | Förenklat märke under 20 px (större klättrare, berget i en ton utan snö). Samma som `src/app/icon.svg` |
| `hp-topp-app-ikon.svg`, `hp-topp-app-ikon-1024.png` | App-ikon utan rundade hörn (iOS och appbutiker rundar själva), t.ex. för Capacitor-appen |

I appen ritas märket av `LogoMark` (`src/components/logo-mark.tsx`) i sidomenyn och i mobilens toppfält.
Det tar färgerna från temat, så det följer ljust och mörkt läge. Webbläsarfliken och hemskärmen använder
`src/app/icon.svg`, `src/app/favicon.ico` (16, 32 och 48 px) och `src/app/apple-icon.png` (180 px).

## Regler

- **Färger:** ljust läge Skymningsblå `#2b4c7e` med vitt, mörkt läge `#8da9d6` med `#10161f`. Berget är
  samma färg som klättraren: skuggsidan 22 % täckning, solsidan (till vänster om mittryggen) ungefär 35 %, snön på
  toppen och axeln 85 % och den avlägsna kedjan nere till vänster 14 %. Inga andra färger, inga övertoningar och inga skuggor
  (Lugn). Grönt och rött används aldrig i loggan.
- **Text:** "HP Topp" i IBM Plex Sans SemiBold (600). Appen hette HP Lift fram till 2026-11-21. I SVG-filerna är
  texten konturer, så de ser likadana ut utan typsnittet. Proportioner som i appen: märke 28 px, text 16 px, 10 px
  mellanrum.
- **Storlek:** huvudmärket från 20 px. Mindre än så används det förenklade märket.
- **Frizon:** minst en fjärdedel av märkets höjd fritt runt loggan.
- **Ändra inte:** sträck, rotera, färga om eller lägg loggan på en rörig bild. Klättraren klättrar alltid åt höger, uppför.

## Ändra loggan

Geometrin finns på två ställen som ska vara lika: `LogoMark` och SVG-filerna här. Testet
`src/components/logo-mark.test.ts` larmar om de glider isär. PNG- och ICO-filerna är renderade från
SVG-filerna med `sharp`. Rendera om dem om märket ändras.

Textkonturerna i ordbilden är ritade från `src/app/fonts/IBMPlexSans-600.ttf` med samma proportioner: märket är
64 enheter högt, texten 36,57 (16 × 64/28) och börjar 22,86 enheter (10 × 64/28) till höger om märket, och
versalhöjden är centrerad på märkets mitt.
