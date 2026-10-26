-- 0020: De sju lätta äldre KVA-frågorna byts mot sju svårare Övningsfrågor.
--
-- kva-1, kva-2 och kva-4–kva-8 (3/4 jämfört med 0,75, 2² + 2² jämfört med 2³
-- och liknande) var mycket lättare än provets KVA. De ersätts av
-- ovn-kva-041–047 i content/ovningsfragor/kva.json, som tar upp samma områden
-- på provets nivå: potenser, procent, geometri, avrundning, algebra, bråk och
-- vinklar. De nya frågorna har gått igenom andra kontrollen (ense) och
-- laddats upp som utkast med fragebank:upload.
--
-- Enligt projektets regel ersätts en fråga med ett nytt id i stället för att
-- skrivas över, så forumtrådar, repetitionskort och facitbilder som hör till de
-- gamla id:na fortsätter att gälla dem. Bytet sker i ett steg så att antalet
-- publicerade KVA-frågor aldrig minskar: de sju nya publiceras och de sju
-- gamla avvisas. Raderna finns kvar, och duellens facit för de gamla tas
-- aldrig bort (se 0017), så pågående dueller kan fortfarande rättas.
--
-- Skydd: de nya publiceras bara om alla sju finns med exakt det granskade
-- innehållet och andra kontrollens resultat 'agreed'. Saknas alla (till exempel
-- i en tom lokal databas där de aldrig laddats upp) görs ingenting. Saknas
-- bara några, eller har någon ändrats, stoppas migrationen i stället för att
-- byta halvvägs.

do $$
declare
  fix record;
  q public.questions%rowtype;
  missing integer := 0;
begin
  for fix in
    select *
      from (values
      ('ovn-kva-041',
       'Kvantitet I: 5^10 + 5^10
Kvantitet II: 10^10',
       1,
       'Kvantitet I är två likadana termer: 5^10 + 5^10 = 2 · 5^10. Kvantitet II kan skrivas 10^10 = (2 · 5)^10 = 2^10 · 5^10 = 1 024 · 5^10. II är alltså 512 gånger så stor som I, så II är större. Fällan är att lägga ihop baserna och få 10^10, så att kvantiteterna ser lika ut, eller att lägga ihop exponenterna och få 5^20, så att I ser större ut. Det finns inga okända, så informationen räcker.'),
      ('ovn-kva-042',
       'Priset på en vara höjdes med 25 %.
Kvantitet I: 25 %
Kvantitet II: den procentuella sänkning av det nya priset som krävs för att varan ska få tillbaka sitt ursprungliga pris',
       0,
       'Kalla det ursprungliga priset p. Efter höjningen är priset 1,25p. För att komma tillbaka till p ska det nya priset multipliceras med p/(1,25p) = 0,8, alltså sänkas med 20 %. Sänkningen räknas på det högre priset och blir därför mindre i procent än höjningen. Eftersom 25 % > 20 % är I större. Fällan är att tro att en sänkning med 25 % tar ut höjningen och svara att de är lika – men 0,75 · 1,25p = 0,9375p, som är lägre än det ursprungliga priset. Det okända priset spelar ingen roll, så informationen räcker.'),
      ('ovn-kva-043',
       'En kvadrat är inskriven i en cirkel med radien 5 cm, det vill säga kvadratens fyra hörn ligger på cirkeln.
Kvantitet I: kvadratens area
Kvantitet II: 50 cm²',
       2,
       'Kvadratens diagonal går genom cirkelns medelpunkt, så den är lika lång som cirkelns diameter, 10 cm. Om kvadratens sida är s ger Pythagoras sats s² + s² = 10², alltså 2s² = 100 och s² = 50. Kvadratens area är s² = 50 cm², så kvantiteterna är lika. Fällan är att tro att kvadratens sida är lika lång som radien (arean blir då 25 cm²) eller som diametern (arean blir då 100 cm²). Allt som behövs är givet, så informationen räcker.'),
      ('ovn-kva-044',
       'Talet a avrundat till närmaste heltal är 4, och talet b avrundat till närmaste heltal är 3.
Kvantitet I: a − b
Kvantitet II: 1',
       3,
       'Ett tal som avrundas till 4 ligger mellan 3,5 och 4,5, och ett tal som avrundas till 3 ligger mellan 2,5 och 3,5. Skillnaden a − b kan därför bli olika stor. Med a = 4 och b = 3 blir den 1, så kvantiteterna är lika. Med a = 4,4 och b = 2,6 blir den 1,8, så I är större. Med a = 3,6 och b = 3,4 blir den 0,2, så II är större. Eftersom alla tre fallen är möjliga gäller ingen av relationerna alltid, så informationen är otillräcklig. Fällan är att räkna med de avrundade talen, 4 − 3 = 1, och svara att de är lika.'),
      ('ovn-kva-045',
       '(x − 2)² = 9
Kvantitet I: x² − 4x
Kvantitet II: 5',
       2,
       'Utveckla kvadraten: (x − 2)² = x² − 4x + 4. Villkoret säger att detta är 9, så x² − 4x = 9 − 4 = 5, oavsett vilken lösning x har. Ekvationen har två lösningar, x = 5 och x = −1, och båda ger 5: 25 − 20 = 5 och 1 + 4 = 5. Kvantiteterna är alltså lika. Fällan är att se att x kan ha två olika värden och svara att informationen är otillräcklig utan att pröva vad uttrycket blir för dem.'),
      ('ovn-kva-046',
       'Kvantitet I: antalet positiva heltal som går jämnt upp i 80
Kvantitet II: antalet positiva heltal som går jämnt upp i 100',
       0,
       'Para ihop de tal som går jämnt upp i 80 två och två, så att produkten i varje par blir 80: 1 · 80, 2 · 40, 4 · 20, 5 · 16 och 8 · 10. Det är 10 olika tal. Gör likadant för 100: 1 · 100, 2 · 50, 4 · 25, 5 · 20 och 10 · 10. I det sista paret är båda talen 10, som bara räknas en gång, så för 100 finns det 9 sådana tal. Det räcker att pröva tal tills paren möts: 3, 6 och 7 går inte jämnt upp i 80, och 3, 6, 7, 8 och 9 går inte jämnt upp i 100. Eftersom 10 > 9 är I större. Fällan är att räkna två tal i varje par även för 10 · 10 och svara att de är lika, eller att tro att det större talet har fler tal som går jämnt upp i det och svara att II är större. Det finns inga okända, så informationen räcker.'),
      ('ovn-kva-047',
       'Klockan är halv fyra på en vanlig visarklocka.
Kvantitet I: den mindre av de två vinklarna mellan timvisaren och minutvisaren
Kvantitet II: 80°',
       1,
       'Minutvisaren pekar på 6, alltså 180° från 12. Timvisaren går 360°/12 = 30° på en timme, alltså 0,5° per minut. Klockan tre pekar den på 3, 90° från 12, och på 30 minuter flyttar den sig ytterligare 15°, till 105°. Vinkeln mellan visarna är därför 180° − 105° = 75°, och eftersom 75° < 80° är II större. Fällan är att tro att timvisaren fortfarande pekar exakt på 3, så att vinkeln blir 90°, och svara att I är större. Allt som behövs är givet, så informationen räcker.')
      ) as v(id, passage, correct_index, explain)
  loop
    select * into q from public.questions where id = fix.id for update;
    if not found then
      missing := missing + 1;
    elsif q.prompt is distinct from 'Jämför kvantitet I och kvantitet II.'
       or q.passage is distinct from fix.passage
       or q.options is distinct from '["I är större än II","II är större än I","I är lika med II","Informationen är otillräcklig"]'::jsonb
       or q.correct_index is distinct from fix.correct_index
       or q.explain is distinct from fix.explain
       or q.verification is distinct from 'agreed'
       or q.status not in ('draft', 'published') then
      raise exception
        'Frågan % skiljer sig från den granskade versionen (2026-10-26). Byt ut frågorna på /review i stället.',
        fix.id;
    end if;
  end loop;

  if missing = 7 then
    raise notice 'De nya KVA-frågorna finns inte i databasen; inget byte görs.';
    return;
  elsif missing > 0 then
    raise exception
      'Bara % av de % nya KVA-frågorna finns i databasen. Ladda upp alla med fragebank:upload först.',
      7 - missing, 7;
  end if;

  update public.questions
     set status = 'published'
   where id in ('ovn-kva-041', 'ovn-kva-042', 'ovn-kva-043', 'ovn-kva-044', 'ovn-kva-045', 'ovn-kva-046', 'ovn-kva-047')
     and status = 'draft';

  update public.questions
     set status = 'rejected'
   where id in ('kva-1', 'kva-2', 'kva-4', 'kva-5', 'kva-6', 'kva-7', 'kva-8')
     and status <> 'rejected';
end
$$;
