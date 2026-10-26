-- 0019: De äldre KVA-frågorna kva-1, kva-2 och kva-4–kva-8 får provets format.
--
-- De sju publicerade frågorna var skrivna på en rad ("Kvantitet I: 3/4.
-- Kvantitet II: 0,75. Vilken är störst?") med egna svarsalternativ ("De är
-- lika stora", "Går inte att avgöra"). De får samma format som kva-3 fick i
-- 0018 och som Övningsfrågorna har: den fasta frågetexten, informationen och
-- kvantiteterna på egna rader i passage och provets fyra alternativ.
-- Förklaringarna är omskrivna efter de nya alternativen. Uppgifterna och
-- facit är desamma; alternativen står i samma ordning, så correct_index och
-- duellens facit påverkas inte. kva-5 får enheter (cm och cm²), och kva-7
-- anger att talet avrundas till en decimal.
--
-- De nya formerna har gått igenom andra kontrollen och var ense, så
-- verification blir 'agreed' och anmärkningen tas bort.
--
-- Samma skydd som i 0018: varje rad skrivs bara om den fortfarande har exakt
-- det innehåll som skrevs om. Har någon ändrat frågan på /review sedan dess
-- stoppas migrationen i stället för att skriva över ändringen. Saknas frågan
-- görs ingenting, och en rad som redan har den nya formen lämnas orörd.

do $$
declare
  fix record;
  updated integer;
begin
  for fix in
    select *
      from (values
    ('kva-1',
     -- före
     'Kvantitet I: 3/4. Kvantitet II: 0,75. Vilken är störst?',
     null,
     '["I är större","II är större","De är lika stora","Går inte att avgöra"]'::jsonb,
     2,
     'Kvantitet I: 3/4 = 0,75. Kvantitet II: 0,75. De två uttrycken beskriver exakt samma tal, så kvantiteterna är lika stora. Alternativen där I eller II anges som större bygger på att man inte omvandlar bråket till decimalform, och att avgörandet skulle vara omöjligt stämmer inte eftersom talen kan jämföras exakt.',
     -- efter
     'Jämför kvantitet I och kvantitet II.',
     'Kvantitet I: 3/4
Kvantitet II: 0,75',
     '["I är större än II","II är större än I","I är lika med II","Informationen är otillräcklig"]'::jsonb,
     'Bråket 3/4 betyder 3 delat med 4, och 3/4 = 75/100 = 0,75. Kvantitet I och kvantitet II är alltså samma tal, skrivet på två olika sätt, så de är lika. Fällan är att tro att ett bråk och ett decimaltal inte kan vara exakt lika och svara att det ena är större. Det finns inga okända, så informationen räcker.'),
    ('kva-2',
     -- före
     'Kvantitet I: 2² + 2². Kvantitet II: 2³. Vilken är störst?',
     null,
     '["I är större","II är större","De är lika stora","Går inte att avgöra"]'::jsonb,
     2,
     'Kvantitet I: 2² + 2² = 4 + 4 = 8. Kvantitet II: 2³ = 8. Båda uttrycken ger samma värde, så kvantiteterna är lika stora. Att påstå att I eller II är större bygger på en felaktig uträkning av potenserna, och uppgiften går att avgöra exakt utan någon okänd variabel.',
     -- efter
     'Jämför kvantitet I och kvantitet II.',
     'Kvantitet I: 2² + 2²
Kvantitet II: 2³',
     '["I är större än II","II är större än I","I är lika med II","Informationen är otillräcklig"]'::jsonb,
     '2² + 2² = 4 + 4 = 8 och 2³ = 2 · 2 · 2 = 8, så kvantiteterna är lika. Det syns också utan uträkning: 2² + 2² = 2 · 2² = 2³. Fällan är att addera exponenterna och räkna med 2 upphöjt till 4, alltså 16, och svara att I är större – exponenter adderas bara när potenser med samma bas multipliceras. Det finns inga okända, så informationen räcker.'),
    ('kva-4',
     -- före
     'Kvantitet I: 15 % av 80. Kvantitet II: 20 % av 60. Vilken är störst?',
     null,
     '["I är större","II är större","De är lika stora","Går inte att avgöra"]'::jsonb,
     2,
     'Kvantitet I: 15 procent av 80 är 12. Kvantitet II: 20 procent av 60 är också 12. Kvantiteterna är alltså lika stora trots att procentsatserna och grundtalen skiljer sig åt. Att I eller II skulle vara större bygger på att man bara jämför procentsatserna eller grundtalen var för sig i stället för att räkna ut de faktiska värdena.',
     -- efter
     'Jämför kvantitet I och kvantitet II.',
     'Kvantitet I: 15 % av 80
Kvantitet II: 20 % av 60',
     '["I är större än II","II är större än I","I är lika med II","Informationen är otillräcklig"]'::jsonb,
     '15 % av 80 är 0,15 · 80 = 12 och 20 % av 60 är 0,20 · 60 = 12, så kvantiteterna är lika. Fällan är att bara jämföra procentsatserna (20 % är mer än 15 %) eller bara talen (80 är mer än 60) och svara att den ena kvantiteten är större. Den högre procentsatsen räknas på det mindre talet, så båda delarna måste vägas in. Det finns inga okända, så informationen räcker.'),
    ('kva-5',
     -- före
     'Kvantitet I: arean av en kvadrat med sidan 5. Kvantitet II: 24. Vilken är störst?',
     null,
     '["I är större","II är större","De är lika stora","Går inte att avgöra"]'::jsonb,
     0,
     'Kvantitet I: arean av en kvadrat med sidan 5 är 5² = 25. Kvantitet II är 24, vilket är mindre än 25, så kvantitet I är störst. Att II skulle vara större eller att de är lika bygger på en felaktig uträkning av kvadratens area, och relationen går att avgöra exakt eftersom inga okända variabler finns.',
     -- efter
     'Jämför kvantitet I och kvantitet II.',
     'En kvadrat har sidan 5 cm.
Kvantitet I: kvadratens area
Kvantitet II: 24 cm²',
     '["I är större än II","II är större än I","I är lika med II","Informationen är otillräcklig"]'::jsonb,
     'Kvadratens area är sidan gånger sidan: 5 · 5 = 25 cm². Eftersom 25 > 24 är I större. Fällan är att räkna 4 · 5 = 20, som är kvadratens omkrets i centimeter, och svara att II är större. Allt som behövs är givet, så informationen räcker, och kvantiteterna är inte lika.'),
    ('kva-6',
     -- före
     'Kvantitet I: (−3)². Kvantitet II: −9. Vilken är störst?',
     null,
     '["I är större","II är större","De är lika stora","Går inte att avgöra"]'::jsonb,
     0,
     'Kvantitet I: (−3)² = 9, eftersom en negativ faktor multiplicerad med sig själv ger ett positivt tal. Kvantitet II är −9, vilket är betydligt mindre än 9, så kvantitet I är störst. Den vanliga fällan är att tro att (−3)² blir −9 genom att bara kvadrera talet 3 och behålla minustecknet, vilket skulle ge fel svar.',
     -- efter
     'Jämför kvantitet I och kvantitet II.',
     'Kvantitet I: (−3)²
Kvantitet II: −9',
     '["I är större än II","II är större än I","I är lika med II","Informationen är otillräcklig"]'::jsonb,
     '(−3)² = (−3) · (−3) = 9, eftersom produkten av två negativa tal är positiv. Kvantitet I är alltså 9 och kvantitet II är −9, så I är större. Fällan är att blanda ihop (−3)² med −3², som betyder −(3²) = −9, och svara att de är lika. Det finns inga okända, så informationen räcker.'),
    ('kva-7',
     -- före
     'Ett tal avrundas till 7,4. Kvantitet I: det ursprungliga talet. Kvantitet II: 7,35. Vilken är störst?',
     null,
     '["I är större","II är större","De är lika stora","Går inte att avgöra"]'::jsonb,
     3,
     'Ett tal som avrundas till 7,4 kan ligga någonstans i intervallet 7,35 till precis under 7,45. Kvantitet II är exakt 7,35, vilket ligger i den nedre kanten av intervallet, så det ursprungliga talet kan vara lika med 7,35 eller större än 7,35 beroende på var i intervallet det faktiskt låg. Eftersom relationen mellan kvantiteterna varierar beroende på det exakta ursprungsvärdet går det inte att avgöra säkert vilken som är störst, eller om de är lika.',
     -- efter
     'Jämför kvantitet I och kvantitet II.',
     'Ett tal avrundas till en decimal och blir då 7,4.
Kvantitet I: talet före avrundningen
Kvantitet II: 7,35',
     '["I är större än II","II är större än I","I är lika med II","Informationen är otillräcklig"]'::jsonb,
     'Enligt den vanliga avrundningsregeln avrundas en femma uppåt. Ett tal som avrundas till 7,4 med en decimal är därför minst 7,35 och mindre än 7,45. Talet 7,35 avrundas nämligen till 7,4, medan 7,45 avrundas till 7,5. Talet kan alltså vara exakt 7,35, och då är kvantiteterna lika, men det kan också vara till exempel 7,4, och då är I större. Eftersom båda fallen är möjliga gäller ingen av relationerna alltid, så informationen är otillräcklig. (II kan aldrig vara större, eftersom talet är minst 7,35.) Fällan är att glömma att 7,35 själv avrundas till 7,4 och svara att I är större.'),
    ('kva-8',
     -- före
     'Kvantitet I: 1/2 + 1/3. Kvantitet II: 5/6. Vilken är störst?',
     null,
     '["I är större","II är större","De är lika stora","Går inte att avgöra"]'::jsonb,
     2,
     'Kvantitet I: 1/2 + 1/3 = 3/6 + 2/6 = 5/6. Kvantitet II är också 5/6, så kvantiteterna är lika stora. Att I eller II skulle vara större bygger på en felaktig hantering av gemensam nämnare vid additionen av bråken.',
     -- efter
     'Jämför kvantitet I och kvantitet II.',
     'Kvantitet I: 1/2 + 1/3
Kvantitet II: 5/6',
     '["I är större än II","II är större än I","I är lika med II","Informationen är otillräcklig"]'::jsonb,
     'Skriv bråken med gemensam nämnare: 1/2 = 3/6 och 1/3 = 2/6, så 1/2 + 1/3 = 3/6 + 2/6 = 5/6. Kvantiteterna är alltså lika. Fällan är att addera täljarna för sig och nämnarna för sig. Då får man felaktigt 2/5 i stället för 5/6 och svarar att II är större. Det finns inga okända, så informationen räcker.')
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
        'Frågan % har ändrats sedan omskrivningen (2026-10-26). Rätta den på /review i stället.',
        fix.id;
    end if;
  end loop;
end
$$;
