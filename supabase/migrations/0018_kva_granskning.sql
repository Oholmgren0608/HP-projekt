-- 0018: Rättelser efter granskningen av KVA-frågorna i granskningskön (2026-10-26).
--
-- Alla 41 KVA-frågor under "Att granska" (ovn-kva-001–040 och den äldre
-- kva-3) räknades igenom på nytt och löstes dessutom av en oberoende
-- kontrollant utan facit. Facit stämde i alla 41. Sex texter rättas:
--
-- * ovn-kva-038: förklaringen hänvisade till "bilden", men frågan har ingen
--   bild (anmärkningen från andra kontrollen).
-- * ovn-kva-017 och ovn-kva-040: slutsatsen sade att ingen av relationerna
--   gäller ("varken ... eller att de är lika") – det ska vara att ingen av dem
--   gäller *alltid*.
-- * ovn-kva-031: "y tar bort en del av x" stämmer inte när |y| > x, som i
--   förklaringens eget exempel.
-- * ovn-kva-013: kommaskarv i förklaringens sista mening.
-- * kva-3 (äldre, publicerad): förklaringens sista mening var obegriplig
--   (anmärkningen från andra kontrollen), och frågan följde inte provets
--   KVA-format. Den får samma format som de nya frågorna (fast frågetext,
--   informationen och kvantiteterna i passage, standardalternativen). Facit
--   är oförändrat (index 3, informationen är otillräcklig), så duellens facit
--   påverkas inte.
--
-- De nya formerna har gått igenom andra kontrollen och var ense, så
-- verification blir 'agreed' och anmärkningen tas bort. content/ovningsfragor/
-- kva.json har samma texter.
--
-- Varje rättelse skriver bara en rad som fortfarande har exakt det innehåll
-- som granskades. Har någon ändrat frågan på /review sedan dess stoppas
-- migrationen i stället för att skriva över ändringen. Saknas frågan (till
-- exempel i en tom lokal databas) görs ingenting, och en rad som redan har den
-- rättade formen lämnas orörd.

do $$
declare
  fix record;
  updated integer;
begin
  for fix in
    select *
      from (values
    ('ovn-kva-013',
     -- före
     'Jämför kvantitet I och kvantitet II.',
     'En förening har 7 medlemmar.
Kvantitet I: antalet sätt att välja en ordförande och en kassör bland medlemmarna, om ingen får ha båda uppdragen
Kvantitet II: antalet sätt att välja ut tre av medlemmarna till en arbetsgrupp',
     '["I är större än II","II är större än I","I är lika med II","Informationen är otillräcklig"]'::jsonb,
     0,
     'Ordföranden kan väljas på 7 sätt och kassören därefter på 6 sätt, så I = 7 · 6 = 42; här spelar ordningen roll eftersom uppdragen är olika. I arbetsgruppen har alla samma roll. Väljer man en person i taget får man 7 · 6 · 5 = 210 ordnade val, men varje grupp om tre räknas då 3 · 2 · 1 = 6 gånger, så II = 210/6 = 35. Alltså är I större. Den som tror att fler valda personer alltid ger fler möjligheter svarar att II är större, kvantiteterna är inte lika eftersom 42 ≠ 35, och inget är okänt, så informationen räcker.',
     -- efter
     'Jämför kvantitet I och kvantitet II.',
     'En förening har 7 medlemmar.
Kvantitet I: antalet sätt att välja en ordförande och en kassör bland medlemmarna, om ingen får ha båda uppdragen
Kvantitet II: antalet sätt att välja ut tre av medlemmarna till en arbetsgrupp',
     '["I är större än II","II är större än I","I är lika med II","Informationen är otillräcklig"]'::jsonb,
     'Ordföranden kan väljas på 7 sätt och kassören därefter på 6 sätt, så I = 7 · 6 = 42; här spelar ordningen roll eftersom uppdragen är olika. I arbetsgruppen har alla samma roll. Väljer man en person i taget får man 7 · 6 · 5 = 210 ordnade val, men varje grupp om tre räknas då 3 · 2 · 1 = 6 gånger, så II = 210/6 = 35. Alltså är I större. Den som tror att fler valda personer alltid ger fler möjligheter svarar att II är större. Kvantiteterna är inte lika eftersom 42 ≠ 35, och inget är okänt, så informationen räcker.'),
    ('ovn-kva-017',
     -- före
     'Jämför kvantitet I och kvantitet II.',
     'En påse innehåller bara röda och blå kulor, och det finns fler röda än blå kulor. Två kulor dras slumpmässigt ur påsen utan återläggning.
Kvantitet I: sannolikheten att båda kulorna är röda
Kvantitet II: 1/2',
     '["I är större än II","II är större än I","I är lika med II","Informationen är otillräcklig"]'::jsonb,
     3,
     'Sannolikheten beror på hur många kulor det finns av varje färg. Med 2 röda och 1 blå kula blir den 2/3 · 1/2 = 1/3, så II är större. Med 5 röda och 1 blå blir den 5/6 · 4/5 = 2/3, så I är större. (Med 3 röda och 1 blå blir den 3/4 · 2/3 = 1/2, alltså lika.) Eftersom olika fördelningar ger olika resultat gäller varken att I är större, att II är större eller att de är lika. Att det finns fler röda kulor än blå räcker inte för att sannolikheten för två röda ska bli större än 1/2.',
     -- efter
     'Jämför kvantitet I och kvantitet II.',
     'En påse innehåller bara röda och blå kulor, och det finns fler röda än blå kulor. Två kulor dras slumpmässigt ur påsen utan återläggning.
Kvantitet I: sannolikheten att båda kulorna är röda
Kvantitet II: 1/2',
     '["I är större än II","II är större än I","I är lika med II","Informationen är otillräcklig"]'::jsonb,
     'Sannolikheten beror på hur många kulor det finns av varje färg. Med 2 röda och 1 blå kula blir den 2/3 · 1/2 = 1/3, så II är större. Med 5 röda och 1 blå blir den 5/6 · 4/5 = 2/3, så I är större. (Med 3 röda och 1 blå blir den 3/4 · 2/3 = 1/2, alltså lika.) Olika fördelningar ger olika resultat, så varken att I är större, att II är större eller att de är lika gäller alltid. Att det finns fler röda kulor än blå räcker inte för att sannolikheten för två röda ska bli större än 1/2.'),
    ('ovn-kva-031',
     -- före
     'Jämför kvantitet I och kvantitet II.',
     'x > 0 och y < 0
Kvantitet I: x − y
Kvantitet II: |x + y|',
     '["I är större än II","II är större än I","I är lika med II","Informationen är otillräcklig"]'::jsonb,
     0,
     'Eftersom y är negativt är −y positivt, så kvantitet I är x − y = x + |y|, summan av två positiva tal. I summan x + y tar det negativa talet y i stället bort en del av x, så |x + y| är skillnaden mellan de positiva talen x och |y|, och en skillnad mellan två positiva tal är alltid mindre än deras summa. Exempel: x = 5 och y = −2 ger x − y = 7 och |x + y| = 3, och x = 2 och y = −6 ger x − y = 8 och |x + y| = 4. I är alltså större för alla tillåtna värden. Fällan är att tro att absolutbeloppet gör |x + y| lika stort som x − y; det skulle kräva att x eller y var 0, vilket inte är tillåtet. II kan aldrig vara större, och informationen räcker.',
     -- efter
     'Jämför kvantitet I och kvantitet II.',
     'x > 0 och y < 0
Kvantitet I: x − y
Kvantitet II: |x + y|',
     '["I är större än II","II är större än I","I är lika med II","Informationen är otillräcklig"]'::jsonb,
     'Eftersom y är negativt är −y positivt, så kvantitet I är x − y = x + |y|, summan av två positiva tal. I summan x + y dras |y| i stället ifrån x, så |x + y| är skillnaden mellan de positiva talen x och |y| (det större minus det mindre). En skillnad mellan två positiva tal är alltid mindre än deras summa. Exempel: x = 5 och y = −2 ger x − y = 7 och |x + y| = 3, och x = 2 och y = −6 ger x − y = 8 och |x + y| = 4. I är alltså större för alla tillåtna värden. Fällan är att tro att absolutbeloppet gör |x + y| lika stort som x − y; det skulle kräva att x eller y var 0, vilket inte är tillåtet. II kan aldrig vara större, och informationen räcker.'),
    ('ovn-kva-038',
     -- före
     'Jämför kvantitet I och kvantitet II.',
     'Linjen y = kx + m skär x-axeln i en punkt med positiv x-koordinat och y-axeln i en punkt med negativ y-koordinat.
Kvantitet I: k
Kvantitet II: m',
     '["I är större än II","II är större än I","I är lika med II","Informationen är otillräcklig"]'::jsonb,
     0,
     'Linjen skär y-axeln där x = 0, alltså i punkten (0, m), så m är negativt. Linjen skär x-axeln där kx + m = 0, alltså där x = −m/k. Eftersom m är negativt är −m positivt, och för att −m/k ska vara positivt måste även k vara positivt. (k kan inte vara 0, för då vore linjen y = m parallell med x-axeln och skulle aldrig skära den.) Det stämmer med bilden: linjen går från en punkt under origo till en punkt till höger om origo och lutar alltså uppåt. Då är k > 0 > m, så I är större för alla sådana linjer. Fällan är att tro att lutningen kan ha vilket tecken som helst och svara att informationen är otillräcklig; varken likhet eller att II är större är möjligt.',
     -- efter
     'Jämför kvantitet I och kvantitet II.',
     'Linjen y = kx + m skär x-axeln i en punkt med positiv x-koordinat och y-axeln i en punkt med negativ y-koordinat.
Kvantitet I: k
Kvantitet II: m',
     '["I är större än II","II är större än I","I är lika med II","Informationen är otillräcklig"]'::jsonb,
     'Linjen skär y-axeln där x = 0, alltså i punkten (0, m), så m är negativt. Linjen skär x-axeln där kx + m = 0, alltså där x = −m/k. Eftersom m är negativt är −m positivt, och för att −m/k ska vara positivt måste även k vara positivt. (k kan inte vara 0, för då vore linjen y = m parallell med x-axeln och skulle aldrig skära den.) Samma sak syns om man ritar linjen: den går genom en punkt på y-axeln under origo och en punkt på x-axeln till höger om origo och lutar alltså uppåt. Då är k > 0 > m, så I är större för alla sådana linjer. Fällan är att tro att lutningen kan ha vilket tecken som helst och svara att informationen är otillräcklig; varken likhet eller att II är större är möjligt.'),
    ('ovn-kva-040',
     -- före
     'Jämför kvantitet I och kvantitet II.',
     'f är en andragradsfunktion, och grafen till f har symmetrilinjen x = 3.
Kvantitet I: f(0)
Kvantitet II: f(5)',
     '["I är större än II","II är större än I","I är lika med II","Informationen är otillräcklig"]'::jsonb,
     3,
     'Grafen är en parabel som är symmetrisk kring linjen x = 3. Punkten x = 0 ligger 3 steg från symmetrilinjen och x = 5 ligger 2 steg från den. Om parabeln öppnar sig uppåt ökar funktionsvärdet ju längre från symmetrilinjen man kommer: f(x) = (x − 3)² ger f(0) = 9 och f(5) = 4, så I är större. Om parabeln öppnar sig nedåt är det tvärtom: f(x) = −(x − 3)² ger f(0) = −9 och f(5) = −4, så II är större. Eftersom båda är möjliga gäller varken att I är större, att II är större eller att de är lika. Fällan är att utan vidare anta att parabeln öppnar sig uppåt och svara att I är större.',
     -- efter
     'Jämför kvantitet I och kvantitet II.',
     'f är en andragradsfunktion, och grafen till f har symmetrilinjen x = 3.
Kvantitet I: f(0)
Kvantitet II: f(5)',
     '["I är större än II","II är större än I","I är lika med II","Informationen är otillräcklig"]'::jsonb,
     'Grafen är en parabel som är symmetrisk kring linjen x = 3. Punkten x = 0 ligger 3 steg från symmetrilinjen och x = 5 ligger 2 steg från den. Om parabeln öppnar sig uppåt ökar funktionsvärdet ju längre från symmetrilinjen man kommer: f(x) = (x − 3)² ger f(0) = 9 och f(5) = 4, så I är större. Om parabeln öppnar sig nedåt är det tvärtom: f(x) = −(x − 3)² ger f(0) = −9 och f(5) = −4, så II är större. Båda fallen är möjliga, så varken att I är större, att II är större eller att de är lika gäller alltid. Fällan är att utan vidare anta att parabeln öppnar sig uppåt och svara att I är större.'),
    ('kva-3',
     -- före
     'x > 0. Kvantitet I: 2x. Kvantitet II: x + 3. Vilken är störst?',
     null,
     '["I är större","II är större","De är lika stora","Går inte att avgöra"]'::jsonb,
     3,
     'Kvantitet I: 2x. Kvantitet II: x + 3. Om x = 1 blir I = 2 och II = 4, så II är större, men om x = 4 blir I = 8 och II = 7, så då är I större i stället. Eftersom relationen beror på vilket positivt värde x har går det inte att avgöra vilken kvantitet som är störst, så varken I är större eller II är större eller lika stora kan gälla generellt.',
     -- efter
     'Jämför kvantitet I och kvantitet II.',
     'x > 0
Kvantitet I: 2x
Kvantitet II: x + 3',
     '["I är större än II","II är större än I","I är lika med II","Informationen är otillräcklig"]'::jsonb,
     'Skillnaden mellan kvantiteterna är 2x − (x + 3) = x − 3, så vilken kvantitet som är störst beror på x. Med x = 1 blir I = 2 och II = 4, så II är större. Med x = 4 blir I = 8 och II = 7, så I är större. Med x = 3 blir båda 6. Alla tre fallen är möjliga när x > 0, så varken att I är större, att II är större eller att de är lika gäller för alla tillåtna x, och informationen är otillräcklig. Fällan är att pröva bara ett värde på x, till exempel x = 1, och svara att II är större.')
      ) as v(id,
             old_prompt, old_passage, old_options, correct_index, old_explain,
             new_prompt, new_passage, new_options, new_explain)
  loop
    update public.questions q
       set prompt = fix.new_prompt,
           passage = fix.new_passage,
           options = fix.new_options,
           explain = fix.new_explain,
           verification = 'agreed',
           verification_note = null
     where q.id = fix.id
       and q.prompt = fix.old_prompt
       and q.passage is not distinct from fix.old_passage
       and q.options = fix.old_options
       and q.correct_index = fix.correct_index
       and q.explain = fix.old_explain;
    get diagnostics updated = row_count;

    if updated = 0 and exists (
      select 1
        from public.questions q
       where q.id = fix.id
         and not (q.prompt = fix.new_prompt
                  and q.passage is not distinct from fix.new_passage
                  and q.options = fix.new_options
                  and q.correct_index = fix.correct_index
                  and q.explain = fix.new_explain)
    ) then
      raise exception
        'Frågan % har ändrats sedan granskningen (2026-10-26). Rätta den på /review i stället.',
        fix.id;
    end if;
  end loop;
end
$$;
