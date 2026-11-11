# UHR:s kvantitativa frågor i appen – plan

Status: **väntar på UHR:s skriftliga tillstånd** (Oscar, 2026-11-11). Ingenting är byggt. AGENTS.md regel 1
("UHR-frågor visas aldrig") gäller oförändrad tills tillståndet finns sparat i `docs/juridik/`.

## Bakgrund

Oscar har frågat UHR och fått tillåtelse att använda alla frågor i den kvantitativa delen (XYZ, KVA, NOG, DTK).
UHR:s frågor ska användas i första hand och appens egna AI-frågor bara som reserv.

I dag finns 26 prov (hösten 2012 till hösten 2024) importerade av `scripts/import-prov/`, varav 52 kvantitativa
provpass. Frågorna ligger som utkast (`exam_id`, id `hp-…`). De har bara facit, och förklaringen är en platshållare.
Figurerna ligger i den privata bucketen `prov-figures`. Databasen spärrar publicering av Provfrågor
(0017: `exam_id is null and id not like 'hp-%' or status <> 'published'`).

## Beslut (Oscar, 2026-11-11)

1. **Tillståndet:** bygg inget förrän det skriftliga tillståndet finns. Spara det sedan i `docs/juridik/`.
2. **Förklaringar:** AI skriver förklaringar till varje UHR-fråga och granskar noggrant. Kedjan blir: en andra AI
   löser frågan utan facit, förklaringen kontrolleras mot UHR:s facit, och teamet stickprovar på /review innan
   frågan publiceras. Varje fråga ska ha en förklaring innan den visas.
3. **Var de används:** överallt i den kvantitativa delen, även duell och Alla mot alla. UHR-frågorna går före
   AI-frågorna, som bara används när det inte finns UHR-frågor att välja.
   - Risken i spelen är accepterad: UHR:s facit finns publikt på studera.nu, så den som vill kan slå upp svaren.
     Det strider mot ADR 0001, som behöver uppdateras med det nya beslutet.
4. **Offline:** UHR-frågorna kommer med i offlinekopian (`fallback-bank.json`).

## Att göra när tillståndet finns

- Spara tillståndet (mejl eller avtal) i `docs/juridik/` och notera omfattning: kvantitativa delen, vilka år,
  eventuella krav på källhänvisning.
- Ändra AGENTS.md regel 1, GLOSSARY.md (Provfråga, Förlaga), PRODUCT.md och ADR 0001 i samma ändring.
- Migration: tillåt publicering av kvantitativa Provfrågor. Verbala Provfrågor förblir spärrade i databasen.
  Figurerna i `prov-figures` behöver nå appen (publik bucket för kvantfigurerna eller kopiering till en publik
  bucket). Testa att verbala Provfrågor fortfarande inte kan publiceras eller läsas.
- Förklaringar för alla kvantitativa UHR-frågor via frågebankens kedja, som utkast, publiceras efter stickprov.
- Urval: övning, prov, nivåtest, duell och Alla mot alla väljer UHR-frågor först och fyller på med AI-frågor.
- Visa källan vid varje UHR-fråga, till exempel "Högskoleprovet hösten 2019, provpass 3, uppgift 12", om
  tillståndet kräver det.
- Offlinekopian genereras om med `fragebank:export`, och integritetspolicy och villkor ses över.
