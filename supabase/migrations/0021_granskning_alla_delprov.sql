-- 0021: Rättelser efter granskningen av hela frågebanken (2026-10-26).
--
-- Alla övningsfrågor i DTK, ELF, LÄS, MEK, NOG, ORD och XYZ – de nya utkasten i
-- content/ovningsfragor/ och de äldre publicerade frågorna – löstes på nytt av
-- oberoende kontrollanter utan facit, som
-- sedan granskade facit och förklaringar. Varje föreslagen rättelse kontrollerades
-- innan den togs med, och frågor vars lydelse ändrades löstes blint en gång till i
-- sin nya form. (KVA granskades separat i 0018–0020.)
--
-- Här förs 127 frågor in i sin rättade form:
-- * förklaringar med sakfel, felräkningar, felaktiga citat eller otydliga meningar;
-- * tvetydiga frågor (främst äldre MEK-frågor med par som "varken/eller" och
--   "både/och" där meningen inte avgjorde vilket som gällde) och mek-54, där inget
--   alternativ passade och facit var fel;
-- * de äldre frågorna i ORD, NOG och XYZ får provets format: ORD fem alternativ utan
--   snedstreck, NOG provets fem alternativ med påståendena på egna rader, XYZ hela
--   frågor och rätt svar spritt över positionerna (förut alltid B);
-- * äldre LÄS-, ELF- och DTK-frågor där felsvaren var orimliga eller rätt svar
--   kunde väljas utan texten.
-- Rätt svar är detsamma överallt utom i mek-54, där facit var fel. Där rätt
-- alternativ har flyttat (nya alternativ eller ny ordning) följer duellens facit
-- med via triggern i 0017.
--
-- De nya formerna har gått igenom andra kontrollen, så verification blir 'agreed'
-- och anmärkningen tas bort – utom ovn-nog-026, där en människa ska ta ställning
-- till likheten med en provuppgift.
--
-- Varje rad skrivs bara om den fortfarande har exakt det innehåll som granskades
-- (passage jämförs med md5). Har frågan ändrats sedan dess – på /review, eller för
-- att en tom lokal databas har seed-versionerna i stället för de utjämnade
-- alternativordningarna i live – hoppas den över med en notis i stället för att
-- skrivas över. En rad som redan har den rättade formen lämnas orörd.

do $$
declare
  fix record;
  updated integer;
  done integer := 0;
  already integer := 0;
  skipped text[] := '{}';
begin
  for fix in
    select *
      from (values
    ('ovn-mek-001',
     -- före
     'Välj det alternativ som bäst fyller i meningen.', 'be3161fbabfe80f66f08a9224432176b', '["avsevärt","nämnvärt","marginellt","påtagligt"]'::jsonb, 2,
     'Marginellt betyder i liten, närmast obetydlig grad, vilket stämmer med bara och med att de flesta kunderna redan hade handlat under julhandeln. Avsevärt och påtagligt betyder att ökningen var stor eller tydligt märkbar och motsägs av förklaringen efter semikolon. Nämnvärt betyder värd att nämna, alltså betydande, och används nästan bara efter nekande ord som i ”inte nämnvärt”; efter bara ger det ingen mening.',
     -- efter (passage oförändrad)
     'Välj det alternativ som bäst fyller i meningen.', null, '["skenbart","nämnvärt","marginellt","påtagligt"]'::jsonb, 2,
     'Marginellt betyder i liten, närmast obetydlig grad, vilket stämmer med ”bara” och med att de flesta kunderna redan hade handlat under julhandeln. Påtagligt betyder att ökningen var tydligt märkbar och motsägs av förklaringen efter semikolon. Nämnvärt betyder så mycket att det är värt att nämna, alltså betydligt, och används nästan bara efter nekande ord som i ”inte nämnvärt”; efter ”bara” ger det ingen mening. Skenbart skulle betyda att ökningen inte var verklig utan bara såg ut att vara det, men inget i texten tyder på det; att kunderna redan hade handlat förklarar i stället varför ökningen blev så liten.',
     'agreed', null),
    ('ovn-mek-003',
     -- före
     'Välj det alternativ som bäst fyller i meningen.', 'c06897f3161d511c9b4dfaf43e3d0aa0', '["förestod","förebrådde","föreskrev","förebådade"]'::jsonb, 3,
     'Förebådade betyder varslade om något som skulle komma, och prisraset och bankkonkurserna beskrivs just som tidiga varningstecken på krisen. Förestod betyder ledde eller förvaltade, som när någon förestår en verksamhet, och ger ingen mening med tecken som subjekt. Förebrådde betyder klandrade och föreskrev betyder beordrade eller bestämde; inget av det kan tecken göra, och orden liknar förebådade bara till formen.',
     -- efter (passage oförändrad)
     'Välj det alternativ som bäst fyller i meningen.', null, '["förestod","förebrådde","föreskrev","förebådade"]'::jsonb, 3,
     'Förebådade betyder varslade om något som skulle komma, och prisraset och bankkonkurserna beskrivs just som tidiga varningstecken på krisen. Förestod betyder ledde eller förvaltade, som när någon förestår en verksamhet, och ger ingen mening med tecken som subjekt. Förestå kan också betyda att något snart ska inträffa, som i ”en förändring förestår”, men då tar verbet inget objekt, och det betyder inte heller föregick. Förebrådde betyder klandrade och föreskrev betyder beordrade eller bestämde; inget av det kan tecken göra, och orden liknar förebådade bara till formen.',
     'agreed', null),
    ('ovn-mek-018',
     -- före
     'Välj det alternativ som bäst fyller i meningen.', '4b630ea74e30cbf27bec3ff1b29e863f', '["i synnerhet","däremot","åtminstone","dessutom"]'::jsonb, 0,
     'I synnerhet lyfter fram en del av det som just sagts som särskilt berörd, och de södra delarna, där det knappt regnade alls, pekas ut som extra hårt drabbade. Däremot skulle ställa de södra delarna i motsats till resten av landet, vilket motsägs av att det var torrast just där. Åtminstone skulle antyda att man bara vet säkert om de södra delarna, vilket strider mot i hela landet, och dessutom lägger till något som redan ingår, eftersom de södra delarna är en del av hela landet.',
     -- efter (passage oförändrad)
     'Välj det alternativ som bäst fyller i meningen.', null, '["i synnerhet","däremot","åtminstone","dessutom"]'::jsonb, 0,
     'I synnerhet lyfter fram en del av det som just sagts som särskilt berörd, och de södra delarna, där det knappt regnade alls, pekas ut som extra hårt drabbade. Däremot skulle ställa de södra delarna i motsats till resten av landet, vilket motsägs av att det var torrast just där. Åtminstone skulle antyda att man bara vet säkert om de södra delarna, vilket strider mot i hela landet. Ordet dessutom passar inte heller, eftersom det lägger till något nytt, medan de södra delarna redan ingår i hela landet.',
     'agreed', null),
    ('ovn-mek-019',
     -- före
     'Välj det alternativ som bäst fyller i luckorna.', '94016d112decede6190216e0ec383061', '["ovedersägligen / snarare","inte med nödvändighet / snarare","ovedersägligen / därmed","inte med nödvändighet / därmed"]'::jsonb, 1,
     'Det andra ledet ger en annan förklaring till att biobesöken minskar, så det första ledet måste avvisa att minskningen säkert beror på svalnat intresse, vilket inte med nödvändighet gör. Ovedersägligen betyder obestridligen och skulle tvärtom slå fast just den förklaring som texten sedan ersätter. Snarare inleder ett alternativ som framstår som mer sannolikt än det som just avvisats. Därmed anger en följd av det föregående, men att allt fler ser film hemma följer inte av det första ledet.',
     -- efter (passage oförändrad)
     'Välj det alternativ som bäst fyller i luckorna.', null, '["ovedersägligen / snarare","inte med nödvändighet / snarare","ovedersägligen / därmed","inte med nödvändighet / därmed"]'::jsonb, 1,
     'Det andra ledet ger en annan förklaring till att biobesöken minskar, så det första ledet måste avvisa att minskningen säkert beror på svalnat intresse, och det är just vad uttrycket ”inte med nödvändighet” gör. Ovedersägligen betyder obestridligen och skulle tvärtom slå fast just den förklaring som texten sedan ersätter. Snarare inleder ett alternativ som framstår som mer sannolikt än det som just avvisats. Därmed anger en följd av det föregående, men att allt fler ser film hemma följer inte av det första ledet.',
     'agreed', null),
    ('ovn-nog-007',
     -- före
     'Tillräcklig information för lösningen erhålls', '7c20a981cac9ae67f58304b6cfd24027', '["i (1) men ej i (2)","i (2) men ej i (1)","i (1) tillsammans med (2)","i (1) och (2) var för sig","ej genom de båda påståendena"]'::jsonb, 0,
     'Medelhastigheten är hela sträckan delad med hela tiden. Kalla avståndet mellan A och B för s km.
(1) Resan är 2s km lång och tar s/12 + s/18 = 5s/36 timmar. Medelhastigheten blir 2s/(5s/36) = 72/5 = 14,4 km/h. Avståndet s tar ut sig, så svaret blir detsamma vilket avståndet än är. (1) räcker.
(2) ger bara sträckan. Utan uppgifter om tid eller hastighet går medelhastigheten inte att bestämma. (2) räcker inte.
Tillräcklig information erhålls alltså i (1) men ej i (2).',
     -- efter (passage oförändrad)
     'Tillräcklig information för lösningen erhålls', null, '["i (1) men ej i (2)","i (2) men ej i (1)","i (1) tillsammans med (2)","i (1) och (2) var för sig","ej genom de båda påståendena"]'::jsonb, 0,
     'Medelhastigheten är hela sträckan delad med hela tiden. Kalla avståndet mellan A och B för s km.
(1) Resan är 2s km lång och tar s/12 + s/18 = 5s/36 timmar. Medelhastigheten blir 2s/(5s/36) = 72/5 = 14,4 km/h. Avståndet s förkortas bort, så svaret blir detsamma vilket avståndet än är. (1) räcker.
(2) ger bara sträckan. Utan uppgifter om tid eller hastighet går medelhastigheten inte att bestämma. (2) räcker inte.
Tillräcklig information erhålls alltså i (1) men ej i (2).',
     'agreed', null),
    ('ovn-nog-010',
     -- före
     'Tillräcklig information för lösningen erhålls', '8afedf47a72076463f8d02585a22f306', '["i (1) men ej i (2)","i (2) men ej i (1)","i (1) tillsammans med (2)","i (1) och (2) var för sig","ej genom de båda påståendena"]'::jsonb, 4,
     'Låt det stå x böcker på det översta, y på det mittersta och z på det nedersta hyllplanet.
(1) ger x + y + z = 45, en ekvation med tre obekanta. (1) räcker inte.
(2) ger y = z + 6 men säger inget om hur många böcker det är. (2) räcker inte.
Tillsammans: x + (z + 6) + z = 45, alltså x + 2z = 39. Det uppfylls till exempel både av z = 10, x = 19 och av z = 15, x = 9. Antalet böcker på det översta hyllplanet är okänt, så tillräcklig information erhålls ej genom de båda påståendena.',
     -- efter (passage oförändrad)
     'Tillräcklig information för lösningen erhålls', null, '["i (1) men ej i (2)","i (2) men ej i (1)","i (1) tillsammans med (2)","i (1) och (2) var för sig","ej genom de båda påståendena"]'::jsonb, 4,
     'Låt det stå x böcker på det översta, y på det mittersta och z på det nedersta hyllplanet.
(1) ger x + y + z = 45, en ekvation med tre obekanta. (1) räcker inte.
(2) ger y = z + 6 men säger inget om hur många böcker det är. (2) räcker inte.
Tillsammans: x + (z + 6) + z = 45, alltså x + 2z = 39. Det uppfylls till exempel både av z = 10, x = 19 och av z = 15, x = 9. Det nedersta hyllplanet kan alltså ha både 10 och 15 böcker, så tillräcklig information erhålls ej genom de båda påståendena.',
     'agreed', null),
    ('ovn-nog-020',
     -- före
     'Tillräcklig information för lösningen erhålls', '61e95d049ab7e4d01e6cb33acb07a499', '["i (1) men ej i (2)","i (2) men ej i (1)","i (1) tillsammans med (2)","i (1) och (2) var för sig","ej genom de båda påståendena"]'::jsonb, 3,
     'Låt Ola ha köpt x vykort för 5 kronor och y vykort för 8 kronor. Då är 5x + 8y = 53, där x och y är heltal som inte är negativa. För att 53 − 8y ska vara delbart med 5 måste y vara 1 eller 6 (y = 11 skulle kosta mer än 53 kronor). Det finns alltså två möjligheter: x = 9 och y = 1, eller x = 1 och y = 6.
(1) Bara fallet x = 9, y = 1 har fler vykort för 5 kronor, så y = 1. (1) räcker.
(2) Bara fallet x = 9, y = 1 ger 10 vykort (det andra fallet ger 7), så y = 1. (2) räcker.
Tillräcklig information erhålls i (1) och (2) var för sig.',
     -- efter (passage oförändrad)
     'Tillräcklig information för lösningen erhålls', null, '["i (1) men ej i (2)","i (2) men ej i (1)","i (1) tillsammans med (2)","i (1) och (2) var för sig","ej genom de båda påståendena"]'::jsonb, 3,
     'Låt Ola ha köpt x vykort för 5 kronor och y vykort för 8 kronor. Då är 5x + 8y = 53, där x och y är heltal som inte är negativa. Eftersom 8 · 7 = 56 är mer än 53 är y högst 6. Av talen 53 − 8y för y = 0, 1, 2, 3, 4, 5 och 6, alltså 53, 45, 37, 29, 21, 13 och 5, är bara 45 och 5 delbara med 5. Det finns alltså två möjligheter: x = 9 och y = 1, eller x = 1 och y = 6.
(1) Bara fallet x = 9, y = 1 har fler vykort för 5 kronor, så y = 1. (1) räcker.
(2) Bara fallet x = 9, y = 1 ger 10 vykort (det andra fallet ger 7), så y = 1. (2) räcker.
Tillräcklig information erhålls i (1) och (2) var för sig.',
     'agreed', null),
    ('ovn-dtk-032',
     -- före
     'Vilken av följande slutsatser kan man dra utifrån tabellen?', 'a309819d2f071c52214768875177fad8', '["Slottet förlorade fler besökare än friluftsmuseet från 2023 till 2024.","Friluftsmuseet hade färre besökare än äventyrsbadet år 2023.","Alla besöksmål som fick fler besökare 2024 än 2023 behöll eller förbättrade sin placering.","Djurparken hade fler besökare än konstmuseet år 2023."]'::jsonb, 3,
     'Placeringen 2023 visar ordningen mellan besöksmålen det året. Djurparken låg på plats 4 och konstmuseet på plats 5, så djurparken hade fler besökare år 2023 (360 / 0,80 = 450 tusen mot 420 / 1,05 = 400 tusen), och den slutsatsen stämmer. Friluftsmuseet låg på plats 7 och äventyrsbadet på plats 8 år 2023, så friluftsmuseet hade fler besökare, inte färre (280 tusen mot 250 tusen). Slottet förlorade 600 − 540 = 60 tusen besökare och friluftsmuseet 280 − 210 = 70 tusen, så det var friluftsmuseet som förlorade flest. Botaniska trädgården fick 10 procent fler besökare men föll ändå från plats 6 till plats 7, eftersom äventyrsbadet gick förbi.',
     -- efter (passage oförändrad)
     'Vilken av följande slutsatser kan man dra utifrån tabellen?', null, '["Slottet förlorade fler besökare än friluftsmuseet från 2023 till 2024.","Friluftsmuseet hade färre besökare än äventyrsbadet år 2023.","Alla besöksmål som fick fler besökare 2024 än 2023 behöll eller förbättrade sin placering.","Djurparken hade fler besökare än konstmuseet år 2023."]'::jsonb, 3,
     'Placeringen 2023 visar ordningen mellan besöksmålen det året. Djurparken låg på plats 4 och konstmuseet på plats 5, så djurparken hade fler besökare år 2023 (360 / 0,80 = 450 tusen mot 420 / 1,05 = 400 tusen), och den slutsatsen stämmer. Friluftsmuseet låg på plats 7 och äventyrsbadet på plats 8 år 2023, så friluftsmuseet hade fler besökare, inte färre (210 / 0,75 = 280 tusen mot 350 / 1,40 = 250 tusen). Slottet hade 540 / 0,90 = 600 tusen besökare år 2023 och förlorade alltså 600 − 540 = 60 tusen, medan friluftsmuseet förlorade 280 − 210 = 70 tusen, så det var friluftsmuseet som förlorade flest. Botaniska trädgården fick 10 procent fler besökare men föll ändå från plats 6 till plats 7, eftersom äventyrsbadet gick förbi.',
     'agreed', null),
    ('ovn-elf-014',
     -- före
     'What is the author''s main purpose in the text?', '50415a68fa5ce644f424af4708273748', '["To argue that restaurants ought to go back to accepting reservations from their customers","To show that customers generally end up worse off when restaurants refuse to take bookings","To explain why restaurants that refuse bookings so often have queues outside","To show that a policy presented as fair was really designed to suit the restaurant"]'::jsonb, 3,
     'The author contrasts the ''democratic'' way such restaurants present the policy with economics that are ''less high-minded'': refusing bookings moves the risk of no-shows onto waiting diners and supplies free advertising, and the text ends by urging us to be clear about ''whom the arrangement was designed to serve''. The queue is part of this argument, as evidence of what the restaurant gains, but explaining it is not the purpose of the text. No recommendation is made that restaurants go back to taking bookings. And the claim that customers generally lose out is contradicted by ''Customers are not necessarily the losers''.',
     -- efter (passage oförändrad)
     'What is the author''s main purpose in the text?', null, '["To argue that restaurants ought to go back to accepting reservations from their customers","To show that customers generally end up worse off when restaurants refuse to take bookings","To explain why restaurants that refuse bookings so often have queues outside","To show that a policy presented as fair was really designed to suit the restaurant"]'::jsonb, 3,
     'The author contrasts the way such restaurants present the policy, as ''a kind of democracy'', with economics that are ''less high-minded'': refusing bookings moves the risk of no-shows onto waiting diners and supplies free advertising, and the text ends by urging us to be clear about ''whom the arrangement was designed to serve''. The queue is part of this argument, as evidence of what the restaurant gains, but explaining it is not the purpose of the text. No recommendation is made that restaurants go back to taking bookings. And the claim that customers generally lose out is contradicted by ''Customers are not necessarily the losers''.',
     'agreed', null),
    ('ovn-dtk-002',
     -- före
     'Ungefär hur många av invånarna 20–64 år i Region B var inte sysselsatta år 2024?', '91c3182ada6c2471cc208f72dc655706', '["ca 60 000","ca 70 000","ca 80 000","ca 190 000"]'::jsonb, 0,
     'År 2024 var 76,0 procent av invånarna 20–64 år i Region B sysselsatta, så 100 − 76,0 = 24,0 procent var inte sysselsatta. Regionen hade 251 tusen invånare i åldern, och 0,24 · 251 000 ≈ 60 200, vilket ligger närmast ca 60 000. Ca 190 000 är i stället antalet sysselsatta (0,76 · 251 000 ≈ 190 800). Ca 70 000 får man med 2014 års uppgifter (0,26 · 268 000 ≈ 69 700), och ca 80 000 om man blandar åren och drar 2024 års sysselsatta från 2014 års befolkning (268 000 − 190 800 ≈ 77 200).',
     -- efter (passage oförändrad)
     'Ungefär hur många av invånarna 20–64 år i Region B var inte sysselsatta år 2024?', null, '["ca 60 000","ca 70 000","ca 80 000","ca 190 000"]'::jsonb, 0,
     'År 2024 var 76,0 procent av invånarna 20–64 år i Region B sysselsatta, så 100 − 76,0 = 24,0 procent var inte sysselsatta. Regionen hade 251 tusen invånare i den åldern, och 0,24 · 251 000 ≈ 60 200, vilket ligger närmast ca 60 000. Ca 190 000 är i stället antalet sysselsatta (0,76 · 251 000 ≈ 190 800). Ca 70 000 får man med 2014 års uppgifter (0,26 · 268 000 ≈ 69 700), och ca 80 000 om man blandar åren och drar 2024 års sysselsatta från 2014 års befolkning (268 000 − 190 800 ≈ 77 200).',
     'agreed', null),
    ('ovn-dtk-008',
     -- före
     'Hur stor andel av företagets totala försäljning år 2024 kom från belysning?', '775158d39b673b76a94a9583e4391b27', '["18 procent","21 procent","25 procent","27 procent"]'::jsonb, 1,
     'Företagets totala försäljning 2024 är 50,4 + 25,2 + 22,8 + 21,6 = 120,0 miljoner kronor. Belysningen stod för 25,2 miljoner kronor, och 25,2 / 120,0 = 0,21, alltså 21 procent. 25 procent får man om man läser försäljningen 25,2 miljoner kronor som en andel, vilket bara stämmer om totalen är 100. 27 procent får man om man jämför belysningen med de övriga produktområdena (25,2 / 94,8 ≈ 0,27) i stället för med hela försäljningen. 18 procent är inredningsdetaljernas andel 2024 (21,6 / 120,0) och ungefär belysningens andel 2022 (18,4 / 104,0 ≈ 0,18), alltså fel rad eller fel år.',
     -- efter (passage oförändrad)
     'Hur stor andel av de fyra produktområdenas sammanlagda försäljning år 2024 kom från belysning?', null, '["18 procent","21 procent","25 procent","27 procent"]'::jsonb, 1,
     'De fyra produktområdenas sammanlagda försäljning 2024 är 50,4 + 25,2 + 22,8 + 21,6 = 120,0 miljoner kronor. Belysningen stod för 25,2 miljoner kronor, och 25,2 / 120,0 = 0,21, alltså 21 procent. 25 procent får man om man läser försäljningen 25,2 miljoner kronor som en andel, vilket bara stämmer om totalen är 100. 27 procent får man om man jämför belysningen med de övriga produktområdena (25,2 / 94,8 ≈ 0,27) i stället för med hela försäljningen. 18 procent är inredningsdetaljernas andel 2024 (21,6 / 120,0) och ungefär belysningens andel 2022 (18,4 / 104,0 ≈ 0,18), alltså fel rad eller fel år.',
     'agreed', null),
    ('ovn-dtk-009',
     -- före
     'Ungefär hur stor andel av företagets totala försäljning år 2024 gick på export?', '775158d39b673b76a94a9583e4391b27', '["ca 24 procent","ca 32 procent","ca 38 procent","ca 46 procent"]'::jsonb, 1,
     'Exporten för varje produktområde är försäljningen 2024 gånger exportandelen: möbler 50,4 · 0,10 ≈ 5,0, belysning 25,2 · 0,65 ≈ 16,4, textil 22,8 · 0,15 ≈ 3,4 och inredningsdetaljer 21,6 · 0,60 ≈ 13,0 miljoner kronor. Sammanlagt exporterades 37,8 av 120,0 miljoner kronor, och 37,8 / 120,0 ≈ 0,315, alltså ca 32 procent. Ca 38 procent är medelvärdet av de fyra andelarna, (10 + 65 + 15 + 60) / 4 = 37,5, men det tar inte hänsyn till att möbler, som har lägst exportandel, står för den största försäljningen. Ca 46 procent får man om exporten jämförs med den övriga försäljningen (37,8 / 82,2 ≈ 0,46) i stället för med hela försäljningen, och ca 24 procent om man bara räknar med exporten av belysning och inredningsdetaljer ((16,38 + 12,96) / 120,0 ≈ 0,24).',
     -- efter (passage oförändrad)
     'Ungefär hur stor andel av de fyra produktområdenas sammanlagda försäljning år 2024 gick på export?', null, '["ca 24 procent","ca 32 procent","ca 38 procent","ca 46 procent"]'::jsonb, 1,
     'Exporten för varje produktområde är försäljningen 2024 gånger exportandelen: möbler 50,4 · 0,10 = 5,04, belysning 25,2 · 0,65 = 16,38, textil 22,8 · 0,15 = 3,42 och inredningsdetaljer 21,6 · 0,60 = 12,96 miljoner kronor. Sammanlagt exporterades 37,8 av 120,0 miljoner kronor, och 37,8 / 120,0 = 0,315, alltså ca 32 procent. Ca 38 procent är medelvärdet av de fyra andelarna, (10 + 65 + 15 + 60) / 4 = 37,5, men det tar inte hänsyn till att möbler, som har lägst exportandel, står för den största försäljningen. Ca 46 procent får man om exporten jämförs med den övriga försäljningen (37,8 / 82,2 ≈ 0,46) i stället för med hela försäljningen, och ca 24 procent om man bara räknar med exporten av belysning och inredningsdetaljer ((16,38 + 12,96) / 120,0 ≈ 0,24).',
     'agreed', null),
    ('ovn-dtk-017',
     -- före
     'Ungefär hur många fler arbetsresor gjordes med kollektivtrafik en genomsnittlig vardag år 2024 än år 2014?', '4aa58c446dc873e9123c47579829c417', '["ca 1 500","ca 2 200","ca 3 700","ca 13 800"]'::jsonb, 2,
     'Antalet kollektivtrafikresor är andelen gånger det totala antalet arbetsresor: 0,24 · 42 000 = 10 080 år 2014 och 0,27 · 51 000 = 13 770 år 2024. Ökningen är 13 770 − 10 080 = 3 690, alltså ca 3 700. Ca 13 800 är antalet resor 2024, inte ökningen. Ca 1 500 får man om man bara räknar med att andelen ökade med 3 procentenheter (0,03 · 51 000 = 1 530) och glömmer att antalet resor också ökade. Ca 2 200 får man om man tvärtom bara räknar med att antalet resor ökade och använder 2014 års andel båda åren (0,24 · 51 000 − 10 080 = 2 160).',
     -- efter (passage oförändrad)
     'Ungefär hur många fler arbetsresor gjordes med kollektivtrafik en genomsnittlig vardag år 2024 än år 2014?', null, '["ca 1 500","ca 2 200","ca 3 700","ca 13 800"]'::jsonb, 2,
     'Antalet kollektivtrafikresor är andelen gånger det totala antalet arbetsresor: 0,24 · 42 000 = 10 080 år 2014 och 0,27 · 51 000 = 13 770 år 2024. Ökningen är 13 770 − 10 080 = 3 690, alltså ca 3 700. Ca 13 800 är antalet kollektivtrafikresor 2024, inte ökningen. Ca 1 500 får man om man bara räknar med att andelen ökade med 3 procentenheter (0,03 · 51 000 = 1 530) och glömmer att antalet resor också ökade. Ca 2 200 får man om man tvärtom bara räknar med att antalet resor ökade och använder 2014 års andel båda åren (0,24 · 51 000 − 10 080 = 2 160).',
     'agreed', null),
    ('dtk-2',
     -- före
     'Hur många procentenheter ökade Kommun A mellan 2022 och 2024?', '5aa9db765542cdbe712d6740ee34e1e8', '["2","3","4","15"]'::jsonb, 1,
     'Kommun A gick från 12 procent 2022 till 15 procent 2024, en ökning med 3 procentenheter. Alternativen 2 och 4 motsvarar inte differensen mellan dessa två värden, och 15 procentenheter vore orimligt stort eftersom det är själva slutvärdet, inte förändringen.',
     -- efter (passage oförändrad)
     'Med hur många procentenheter ökade andelen cykelresor i Kommun A mellan 2022 och 2024?', null, '["2 procentenheter","3 procentenheter","4 procentenheter","15 procentenheter"]'::jsonb, 1,
     'Andelen cykelresor i Kommun A var 12 procent 2022 och 15 procent 2024. Skillnaden mellan två andelar mäts i procentenheter, så ökningen är 15 − 12 = 3 procentenheter. 2 procentenheter är ökningen bara mellan 2022 och 2023 (från 12 till 14 procent), och 4 procentenheter är ökningen i Kommun C (från 9 till 13 procent). 15 procentenheter får man om man tar andelen 2024 som ökningen.',
     'agreed', null),
    ('dtk-3',
     -- före
     'Vilken kommun minskade något mellan 2022 och 2023?', '5aa9db765542cdbe712d6740ee34e1e8', '["A","B","C","D"]'::jsonb, 1,
     'B är den enda kommun som minskade mellan 2022 och 2023, från 18 till 17 procent. A, C och D antingen ökade eller låg still under samma period och kan därför uteslutas.',
     -- efter (passage oförändrad)
     'I vilken kommun minskade andelen cykelresor mellan 2022 och 2023?', null, '["Kommun A","Kommun B","Kommun C","Kommun D"]'::jsonb, 1,
     'Andelen cykelresor i Kommun B minskade från 18 procent 2022 till 17 procent 2023, alltså med 1 procentenhet. I Kommun A (från 12 till 14 procent) och Kommun C (från 9 till 11 procent) ökade andelen, och i Kommun D var den oförändrad, 16 procent båda åren.',
     'agreed', null),
    ('dtk-4',
     -- före
     'Ungefär hur stor andel av total försäljning stod Produkt Y för?', '0d45c175622d22830c633edd4218ec97', '["15 %","25 %","35 %","40 %"]'::jsonb, 1,
     'Produkt Y svarade för 25 av totalt 100 (motsvarande enheter), det vill säga 25 procent av den totala försäljningen. 15 procent är för lågt och 35/40 procent överskattar Y:s andel, vilka snarare stämmer med andra produkters värden i diagrammet.',
     -- efter (passage oförändrad)
     'Hur stor andel av den totala försäljningen stod produkt Y för?', null, '["15 procent","25 procent","35 procent","40 procent"]'::jsonb, 1,
     'Produkt Y sålde för 25 av totalt 100 miljoner kronor, och 25 / 100 = 0,25, alltså 25 procent av den totala försäljningen. 35 procent och 40 procent är andelarna för Z och X, som sålde för 35 respektive 40 miljoner kronor. 15 procent motsvarar skillnaden mellan X och Y, 40 − 25 = 15 miljoner kronor, och är inte Y:s andel.',
     'agreed', null),
    ('dtk-5',
     -- före
     'Vilken produkt hade störst försäljning?', '0d45c175622d22830c633edd4218ec97', '["X","Y","Z","Y och Z lika"]'::jsonb, 0,
     'X hade störst försäljning med värdet 40, vilket är högre än både Y (25) och Z (35). Y och Z ligger båda under X och är dessutom inte lika stora som varandra, så det sista alternativet stämmer inte heller.',
     -- efter (passage oförändrad)
     'Vilken produkt hade störst försäljning?', null, '["X","Y","Z","X och Z lika mycket"]'::jsonb, 0,
     'X hade störst försäljning, 40 miljoner kronor, mot 35 miljoner kronor för Z och 25 miljoner kronor för Y. X och Z sålde alltså inte lika mycket, eftersom X sålde 5 miljoner kronor mer än Z.',
     'agreed', null),
    ('dtk-6',
     -- före
     'Med hur många miljoner skiljer sig X och Z?', '0d45c175622d22830c633edd4218ec97', '["5","10","15","25"]'::jsonb, 0,
     'X ligger på 40 miljoner och Z på 35 miljoner, en skillnad på 5 miljoner. 10 och 15 miljoner är för stora skillnader utifrån dessa värden, och 25 miljoner motsvarar snarare skillnaden mellan X och en annan produkt.',
     -- efter (passage oförändrad)
     'Med hur många miljoner kronor skiljer sig försäljningen av X och Z åt?', null, '["5 miljoner kronor","10 miljoner kronor","15 miljoner kronor","25 miljoner kronor"]'::jsonb, 0,
     'X sålde för 40 miljoner kronor och Z för 35 miljoner kronor, så försäljningen skiljer sig åt med 40 − 35 = 5 miljoner kronor. 15 miljoner kronor är skillnaden mellan X och Y (40 − 25), 10 miljoner kronor är skillnaden mellan Z och Y (35 − 25), och 25 miljoner kronor är Y:s egen försäljning.',
     'agreed', null),
    ('dtk-7',
     -- före
     'Vilken avdelning hade lägst sjukfrånvaro i mars?', '898f5c222d44565fec99c370fff78515', '["A","B","C","D"]'::jsonb, 3,
     'I mars hade D lägst sjukfrånvaro med 4,9 procent, vilket är lägre än B:s 5,1, A:s 5,4 och C:s 6,8. B (5,1) är näst lägst men ändå högre än D, och C sticker tvärtom ut som avdelningen med högst frånvaro.',
     -- efter (passage oförändrad)
     'Vilken avdelning hade lägst sjukfrånvaro i mars?', null, '["Avd. A","Avd. B","Avd. C","Avd. D"]'::jsonb, 3,
     'I mars var sjukfrånvaron 5,4 procent på Avd. A, 5,1 procent på Avd. B, 6,8 procent på Avd. C och 4,9 procent på Avd. D, så Avd. D hade lägst. Avd. B hade lägst sjukfrånvaro i februari och april, men inte i mars.',
     'agreed', null),
    ('dtk-8',
     -- före
     'Hur stor andel av företagets totala kostnader utgjorde material 2023?', '719b3d9c0f1182ba8235b6ac0b74d476', '["8 %","ungefär 40 %","ungefär 27 %","ungefär 73 %"]'::jsonb, 2,
     'Materialkostnaden var 8 av totalt 30 (motsvarande enheter), vilket ger 8/30 ≈ 0,27, det vill säga ungefär 27 procent. 8 procent förväxlar delvärdet med andelen, medan 40 och 73 procent bygger på fel jämförelsetal och blir alldeles för höga.',
     -- efter (passage oförändrad)
     'Ungefär hur stor andel av de totala kostnaderna 2023 gick till material?', null, '["8 procent","27 procent","40 procent","73 procent"]'::jsonb, 1,
     'Kostnaderna för material var 8 av totalt 30 miljoner kronor, och 8 / 30 ≈ 0,27, alltså ungefär 27 procent. 8 procent får man om man tar beloppet 8 miljoner kronor som andelen. 40 procent är andelen för personal (12 / 30), och 73 procent är andelen för alla kostnader utom material (22 / 30).',
     'agreed', null),
    ('ovn-dtk-003',
     -- före
     'I vilken eller vilka av regionerna var antalet sysselsatta invånare 20–64 år lägre år 2024 än år 2014?', '91c3182ada6c2471cc208f72dc655706', '["Endast Region C","Endast Region B","Region B och Region D","Region B, Region C och Region D"]'::jsonb, 1,
     'Antalet sysselsatta är antalet invånare gånger andelen sysselsatta. Region A och Region E ökade både i befolkning och i andel och kan uteslutas direkt. Region B: 268 · 0,740 ≈ 198,3 tusen år 2014 och 251 · 0,760 ≈ 190,8 tusen år 2024, alltså en minskning. Region C: 535 · 0,812 ≈ 434,4 tusen och 610 · 0,796 ≈ 485,6 tusen, en ökning trots att andelen sjönk, eftersom befolkningen växte kraftigt. Region D: 190 · 0,703 ≈ 133,6 tusen och 176 · 0,784 ≈ 138,0 tusen, en ökning trots att befolkningen minskade, eftersom andelen steg med 8,1 procentenheter. Bara Region B hade alltså färre sysselsatta. Svaret Endast Region C får man om man bara ser att andelen sjönk där, svaret Region B och Region D om man bara ser vilka befolkningar som minskade, och svaret med alla tre om man räknar en region som lägre så fort någon av de två siffrorna minskat, utan att räkna ut antalet sysselsatta.',
     -- efter (passage oförändrad)
     'I vilken eller vilka av regionerna var antalet sysselsatta invånare 20–64 år lägre år 2024 än år 2014?', null, '["Endast Region C","Endast Region B","Region B och Region D","Region B, Region C och Region D"]'::jsonb, 1,
     'Antalet sysselsatta är antalet invånare gånger andelen sysselsatta. Region A och Region E ökade både i befolkning och i andel och kan uteslutas direkt. Region B: 268 · 0,740 ≈ 198,3 tusen år 2014 och 251 · 0,760 ≈ 190,8 tusen år 2024, alltså en minskning. Region C: 535 · 0,812 ≈ 434,4 tusen och 610 · 0,796 ≈ 485,6 tusen, en ökning trots att andelen sjönk, eftersom befolkningen växte kraftigt. Region D: 190 · 0,703 ≈ 133,6 tusen och 176 · 0,784 ≈ 138,0 tusen, en ökning trots att befolkningen minskade, eftersom andelen steg med 8,1 procentenheter. Bara Region B hade alltså färre sysselsatta. Svaret Endast Region C får man om man bara ser att andelen sjönk där, svaret Region B och Region D om man bara ser vilka befolkningar som minskade, och svaret med alla tre om man räknar en region som lägre så fort någon av de två siffrorna minskat, utan att räkna ut antalet sysselsatta.',
     'agreed', null),
    ('ovn-dtk-005',
     -- före
     'Vilken av följande slutsatser kan man dra utifrån tabellen?', '0f51af879fe0dced4f3d05c04f5571d2', '["Kläder var billigare än livsmedel år 2024.","Energipriserna steg med 58 procent mellan 2020 och 2022.","Energipriserna steg mer än livsmedelspriserna mellan 2018 och 2024.","Energipriserna sjönk med mindre än 20 procent mellan 2022 och 2024."]'::jsonb, 3,
     'Energiindexet sjönk från 150 till 126, alltså med 24 indexenheter. Räknat från 2022 års nivå är det 24 / 150 = 0,16, en minskning med 16 procent, vilket är mindre än 20 procent. Den slutsatsen stämmer alltså. Att energipriserna steg med 58 procent mellan 2020 och 2022 är fel: 58 indexenheter från nivån 92 är 58 / 92 ≈ 0,63, alltså ungefär 63 procent. Mellan 2018 och 2024 steg energipriserna med 26 procent och livsmedelspriserna med 30 procent, så energipriserna steg inte mer. Om kläder var billigare än livsmedel går inte att avgöra, eftersom varje index bara jämför en varugrupp med samma varugrupp år 2018 och inte säger något om prisnivån i olika grupper.',
     -- efter (passage oförändrad)
     'Vilken av följande slutsatser kan man dra utifrån tabellen?', null, '["Kläder var billigare än livsmedel år 2024.","Energipriserna steg med 58 procent mellan 2020 och 2022.","Energipriserna steg mer än livsmedelspriserna mellan 2018 och 2024.","Energipriserna sjönk med mindre än 20 procent mellan 2022 och 2024."]'::jsonb, 3,
     'Energiindexet sjönk från 150 till 126, alltså med 24 indexenheter. Räknat från 2022 års nivå är det 24 / 150 = 0,16, en minskning med 16 procent, vilket är mindre än 20 procent. Den slutsatsen stämmer alltså. Att energipriserna steg med 58 procent mellan 2020 och 2022 är fel: 58 indexenheter från nivån 92 är 58 / 92 ≈ 0,63, alltså ungefär 63 procent. Mellan 2018 och 2024 steg energipriserna med 26 procent och livsmedelspriserna med 30 procent, så energipriserna steg inte mer. Om kläder var billigare än livsmedel går inte att avgöra, eftersom varje index bara jämför en varugrupp med samma varugrupp år 2018 och inte säger något om prisnivån i olika grupper.',
     'agreed', null),
    ('ovn-xyz-015',
     -- före
     'Det gäller att 3^x = 4. Vad är 9^(x + 1)?', null, '["17","36","48","144"]'::jsonb, 3,
     'Skriv 9 som 3²: 9^(x + 1) = 9^x · 9 = (3²)^x · 9 = (3^x)² · 9 = 4² · 9 = 16 · 9 = 144. 36 = 4 · 9 får man om man glömmer att 9^x = (3^x)² och räknar 9^x som 4. 48 = 16 · 3 får man om man skriver 9^(x + 1) som 3^(2x + 1) och alltså bara multiplicerar x med 2 i exponenten; rätt exponent är 2(x + 1) = 2x + 2. 17 = 16 + 1 får man om man tror att 9^(x + 1) = 9^x + 1.',
     -- efter (passage oförändrad)
     'Det gäller att 3^x = 4. Vad är 9^(x + 1)?', null, '["17","36","48","144"]'::jsonb, 3,
     'Skriv 9 som 3²: 9^(x + 1) = 9^x · 9 = (3²)^x · 9 = (3^x)² · 9 = 4² · 9 = 16 · 9 = 144. 36 = 4 · 9 får man om man glömmer att 9^x = (3^x)² och räknar 9^x som 4. 48 = 16 · 3 får man om man skriver 9^(x + 1) som 3^(2x + 1) och alltså bara multiplicerar x med 2 i exponenten; rätt exponent är 2(x + 1) = 2x + 2. 17 = 16 + 1 får man om man tror att 9^(x + 1) = 9^x + 1.',
     'agreed', null),
    ('ovn-xyz-039',
     -- före
     'En strut har formen av en kon och hålls med spetsen rakt nedåt. Struten rymmer 2,7 dl när den är full. Man häller i vatten tills vattnet når upp till två tredjedelar av strutens höjd, räknat från spetsen. Hur mycket vatten är det i struten?', null, '["0,8 dl","1,2 dl","1,8 dl","2,6 dl"]'::jsonb, 0,
     'Vattnet bildar en mindre kon med spetsen nedåt som är likformig med hela struten, med längdskalan 2/3; både höjden och radien är två tredjedelar av strutens. Volymer förändras med kuben av längdskalan: (2/3)³ = 8/27. Vattnet är alltså 2,7 · 8/27 = 0,8 dl. 1,8 dl = 2,7 · 2/3 får man om man använder längdskalan direkt. 1,2 dl = 2,7 · 4/9 får man om man använder areaskalan (2/3)². 2,6 dl får man om man tror att det tomma utrymmet överst är en liten kon med skalan 1/3 och räknar 2,7 − 2,7/27; det hade stämt om struten hade hållits med spetsen uppåt.',
     -- efter (passage oförändrad)
     'En strut har formen av en kon och hålls med spetsen rakt nedåt. Struten rymmer 2,7 dl när den är full. Man häller i vatten tills vattnet når upp till två tredjedelar av strutens höjd, räknat från spetsen. Hur mycket vatten är det i struten?', null, '["0,8 dl","1,2 dl","1,8 dl","2,6 dl"]'::jsonb, 0,
     'Vattnet bildar en mindre kon med spetsen nedåt som är likformig med hela struten, med längdskalan 2/3; både höjden och radien är två tredjedelar av strutens. Volymer förändras med kuben av längdskalan: (2/3)³ = 8/27. Vattnet är alltså 2,7 · 8/27 = 0,8 dl. 1,8 dl = 2,7 · 2/3 får man om man använder längdskalan direkt. 1,2 dl = 2,7 · 4/9 får man om man använder areaskalan (2/3)². 2,6 dl får man om man tror att det tomma utrymmet överst är en liten kon med skalan 1/3 och räknar 2,7 − 2,7/27. Men eftersom spetsen pekar nedåt är det tomma utrymmet ingen kon, utan det som återstår av struten ovanför vattenytan.',
     'agreed', null),
    ('xyz-1',
     -- före
     'Ett rektangulärt rum är 6 m långt och 4 m brett. Hur stor är arean?', null, '["20 m²","24 m²","28 m²","36 m²"]'::jsonb, 1,
     'Arean av en rektangel fås genom längd gånger bredd: 6 × 4 = 24 m². 20 m² och 28 m² kommer från felräkningar av multiplikationen, och 36 m² är istället kvadraten på 6, inte rektangelns area.',
     -- efter (passage oförändrad)
     'Ett rektangulärt rum är 6 m långt och 4 m brett. Hur stor är rummets golvarea?', null, '["10 m²","12 m²","20 m²","24 m²"]'::jsonb, 3,
     'Golvet är en rektangel, och en rektangels area är längden gånger bredden: 6 · 4 = 24 m². 20 m² får man om man räknar ut omkretsen i stället för arean: 6 + 4 + 6 + 4 = 20. Men omkretsen är en längd i meter och ingen area. 12 m² får man om man delar med 2 som i formeln för en triangels area: 6 · 4/2 = 12. 10 m² får man om man adderar längden och bredden i stället för att multiplicera dem: 6 + 4 = 10.',
     'agreed', null),
    ('xyz-2',
     -- före
     'Priset sänks med 20 % från 250 kr. Vad kostar varan sedan?', null, '["180 kr","200 kr","210 kr","230 kr"]'::jsonb, 1,
     '20 procent av 250 kr är 50 kr, och 250 − 50 = 200 kr efter sänkningen. 230 kr motsvarar en sänkning med bara 20 kr, 210 kr är för litet avdrag, och 180 kr är ett för stort avdrag för en 20-procentig sänkning.',
     -- efter (passage oförändrad)
     'En vara kostar 250 kr. Priset sänks med 20 %. Vad kostar varan efter sänkningen?', null, '["200 kr","225 kr","230 kr","300 kr"]'::jsonb, 0,
     '20 % betyder 20 hundradelar, så sänkningen är 0,20 · 250 = 50 kr, och det nya priset är 250 − 50 = 200 kr. Man kan också räkna direkt: efter sänkningen återstår 80 % av priset, och 0,8 · 250 = 200 kr. 225 kr får man om man räknar ut 10 % av 250 kr, alltså 25 kr, och glömmer att dubbla det till 20 %. 230 kr får man om man drar av 20 kr i stället för 20 %. 300 kr får man om man höjer priset med 20 % i stället för att sänka det: 250 + 50 = 300.',
     'agreed', null),
    ('xyz-3',
     -- före
     'En cyklist kör 45 km på 1,5 timme. Vilken medelhastighet?', null, '["25 km/h","30 km/h","35 km/h","40 km/h"]'::jsonb, 1,
     'Medelhastigheten fås genom sträcka delat med tid: 45 km / 1,5 h = 30 km/h. 25 km/h och 35 km/h ligger nära men stämmer inte med divisionen, och 40 km/h skulle kräva en kortare tid än 1,5 timme.',
     -- efter (passage oförändrad)
     'En cyklist färdas 45 km på 1,5 timmar. Vilken medelhastighet har cyklisten?', null, '["15 km/h","30 km/h","45 km/h","67,5 km/h"]'::jsonb, 1,
     'Medelhastigheten är sträckan delad med tiden: 45/1,5 = 30 km/h. Kontroll: med hastigheten 30 km/h hinner man 30 km på en timme och 15 km på en halvtimme, alltså 45 km på 1,5 timmar. 67,5 km/h får man om man multiplicerar sträckan med tiden i stället för att dela: 45 · 1,5 = 67,5. 45 km/h får man om man bortser från den halva timmen och räknar som om färden tog 1 timme. 15 km/h får man om man delar med 3 eftersom 1,5 timmar är 3 halvtimmar. Då är 15 km sträckan per halvtimme, och per timme blir det dubbelt så långt.',
     'agreed', null),
    ('xyz-4',
     -- före
     'Lös 3x − 7 = 14. Vad är x?', null, '["5","7","9","21"]'::jsonb, 1,
     'Ekvationen ger 3x = 14 + 7 = 21, vilket ger x = 21/3 = 7. x = 5 och x = 9 uppfyller inte ekvationen vid insättning, och 21 är värdet på 3x, inte på x.',
     -- efter (passage oförändrad)
     'Lös ekvationen 3x − 7 = 14. Vad är x?', null, '["1/7","7/3","7","21"]'::jsonb, 2,
     'Addera 7 till båda leden: 3x = 14 + 7 = 21. Dela sedan båda leden med 3: x = 21/3 = 7. Kontroll: 3 · 7 − 7 = 21 − 7 = 14. 21 får man om man glömmer att dela med 3; 21 är värdet av 3x, inte av x. 7/3 får man om man flyttar över −7 till högerledet utan att byta tecken och får 3x = 14 − 7 = 7. 1/7 får man om man delar åt fel håll och räknar 3/21 i stället för 21/3.',
     'agreed', null),
    ('xyz-5',
     -- före
     'En triangel har bas 10 cm och höjd 6 cm. Area?', null, '["16 cm²","30 cm²","60 cm²","120 cm²"]'::jsonb, 1,
     'Triangelns area beräknas som (bas × höjd)/2 = (10 × 6)/2 = 30 cm². 60 cm² är produkten bas gånger höjd utan att delas med 2, 120 cm² är dubbelt så mycket, och 16 cm² stämmer inte med formeln alls.',
     -- efter (passage oförändrad)
     'En triangel har basen 10 cm och höjden 6 cm. Hur stor är triangelns area?', null, '["30 cm²","32 cm²","60 cm²","120 cm²"]'::jsonb, 0,
     'En triangels area är basen gånger höjden delat med 2: 10 · 6/2 = 30 cm². Man delar med 2 eftersom triangeln har hälften så stor area som en rektangel med samma bas och höjd. 60 cm² får man om man glömmer att dela med 2; det är rektangelns area. 120 cm² får man om man multiplicerar med 2 i stället för att dela med 2: 10 · 6 · 2 = 120. 32 cm² får man om man blandar ihop area och omkrets och räknar 2 · (10 + 6) = 32, som om figuren vore en rektangel med sidorna 10 cm och 6 cm.',
     'agreed', null),
    ('xyz-6',
     -- före
     'Ett lån på 8 000 kr ökar med 5 % ränta på ett år. Ny skuld?', null, '["8 200 kr","8 400 kr","8 500 kr","8 800 kr"]'::jsonb, 1,
     'Räntan blir 5 procent av 8 000 kr, det vill säga 400 kr, så den nya skulden är 8 000 + 400 = 8 400 kr. 8 200 kr och 8 500 kr bygger på felaktig procentberäkning, och 8 800 kr motsvarar snarare en räntesats på 10 procent.',
     -- efter (passage oförändrad)
     'Ett lån på 8 000 kr har årsräntan 5 %. Ingenting betalas under året, så räntan läggs till skulden. Hur stor är skulden efter ett år?', null, '["400 kr","7 600 kr","8 400 kr","12 000 kr"]'::jsonb, 2,
     'Räntan för ett år är 5 % av 8 000 kr, alltså 0,05 · 8 000 = 400 kr. Räntan läggs till skulden, som därför blir 8 000 + 400 = 8 400 kr. Man kan också räkna direkt: skulden ökar till 105 %, och 1,05 · 8 000 = 8 400 kr. 400 kr är bara räntan; man har glömt att lägga till själva lånet. 7 600 kr får man om man drar av räntan i stället för att lägga till den. 12 000 kr får man om man skriver 5 % som 0,5 i stället för 0,05. Då blir räntan 4 000 kr, vilket är 50 % av lånet.',
     'agreed', null),
    ('xyz-7',
     -- före
     'Medelvärdet av 4, 8 och 12 är 8. Vilket tal ska läggas till så att medelvärdet blir 10?', null, '["10","16","18","20"]'::jsonb, 1,
     'För att medelvärdet av fyra tal ska bli 10 måste summan vara 4 × 10 = 40. De tre kända talen summerar till 4 + 8 + 12 = 24, så det fjärde talet måste vara 40 − 24 = 16. 10 och 18 ger fel totalsumma, och 20 skulle ge ett medelvärde högre än 10.',
     -- efter (passage oförändrad)
     'Medelvärdet av talen 4, 8 och 12 är 8. Vilket fjärde tal ska läggas till för att medelvärdet av de fyra talen ska bli 10?', null, '["6","10","12","16"]'::jsonb, 3,
     'Medelvärdet är summan av talen delad med antalet tal. Fyra tal med medelvärdet 10 har alltså summan 4 · 10 = 40. De tre givna talen har summan 4 + 8 + 12 = 24, så det fjärde talet är 40 − 24 = 16. Kontroll: (4 + 8 + 12 + 16)/4 = 40/4 = 10. 6 får man om man glömmer att antalet tal blir fyra och räknar med summan 3 · 10 = 30: 30 − 24 = 6. 10 får man om man tror att det nya talet ska vara lika stort som det önskade medelvärdet, men då blir medelvärdet bara 34/4 = 8,5. 12 får man om man lägger skillnaden mellan medelvärdena, 10 − 8 = 2, på 10. Men de tre givna talen ligger tillsammans 3 · 2 = 6 under 10, så det nya talet måste ligga 6 över 10.',
     'agreed', null),
    ('xyz-8',
     -- före
     'En karta har skalan 1:50 000. 4 cm på kartan motsvarar hur lång sträcka i verkligheten?', null, '["0,2 km","2 km","20 km","200 km"]'::jsonb, 1,
     'Skalan 1:50 000 innebär att 4 cm på kartan motsvarar 4 × 50 000 = 200 000 cm i verkligheten, vilket är 2 000 m, det vill säga 2 km. 0,2 km är hundra gånger för litet, och 20 km respektive 200 km är för stora eftersom de bygger på en felaktig enhetsomvandling.',
     -- efter (passage oförändrad)
     'En karta har skalan 1:50 000. Hur lång sträcka i verkligheten motsvarar 4 cm på kartan?', null, '["0,5 km","2 km","20 km","200 km"]'::jsonb, 1,
     'Skalan 1:50 000 betyder att varje sträcka i verkligheten är 50 000 gånger så lång som på kartan. Sträckan 4 cm på kartan motsvarar alltså 4 · 50 000 = 200 000 cm i verkligheten. Eftersom 1 m = 100 cm och 1 km = 1 000 m är 200 000 cm = 2 000 m = 2 km. 0,5 km = 50 000 cm är vad 1 cm på kartan motsvarar; man har glömt att multiplicera med 4. 200 km får man om man tror att 200 000 cm är 200 000 m och bara delar med 1 000. 20 km får man om man tappar en nolla i omvandlingen och delar 200 000 med 10 000 i stället för med 100 000.',
     'agreed', null),
    ('nog-2',
     -- före
     'Är n jämnt? (1) n är delbart med 4. (2) n är delbart med 2. Vilken information räcker?', null, '["Bara (1) räcker","Bara (2) räcker","Båda behövs tillsammans, ingen ensam","Vardera räcker för sig"]'::jsonb, 3,
     'Påstående (1) säger att n är delbart med 4, och alla tal som är delbara med 4 är per definition jämna, så (1) räcker ensamt.
Påstående (2) säger direkt att n är delbart med 2, vilket är samma sak som att n är jämnt, så även (2) räcker ensamt.
Eftersom båda påståendena var för sig avgör frågan, räcker vardera för sig.',
     -- efter
     'Tillräcklig information för lösningen erhålls', 'n är ett heltal. Är n jämnt?
(1) n är delbart med 4.
(2) n² är jämnt.', '["i (1) men ej i (2)","i (2) men ej i (1)","i (1) tillsammans med (2)","i (1) och (2) var för sig","ej genom de båda påståendena"]'::jsonb, 3,
     '(1) Eftersom 4 = 2 · 2 är varje tal som är delbart med 4 också delbart med 2. n är alltså jämnt, och svaret är ja. (1) räcker.
(2) Produkten av två udda tal är udda, så om n vore udda skulle även n² = n · n vara udda. Eftersom n² är jämnt måste n vara jämnt, och svaret är ja. (2) räcker.
Tillräcklig information erhålls i (1) och (2) var för sig.',
     'agreed', null),
    ('nog-3',
     -- före
     'Vad är rektangelns area? (1) Längden är 8 cm. (2) Omkretsen är 24 cm. Vilken information räcker?', null, '["Bara (1) räcker","Bara (2) räcker","Båda behövs tillsammans, ingen ensam","Inte ens båda räcker"]'::jsonb, 2,
     'Påstående (1) ger bara längden 8 cm utan information om bredden, så arean går inte att beräkna ensamt.
Påstående (2) ger enbart omkretsen 24 cm, vilket i sig kan motsvara oändligt många kombinationer av längd och bredd.
Tillsammans ger de bredden 24/2 − 8 = 4 cm och därmed arean 8 × 4 = 32 cm², så båda behövs.',
     -- efter
     'Tillräcklig information för lösningen erhålls', 'Hur stor area har en viss rektangel?
(1) Rektangelns längd är 8 cm.
(2) Rektangelns omkrets är 24 cm.', '["i (1) men ej i (2)","i (2) men ej i (1)","i (1) tillsammans med (2)","i (1) och (2) var för sig","ej genom de båda påståendena"]'::jsonb, 2,
     '(1) Med längden 8 cm kan bredden till exempel vara 1 cm eller 4 cm, och då blir arean 8 cm² respektive 32 cm². (1) räcker inte.
(2) Omkretsen 24 cm betyder att längden och bredden tillsammans är 12 cm. Både sidorna 8 cm och 4 cm och sidorna 10 cm och 2 cm ger omkretsen 24 cm, men areorna blir 32 cm² respektive 20 cm². (2) räcker inte.
Tillsammans: bredden är 12 − 8 = 4 cm, och arean är 8 · 4 = 32 cm². Tillräcklig information erhålls i (1) tillsammans med (2).',
     'agreed', null),
    ('nog-4',
     -- före
     'Är heltalet k positivt? (1) k² = 16. (2) k > 0. Vilken information räcker?', null, '["Bara (1) räcker","Bara (2) räcker","Båda behövs tillsammans, ingen ensam","Vardera räcker för sig"]'::jsonb, 1,
     'Påstående (1) ger k² = 16, vilket betyder att k är antingen 4 eller −4, så tecknet på k förblir okänt och räcker inte ensamt.
Påstående (2) säger direkt att k > 0, vilket omedelbart avgör att k är positivt.
Därför räcker bara (2) för att besvara frågan.',
     -- efter
     'Tillräcklig information för lösningen erhålls', 'k är ett heltal. Är k positivt?
(1) k² = 16
(2) k³ = 64', '["i (1) men ej i (2)","i (2) men ej i (1)","i (1) tillsammans med (2)","i (1) och (2) var för sig","ej genom de båda påståendena"]'::jsonb, 1,
     '(1) Både k = 4 och k = −4 ger k² = 16. Det första talet är positivt men inte det andra. (1) räcker inte.
(2) Om k vore 0 eller negativt skulle även k³ = k · k · k vara 0 eller negativt. Eftersom k³ = 64 måste k vara positivt (k = 4), och svaret är ja. (2) räcker.
Tillräcklig information erhålls i (2) men ej i (1).',
     'agreed', null),
    ('nog-5',
     -- före
     'Vad är medelvärdet av a och b? (1) a + b = 20. (2) a − b = 4. Vilken information räcker?', null, '["Bara (1) räcker","Bara (2) räcker","Båda behövs tillsammans, ingen ensam","Vardera räcker för sig"]'::jsonb, 0,
     'Medelvärdet av a och b är (a + b)/2. Påstående (1) ger a + b = 20 direkt, vilket genast ger medelvärdet 10, så (1) räcker ensamt.
Påstående (2) ger bara skillnaden a − b = 4, vilket inte säger något om summan och därför inte räcker ensamt för att bestämma medelvärdet.',
     -- efter
     'Tillräcklig information för lösningen erhålls', 'Vilket är medelvärdet av a och b?
(1) a + b = 20
(2) a − b = 4', '["i (1) men ej i (2)","i (2) men ej i (1)","i (1) tillsammans med (2)","i (1) och (2) var för sig","ej genom de båda påståendena"]'::jsonb, 0,
     'Medelvärdet av a och b är (a + b)/2.
(1) a + b = 20 ger medelvärdet 20/2 = 10. (1) räcker.
(2) Både a = 6, b = 2 och a = 10, b = 6 uppfyller a − b = 4, men medelvärdet blir 4 respektive 8. (2) räcker inte.
Tillräcklig information erhålls i (1) men ej i (2).',
     'agreed', null),
    ('nog-6',
     -- före
     'Hur många elever finns i klassen? (1) 40 % är flickor. (2) Det finns 12 flickor. Vilken information räcker?', null, '["Bara (1) räcker","Bara (2) räcker","Båda behövs tillsammans, ingen ensam","Inte ens båda räcker"]'::jsonb, 2,
     'Påstående (1) ger bara att 40 procent är flickor, utan ett faktiskt antal går det inte att räkna ut klassens storlek.
Påstående (2) ger enbart antalet flickor, 12, utan att veta vilken andel de utgör av klassen.
Tillsammans ger de att 12 motsvarar 40 procent, vilket ger totalt 12 / 0,4 = 30 elever, så båda behövs.',
     -- efter
     'Tillräcklig information för lösningen erhålls', 'Hur många elever går i en viss klass?
(1) 40 procent av eleverna i klassen är flickor.
(2) Det går 12 flickor i klassen.', '["i (1) men ej i (2)","i (2) men ej i (1)","i (1) tillsammans med (2)","i (1) och (2) var för sig","ej genom de båda påståendena"]'::jsonb, 2,
     '(1) ger bara andelen flickor, inte hur många eleverna är. Klassen kan till exempel ha 10 elever, varav 4 flickor, eller 30 elever, varav 12 flickor. (1) räcker inte.
(2) ger bara antalet flickor, inte hur stor andel av klassen de utgör. Klassen kan till exempel ha 20 eller 30 elever. (2) räcker inte.
Tillsammans: de 12 flickorna är 40 procent av eleverna. Då är 10 procent 3 elever, och klassen har 30 elever. Tillräcklig information erhålls i (1) tillsammans med (2).',
     'agreed', null),
    ('nog-7',
     -- före
     'Vad är p · q? (1) p = 0. (2) q = 17. Vilken information räcker?', null, '["Bara (1) räcker","Bara (2) räcker","Båda behövs tillsammans, ingen ensam","Inte ens båda räcker"]'::jsonb, 0,
     'Påstående (1) ger p = 0, och då blir produkten p · q alltid 0 oavsett vad q är, så (1) räcker ensamt.
Påstående (2) ger bara q = 17 utan information om p, vilket inte räcker för att bestämma produkten.
Därför räcker bara (1) för att besvara frågan.',
     -- efter
     'Tillräcklig information för lösningen erhålls', 'Vilket värde har produkten pq?
(1) p = 0
(2) q = 17', '["i (1) men ej i (2)","i (2) men ej i (1)","i (1) tillsammans med (2)","i (1) och (2) var för sig","ej genom de båda påståendena"]'::jsonb, 0,
     '(1) Om p = 0 är pq = 0 · q = 0, vilket tal q än är. (1) räcker.
(2) Om q = 17 är pq = 17p, och det beror på p. Till exempel ger p = 1 produkten 17 och p = 2 produkten 34. (2) räcker inte.
Tillräcklig information erhålls i (1) men ej i (2).',
     'agreed', null),
    ('nog-8',
     -- före
     'Ligger punkten (x, y) på linjen y = 2x + 1? (1) x = 3. (2) y = 7. Vilken information räcker?', null, '["Bara (1) räcker","Bara (2) räcker","Båda behövs tillsammans, ingen ensam","Inte ens båda räcker"]'::jsonb, 2,
     'Påstående (1) ger bara x = 3 utan att ange y, så det går inte att kontrollera om punkten ligger på linjen.
Påstående (2) ger bara y = 7 utan att ange x, vilket av samma skäl inte räcker ensamt.
Tillsammans ger de att 2 · 3 + 1 = 7, vilket stämmer med y-värdet, så båda behövs för att avgöra att punkten faktiskt ligger på linjen.',
     -- efter
     'Tillräcklig information för lösningen erhålls', 'Ligger punkten (x, y) på linjen y = 2x + 1?
(1) x = 3
(2) y = 7', '["i (1) men ej i (2)","i (2) men ej i (1)","i (1) tillsammans med (2)","i (1) och (2) var för sig","ej genom de båda påståendena"]'::jsonb, 2,
     'En punkt ligger på linjen om dess y-koordinat är 2 gånger x-koordinaten plus 1.
(1) Punkten (3, 7) ligger på linjen, eftersom 2 · 3 + 1 = 7, men punkten (3, 0) gör det inte. (1) räcker inte.
(2) Punkten (3, 7) ligger på linjen, men punkten (0, 7) gör det inte, eftersom 2 · 0 + 1 = 1. (2) räcker inte.
Tillsammans: punkten är (3, 7), och eftersom 2 · 3 + 1 = 7 ligger den på linjen. Svaret är ja, så tillräcklig information erhålls i (1) tillsammans med (2).',
     'agreed', null),
    ('nog-1',
     -- före
     'Vad är värdet av x + y? (1) x = 4. (2) y = 6. Vilken information räcker?', null, '["Bara (1) räcker","Bara (2) räcker","Båda behövs tillsammans, ingen ensam","Inte ens båda räcker"]'::jsonb, 2,
     'Påstående (1) ger bara x = 4 utan information om y, så summan x + y kan inte beräknas.
Påstående (2) ger bara y = 6 utan information om x, vilket av samma skäl inte räcker ensamt.
Tillsammans ger de x + y = 4 + 6 = 10, så båda behövs för att lösa uppgiften.',
     -- efter
     'Tillräcklig information för lösningen erhålls', 'Vilket värde har x + y?
(1) x = 4
(2) y = 6', '["i (1) men ej i (2)","i (2) men ej i (1)","i (1) tillsammans med (2)","i (1) och (2) var för sig","ej genom de båda påståendena"]'::jsonb, 2,
     '(1) ger x = 4 men säger inget om y. Till exempel ger y = 1 summan 5 och y = 6 summan 10. (1) räcker inte.
(2) ger y = 6 men säger inget om x. Till exempel ger x = 0 summan 6 och x = 4 summan 10. (2) räcker inte.
Tillsammans: x + y = 4 + 6 = 10. Tillräcklig information erhålls i (1) tillsammans med (2).',
     'agreed', null),
    ('ovn-nog-026',
     -- före
     'Tillräcklig information för lösningen erhålls', 'da340a48e723285d059a4395f4d5839b', '["i (1) men ej i (2)","i (2) men ej i (1)","i (1) tillsammans med (2)","i (1) och (2) var för sig","ej genom de båda påståendena"]'::jsonb, 1,
     '(1) Talet 4 är delbart med 4 men inte med 8, medan talet 8 är delbart med både 4 och 8. (1) räcker inte.
(2) Varje faktor 2 i n ger två faktorer 2 i n² = n · n, så n² innehåller faktorn 2 ett jämnt antal gånger. Eftersom 32 = 2 · 2 · 2 · 2 · 2 innehåller n² faktorn 2 minst fem gånger, och eftersom antalet är jämnt minst sex gånger. Då innehåller n faktorn 2 minst tre gånger, och n är delbart med 2 · 2 · 2 = 8. Svaret är ja, så (2) räcker.
Tillräcklig information erhålls i (2) men ej i (1).',
     -- efter (passage oförändrad)
     'Tillräcklig information för lösningen erhålls', null, '["i (1) men ej i (2)","i (2) men ej i (1)","i (1) tillsammans med (2)","i (1) och (2) var för sig","ej genom de båda påståendena"]'::jsonb, 1,
     '(1) Talet 4 är delbart med 4 men inte med 8, medan talet 8 är delbart med både 4 och 8. (1) räcker inte.
(2) Varje faktor 2 i n ger två faktorer 2 i n² = n · n, så n² innehåller faktorn 2 ett jämnt antal gånger. Eftersom 32 = 2 · 2 · 2 · 2 · 2 innehåller n² faktorn 2 minst fem gånger. Antalet är jämnt, så n² innehåller faktorn 2 minst sex gånger. Då innehåller n faktorn 2 minst tre gånger, och n är delbart med 2 · 2 · 2 = 8. Svaret är ja, så (2) räcker.
Tillräcklig information erhålls i (2) men ej i (1).',
     'disagreed', 'Förklaringen förtydligades vid granskningen 2026-10-26; facit och räkningar stämmer. Kvar att avgöra för en människa: uppgiften liknar provuppgiften hp-2015-03-28, provpass 2, NOG 27 (samma uppbyggnad med en kvadrat som är delbar med ett tal i (2) och samma svar, bara (2) räcker), med egna tal och en egen vridning (32 = 2^5 kräver jämn exponent). Publicera om likheten är acceptabel, annars avvisa.'),
    ('ovn-elf-021',
     -- före
     'What is the main point of the text?', 'dd24009d9f09eabac3989b2bd28c035b', '["Screening may well do more harm than good, since many of the tumours it finds would never have caused any harm.","The figures and stories most often cited in support of screening say little about whether it saves lives.","Survival rates mislead chiefly because screening programmes start counting from the moment a tumour is found.","Screening ought to be offered only for diseases where large trials have shown that it prevents deaths."]'::jsonb, 1,
     'The author argues that survival figures can improve without anyone living longer, and that overdiagnosis creates grateful ''survivors'' who were never in danger, so that even a programme that ''did nothing but harm'' could look like a great success; the usual evidence therefore says little about whether screening saves lives. The idea that screening may do more harm than good runs against ''None of this means that screening is a mistake'', and the text never says how many of the tumours found are harmless. Starting the count at diagnosis is only one of the two distortions described, so it is neither the chief reason nor the main point. Nor does the author say that screening should be restricted to diseases where trials have shown a benefit; the conclusion is that people deserve to be told what they are being offered.',
     -- efter (passage oförändrad)
     'What is the main point of the text?', null, '["Screening may well do more harm than good, since many of the tumours it finds would never have caused any harm.","The figures and stories most often cited in support of screening say little about whether it saves lives.","Survival rates mislead chiefly because screening programmes start counting from the moment a tumour is found.","Screening ought to be offered only for diseases where large trials have shown that it prevents deaths."]'::jsonb, 1,
     'The author argues that survival figures can improve without anyone living longer, and that overdiagnosis creates grateful ''survivors'' who were never in danger, so that even a programme that ''did nothing but harm'' could look like a great success; the usual evidence therefore says little about whether screening saves lives. The idea that screening may do more harm than good runs against ''None of this means that screening is a mistake'', and the text never says how many of the tumours found are harmless. Starting the count at diagnosis is only one of the two distortions described, and the text does not single it out as the chief one; it even calls the second ''in some ways, more troubling''. A single distortion is in any case too narrow to be the main point. Nor does the author say that screening should be restricted to diseases where trials have shown a benefit; the conclusion is that people deserve to be told what they are being offered.',
     'agreed', null),
    ('ovn-elf-037',
     -- före
     'Which alternative best fits gap 1?', '79d96646c40228f4292443d90c3129fd', '["ignored","measured","justified","reversed"]'::jsonb, 3,
     'The next sentence contrasts chemicals that ''linger in soil and water for decades'' with a streetlamp that ''stops doing harm the moment it is switched off'', so the point is that light pollution can be undone more easily than other kinds: ''reversed''. ''Ignored'' may seem to fit the later remark that a lit street seems self-evidently better than a dark one, but it does not match the contrast with lingering chemicals, and it would not make it ''all the more striking'' that the problem keeps growing. Nothing in the passage concerns how easily light pollution can be ''measured'' or ''justified''.',
     -- efter (passage oförändrad)
     'Which alternative best fits gap 1?', null, '["ignored","measured","justified","reversed"]'::jsonb, 3,
     'The next sentence contrasts chemicals that ''linger in soil and water for decades'' with a streetlamp that ''stops doing harm the moment it is switched off'', so the point is that light pollution can be undone more easily than other ways in which humans alter their surroundings: it is easily ''reversed''. That is also why it is ''all the more striking'' that the problem keeps growing. ''Ignored'' and ''justified'' may seem to fit the later remark that a brightly lit street seems self-evidently better than a dark one, but neither matches the contrast with lingering chemicals, and neither would make the growth of the problem striking; both would rather help to explain it. Nothing in the passage concerns how easily light pollution can be ''measured''.',
     'agreed', null),
    ('mek-4',
     -- före
     'Välj det alternativ som bäst fyller i meningen.', '9375c26f47f40600deb90057648277dd', '["onödigt","vagt","muntligt","koncist"]'::jsonb, 3,
     'Koncist betyder kortfattat och precist, den positiva egenskap meningen beskriver. Onödigt är en värdering som inte beskriver språklig stil. Vagt är nästan motsatsen, eftersom det innebär otydlighet snarare än precision. Muntligt beskriver talspråklig framställning, inte kortfattad precision.',
     -- efter
     'Välj det alternativ som bäst fyller i meningen.', 'Rapporten är ____: den sammanfattar tre års forskning på tio sidor utan att tappa i precision.', '["onödig","vag","muntlig","koncis"]'::jsonb, 3,
     'Koncis betyder kortfattad men ändå innehållsrik och precis, och det är just vad förklaringen efter kolon beskriver: tre års forskning på tio sidor utan att precisionen går förlorad. Onödig är ett negativt omdöme som strider mot att resten av meningen framhåller rapportens förtjänster. Vag betyder otydlig, vilket motsägs av att rapporten behåller sin precision. Muntlig beskriver en talad framställning och passar inte en skriven rapport på tio sidor.',
     'agreed', null),
    ('mek-10',
     -- före
     'Välj det alternativ som bäst fyller i meningen.', '578e64c3cbf4ff46e9c3351ec3483a04', '["oaktat","följaktligen","i synnerhet","däremot"]'::jsonb, 2,
     'I synnerhet förstärker att något gäller särskilt eller framför allt en viss grupp. Oaktat betyder trots och inför en motsägelse som inte hör hemma här. Följaktligen drar en slutsats i stället för att peka ut en särskild grupp. Däremot ställer två led i kontrast och passar inte när en grupp ska lyftas fram som särskilt berörd.',
     -- efter
     'Välj det alternativ som bäst fyller i meningen.', 'Förslaget vann gehör ____ bland dem som tidigare varit skeptiska, eftersom det bemötte just deras invändningar.', '["oaktat","följaktligen","i synnerhet","däremot"]'::jsonb, 2,
     'I synnerhet betyder särskilt eller framför allt och lyfter fram de tidigare skeptiska som den grupp där förslaget fick mest gehör. Bisatsen förklarar varför: förslaget bemötte just deras invändningar. Oaktat är en preposition som betyder trots och kan inte stå framför ”bland dem”. Följaktligen drar en slutsats av något som redan sagts, men här kommer skälet i stället efteråt, i bisatsen med ”eftersom”. Däremot ställer något i kontrast mot ett tidigare led, och något sådant led finns inte i meningen.',
     'agreed', null),
    ('mek-11',
     -- före
     'Välj det alternativ som bäst fyller i meningen.', '7fda5de6bab8a4346fdceb74f1d4c789', '["Oaktat","Tack vare","På grund av","Till följd av"]'::jsonb, 0,
     'Oaktat betyder trots och är ett formellt uttryck som passar när något gäller trots en omständighet. Tack vare anger en positiv orsak, inte en motsägelse. På grund av anger orsak-verkan rakt av, vilket ger fel logik om meningen kräver en motsägelse. Till följd av uttrycker samma slags orsakssamband och passar därför inte heller.',
     -- efter (passage oförändrad)
     'Välj det alternativ som bäst fyller i meningen.', null, '["Oaktat","Tack vare","På grund av","Till följd av"]'::jsonb, 0,
     'Oaktat betyder trots och passar eftersom osäkerhet normalt talar emot en investering: bolaget gick vidare trots osäkerheten. Tack vare anger en positiv orsak och skulle betyda att osäkerheten hjälpte bolaget att investera, vilket är ologiskt. På grund av gör osäkerheten till skälet för investeringen, vilket inte heller går ihop. Till följd av uttrycker samma slags orsakssamband och är fel av samma skäl.',
     'agreed', null),
    ('mek-15',
     -- före
     'Välj det alternativ som bäst fyller i meningen.', '678784597e5e8844ce334ec9108d73db', '["formellt","talspråkligt","barnsligt","slangbetonat"]'::jsonb, 0,
     'Formellt register hör hemma i sakprosa och essäistik av det slag som beskrivs. Talspråkligt är motsatt register och passar inte i en formell text. Barnsligt beskriver en omogen framställning, inte den vårdade stil som avses. Slangbetonat innebär informellt och vardagsnära språk, vilket krockar med sammanhangets formella ton.',
     -- efter (passage oförändrad)
     'Välj det alternativ som bäst fyller i meningen.', null, '["formellt","talspråkligt","högtravande","slangbetonat"]'::jsonb, 0,
     'Formellt register är vårdat och sakligt och hör hemma i vetenskaplig essäistik. Talspråkligt är det motsatta registret och passar inte i en vetenskaplig text. Högtravande betyder uppstyltat och överdrivet högtidligt, ett negativt omdöme som inte kan beskriva ett register som sägs passa. Slangbetonat innebär informellt och vardagsnära språk, vilket krockar med den vetenskapliga tonen.',
     'agreed', null),
    ('mek-17',
     -- före
     'Välj det alternativ som bäst fyller i meningen.', '6fb1c42ed2c4eba2694649ce15a672dd', '["entydig","ambivalent","aggressiv","indifferent på ett skämtsamt sätt"]'::jsonb, 1,
     'Ambivalent betyder kluven, det vill säga att ha motstridiga känslor eller uppfattningar samtidigt. Entydig betyder tvärtom tydlig och utan tvetydighet, motsatsen till det sökta. Aggressiv beskriver fientlighet, inte inre kluvenhet. Indifferent på ett skämtsamt sätt beskriver likgiltighet snarare än att vara splittrad mellan två ståndpunkter.',
     -- efter
     'Välj det alternativ som bäst fyller i meningen.', 'Han var ____ till förslaget: både entusiastisk och avvisande på samma gång.', '["entydig","ambivalent","aggressiv","indifferent"]'::jsonb, 1,
     'Ambivalent betyder kluven, att samtidigt ha motstridiga känslor, och det är precis vad förklaringen efter kolon beskriver: både entusiastisk och avvisande på samma gång. Entydig betyder tvärtom klar och otvetydig, motsatsen till en kluven hållning. Aggressiv beskriver fientlighet, inte en blandning av känslor. Indifferent betyder likgiltig, alltså att inte bry sig åt något håll, vilket strider mot att han är både entusiastisk och avvisande.',
     'agreed', null),
    ('mek-20',
     -- före
     'Välj det alternativ som bäst fyller i meningen.', '374e8454d0bfd53bb7a357f83b19bfb9', '["alltså","nämligen","respektive","dock"]'::jsonb, 3,
     'Dock uttrycker en kontrast: skillnaden är liten men ändå betydelsefull. Alltså drar en slutsats i stället för att införa en invändning. Nämligen förklarar eller preciserar något föregående utan att vända innebörden. Respektive parar ihop led var för sig och ger ingen kontrastiv nyans.',
     -- efter (passage oförändrad)
     'Välj det alternativ som bäst fyller i meningen.', null, '["alltså","nämligen","respektive","dock"]'::jsonb, 3,
     'Dock uttrycker en kontrast: skillnaden är liten men ändå statistiskt signifikant, det vill säga svår att förklara som en ren slump. Signifikant betyder här inte att skillnaden är stor eller viktig. Alltså drar en slutsats i stället för att införa en invändning. Nämligen förklarar eller preciserar något föregående utan att vända innebörden. Respektive parar ihop led var för sig och ger ingen kontrastiv nyans.',
     'agreed', null),
    ('mek-22',
     -- före
     'Välj det alternativ som bäst fyller i luckorna.', 'c2178ebf329aa4e4d9758f03c1b1744f', '["både / och","varken / eller","dels / dels","såväl / som"]'::jsonb, 1,
     'Varken … eller negerar båda leden samtidigt, vilket krävs när ingetdera alternativ gäller. Både … och skulle i stället bekräfta att båda leden gäller, det motsatta av vad som avses. Dels … dels räknar upp två sanna omständigheter utan negation. Såväl … som bekräftar likaså båda leden och ger fel innebörd.',
     -- efter
     'Välj det alternativ som bäst fyller i luckorna.', 'Kommittén var ____ beredd att kompromissa ____ villig att överge kärnfrågan, så förhandlingarna låste sig.', '["både / och","varken / eller","dels / dels","såväl / som"]'::jsonb, 1,
     'Varken … eller förnekar båda leden: kommittén var inte beredd att kompromissa och inte heller villig att överge kärnfrågan, och därför låste sig förhandlingarna. Både … och skulle i stället betyda att kommittén gav efter på båda punkterna, och då förklaras inte att förhandlingarna låste sig. Dels … dels räknar också upp två saker som båda gäller och ger samma motsägelse. Såväl … som betyder detsamma som både … och, och är fel av samma skäl.',
     'agreed', null),
    ('mek-23',
     -- före
     'Välj det alternativ som bäst fyller i luckorna.', '06bc4b3ffce37ca297ed4e11e6f7a570', '["varken / eller","antingen / eller","dels / dels","inte / utan"]'::jsonb, 2,
     'Dels … dels räknar upp två parallella omständigheter som båda gäller samtidigt. Varken … eller negerar båda leden, vilket inte stämmer när båda faktiskt gäller. Antingen … eller uttrycker ett ömsesidigt uteslutande val mellan leden, inte en uppräkning. Inte … utan ersätter ett förkastat led med ett annat, vilket inte passar en ren uppräkning.',
     -- efter
     'Välj det alternativ som bäst fyller i luckorna.', 'Utredningen var ____ försenad, ____ underfinansierad – två problem som tillsammans förklarar det tunna underlaget.', '["varken / eller","antingen / eller","dels / dels","inte / utan"]'::jsonb, 2,
     'Dels … dels räknar upp två omständigheter som båda gäller, och meningen talar just om två problem som tillsammans förklarar det tunna underlaget. Varken … eller förnekar båda leden, och då finns inga problem som kan förklara något. Antingen … eller säger att bara det ena gäller, vilket strider mot att det handlar om två problem. Inte … utan stryker förseningen och lämnar bara ett problem, så det går inte heller ihop med meningen.',
     'agreed', null),
    ('mek-24',
     -- före
     'Välj det alternativ som bäst fyller i luckorna.', '94f40d6b699c90ee14507af18b154eeb', '["varken / eller","antingen / eller","dels / dels","både / och"]'::jsonb, 3,
     'Både … och förenar två positiva egenskaper som gäller samtidigt. Varken … eller negerar i stället båda leden. Antingen … eller ställer leden som ömsesidigt uteslutande alternativ. Dels … dels fungerar som uppräkning men saknar den sammanbindande, förstärkande innebörd som både … och ger här.',
     -- efter
     'Välj det alternativ som bäst fyller i luckorna.', 'Metoden är ____ tidskrävande ____ robust nog för att användas i uppföljande studier: den tar lång tid men ger tillförlitliga resultat.', '["varken / eller","antingen / eller","inte / utan","både / och"]'::jsonb, 3,
     'Både … och anger att båda egenskaperna gäller samtidigt, och förklaringen efter kolon bekräftar just det: metoden tar lång tid men ger tillförlitliga resultat. Varken … eller skulle förneka båda egenskaperna, vilket strider mot förklaringen. Antingen … eller säger att bara den ena gäller, men enligt förklaringen gäller båda. Inte … utan förnekar att metoden är tidskrävande, trots att den enligt förklaringen tar lång tid.',
     'agreed', null),
    ('mek-25',
     -- före
     'Välj det alternativ som bäst fyller i luckorna.', '965d38b6d2ead04dd8e6bec0f55ba842', '["såväl / som","varken / eller","antingen / eller","ju / desto"]'::jsonb, 0,
     'Såväl … som markerar att båda de nämnda grupperna avses, en bekräftande uppräkning. Varken … eller skulle i stället utesluta båda grupperna. Antingen … eller ställer grupperna som ett val mellan dem, inte som båda samtidigt. Ju … desto uttrycker en proportionell relation, inte en uppräkning av grupper.',
     -- efter
     'Välj det alternativ som bäst fyller i luckorna.', 'Förslaget vann gehör ____ bland forskarna ____ bland praktikerna i fältet och kunde därför införas utan större motstånd.', '["såväl / som","varken / eller","antingen / eller","ju / desto"]'::jsonb, 0,
     'Såväl … som anger att förslaget fick stöd i båda grupperna, och det förklarar att det kunde införas utan större motstånd. Varken … eller skulle betyda att ingen av grupperna stödde förslaget, vilket inte går ihop med att det infördes utan motstånd. Antingen … eller anger att bara en av grupperna avses och lämnar öppet vilken, vilket inte förklarar varför motståndet uteblev. Ju … desto uttrycker ett proportionellt samband och kräver komparativer, så det passar inte i en uppräkning av grupper.',
     'agreed', null),
    ('mek-26',
     -- före
     'Välj det alternativ som bäst fyller i luckorna.', '3b35f82bceadac6cbc367e067d44542e', '["varken / eller","inte bara / utan också","dels / dels","antingen / eller"]'::jsonb, 1,
     'Inte bara … utan också utvidgar påståendet genom att lägga till ytterligare ett led utöver det första. Varken … eller negerar båda leden, motsatsen till en utvidgning. Dels … dels räknar upp led parallellt utan den förstärkande, stegrande effekten. Antingen … eller ställer leden som ett ömsesidigt uteslutande val.',
     -- efter
     'Välj det alternativ som bäst fyller i luckorna.', 'Reformen var ____ en ekonomisk fråga ____ en fråga om tillit till institutionerna, och den senare aspekten visade sig vara avgörande.', '["varken / eller","inte bara / utan också","ju / desto","antingen / eller"]'::jsonb, 1,
     'Inte bara … utan också lägger till en aspekt utöver den första och lyfter fram den: reformen gällde ekonomin men också tilliten till institutionerna, och det var den senare aspekten som visade sig vara avgörande. Varken … eller förnekar båda aspekterna, men en aspekt som reformen inte gällde kan inte ha varit avgörande för den. Ju … desto kräver komparativer och uttrycker ett proportionellt samband, så det fungerar inte framför två substantivfraser. Antingen … eller ställer aspekterna mot varandra som ett val och lämnar öppet vilken som gäller, vilket inte går ihop med att den senare sägs vara avgörande.',
     'agreed', null),
    ('mek-29',
     -- före
     'Välj det alternativ som bäst fyller i luckorna.', '8956a9d134959c1b79821362a5c4d682', '["varken / eller","både / och","såväl / som","dels / dels"]'::jsonb, 0,
     'Varken … eller krävs för att negera båda leden samtidigt. Både … och skulle bekräfta att båda leden gäller, det motsatta. Såväl … som bekräftar likaså båda leden. Dels … dels räknar upp sanna omständigheter utan negation.',
     -- efter
     'Välj det alternativ som bäst fyller i luckorna.', 'Rapporten ger ____ en entydig rekommendation ____ en klar tidsplan för genomförandet, så beslutsfattarna står utan vägledning.', '["varken / eller","både / och","antingen / eller","dels / dels"]'::jsonb, 0,
     'Slutet av meningen, att beslutsfattarna står utan vägledning, visar att rapporten inte ger någon av de två delarna. Varken … eller negerar båda leden och ger därför en logisk mening. Både … och skulle i stället säga att rapporten ger båda delarna, vilket motsäger att beslutsfattarna står utan vägledning. Antingen … eller innebär att rapporten ger en av delarna, och då skulle beslutsfattarna ändå få viss vägledning. Dels … dels räknar också upp båda delarna som något rapporten ger och passar därför inte.',
     'agreed', null),
    ('mek-33',
     -- före
     'Välj det alternativ som bäst fyller i meningen.', '42bb4d93f82118aed7a214f5a2bacfc1', '["till följd av","i stället för","oaktat","till förmån för"]'::jsonb, 0,
     'Till följd av anger orsak, att något inträffar som en konsekvens av något annat. I stället för anger ett utbyte mellan alternativ, inte orsak. Oaktat betyder trots och vänder sambandet till en motsägelse. Till förmån för anger att något gynnas på bekostnad av något annat, en annan relation än ren orsak.',
     -- efter (passage oförändrad)
     'Välj det alternativ som bäst fyller i meningen.', null, '["till följd av","i stället för","oaktat","till förmån för"]'::jsonb, 0,
     'Till följd av anger orsak, att något inträffar som en konsekvens av något annat. I stället för anger ett utbyte mellan alternativ, inte orsak. Oaktat betyder trots och vänder sambandet till en motsägelse. Till förmån för betyder att något eller någon gynnas, vilket är en annan relation än orsak.',
     'agreed', null),
    ('mek-36',
     -- före
     'Välj det alternativ som bäst fyller i meningen.', '08e7c873afdabefafc63953258e30781', '["I enlighet med","Till följd av","Med avseende på","I motsats till"]'::jsonb, 3,
     'I motsats till kontrasterar det aktuella resultatet mot de tidigare prognoserna. I enlighet med skulle i stället ange överensstämmelse, motsatsen till den kontrast som avses. Till följd av anger orsak-verkan, inte en motsättning mellan två uppgifter. Med avseende på pekar bara ut en aspekt utan att uttrycka någon kontrast.',
     -- efter
     'Välj det alternativ som bäst fyller i meningen.', '____ tidigare prognoser om fortsatt tillväxt visade utfallet en tydlig nedgång redan under första kvartalet.', '["I enlighet med","Till följd av","Med avseende på","I motsats till"]'::jsonb, 3,
     'Prognoserna förutsåg fortsatt tillväxt, men utfallet visade en nedgång. I motsats till markerar just den kontrasten mellan prognos och utfall. I enlighet med skulle i stället betyda att utfallet stämde med prognoserna, vilket det inte gjorde. Till följd av anger orsak, men prognoserna orsakade inte nedgången. Med avseende på pekar bara ut en aspekt utan att uttrycka någon kontrast.',
     'agreed', null),
    ('mek-37',
     -- före
     'Välj det alternativ som bäst fyller i meningen.', 'ecf75001dd399339f311e1bdf1cc9627', '["med undantag av","till följd av","i stället för","på grund av"]'::jsonb, 0,
     'Med undantag av avgränsar tre kommuner från resten av en större grupp. Till följd av anger orsak, inte en avgränsning av vissa enheter. I stället för anger utbyte mellan alternativ, inte undantag från en grupp. På grund av anger likaså orsak, vilket inte matchar en avgränsande betydelse.',
     -- efter
     'Välj det alternativ som bäst fyller i meningen.', 'Alla kommuner, ____ tre glesbygdskommuner, nådde målet inom utsatt tid.', '["med undantag av","till följd av","i stället för","på grund av"]'::jsonb, 0,
     'Med undantag av anger att tre kommuner inte omfattas av det som sägs om alla kommuner, alltså att just de inte nådde målet. Till följd av anger orsak, inte en avgränsning av vissa enheter. I stället för anger utbyte mellan alternativ, inte undantag från en grupp. På grund av anger likaså orsak, vilket inte matchar en avgränsande betydelse.',
     'agreed', null),
    ('mek-39',
     -- före
     'Välj det alternativ som bäst fyller i meningen.', '9a75e2095c0541721f9ab6572a4b911d', '["ställa krav","ge uttryck","dra slutsatsen","fatta intresse"]'::jsonb, 2,
     'Dra slutsatsen (att) är den fasta kollokationen för att ange vad ett resonemang mynnar ut i. Ställa krav handlar om att kräva något, inte om att komma fram till en slutsats. Ge uttryck (för) kräver en annan preposition och en annan betydelse, att visa en känsla eller åsikt. Fatta intresse betyder att bli intresserad, vilket inte hör ihop med att dra en slutsats.',
     -- efter (passage oförändrad)
     'Välj det alternativ som bäst fyller i meningen.', null, '["ställa krav","ge uttryck","dra slutsatsen","fatta intresse"]'::jsonb, 2,
     'Dra slutsatsen (att) är den fasta kollokationen för att ange vad ett resonemang mynnar ut i. Ställa krav handlar om att kräva något, inte om att komma fram till en slutsats. Ge uttryck kräver prepositionen för och betyder att visa en känsla eller åsikt, inte att komma fram till en slutsats. Fatta intresse betyder att bli intresserad, vilket inte hör ihop med att dra en slutsats.',
     'agreed', null),
    ('mek-40',
     -- före
     'Välj det alternativ som bäst fyller i meningen.', 'c8697a1ddd68bb4cb157cc5206f9116f', '["ställer krav på","tar hänsyn till","drar slutsatsen av","ger uttryck för"]'::jsonb, 3,
     'Ge uttryck för är den fasta kollokationen för att visa eller förmedla en känsla eller uppfattning. Ställer krav på handlar om att kräva något, en annan innebörd. Tar hänsyn till betyder att beakta något, inte att förmedla en uppfattning. Drar slutsatsen av anger att komma fram till en slutsats genom något, inte att uttrycka en känsla.',
     -- efter
     'Välj det alternativ som bäst fyller i meningen.', 'Författaren ____ sin oro för att debatten förenklas, och det redan i förordet.', '["ställer krav på","tar hänsyn till","drar slutsatsen av","ger uttryck för"]'::jsonb, 3,
     'Ge uttryck för är den fasta kollokationen för att visa eller förmedla en känsla eller uppfattning, här författarens oro. Ställer krav på handlar om att kräva något, en annan innebörd. Tar hänsyn till betyder att beakta något, inte att förmedla en uppfattning. Drar slutsatsen av anger att komma fram till en slutsats utifrån något, inte att uttrycka en känsla.',
     'agreed', null),
    ('mek-43',
     -- före
     'Välj det alternativ som bäst fyller i meningen.', '8a1e2971f94c07727aadde171b46cdcb', '["i synnerhet","i stället","i hög grad","i enlighet"]'::jsonb, 2,
     '"I hög grad" betyder i stor utsträckning och passar därför som gradmarkör i meningen. "I synnerhet" lyfter fram ett särskilt fall snarare än att ange grad. "I stället" anger ersättning, inte omfattning. "I enlighet" kräver kompletteringen "med" och betyder överensstämmelse, inte grad.',
     -- efter (passage oförändrad)
     'Välj det alternativ som bäst fyller i meningen.', null, '["i gengäld","i stället","i hög grad","i enlighet"]'::jsonb, 2,
     '"I hög grad" betyder i stor utsträckning och anger hur starkt osäkerheten beror på urvalets storlek. "I gengäld" betyder som motprestation eller å andra sidan och förutsätter något i texten som det vägs mot, vilket saknas här. "I stället" anger ersättning och förutsätter också något som ersätts. "I enlighet" kräver kompletteringen "med" och betyder överensstämmelse, inte grad.',
     'agreed', null),
    ('mek-50',
     -- före
     'Välj det alternativ som bäst fyller i meningen.', '7398b1709b4761b7e69130100a63a2c9', '["därför att","fastän","så att","för att"]'::jsonb, 1,
     '"Fastän" inför ett medgivande som ändå inte upphäver huvudsatsen, vilket är den logiska relationen i meningen. "Därför att" anger en orsak, inte ett medgivande. "Så att" anger en följd eller ett syfte, vilket inte matchar sammanhanget. "För att" anger ett syfte, vilket inte fyller samma funktion som ett medgivande.',
     -- efter (passage oförändrad)
     'Välj det alternativ som bäst fyller i meningen.', null, '["därför att","fastän","så att","för att"]'::jsonb, 1,
     '"Fastän" inför ett medgivande som ändå inte upphäver huvudsatsen, vilket är den logiska relationen i meningen. "Därför att" anger en orsak, inte ett medgivande. "Så att" anger en följd eller ett syfte, vilket inte matchar sammanhanget. "För att" följt av en hel sats anger här en orsak, precis som "därför att", och inte ett medgivande.',
     'agreed', null),
    ('mek-52',
     -- före
     'Välj det alternativ som bäst fyller i meningen.', 'a38c8c8ec65160cc51fcff088a6d193a', '["trots att","oaktat att","även om","förutsatt att"]'::jsonb, 3,
     '"Förutsatt att" sätter ett tydligt villkor för att generaliseringen ska gälla, vilket matchar meningens logik. "Trots att" inför ett medgivande utan att ange något villkor. "Oaktat att" har samma medgivande betydelse och passar därför inte. "Även om" är också ett medgivande snarare än ett villkor för giltighet.',
     -- efter (passage oförändrad)
     'Välj det alternativ som bäst fyller i meningen.', null, '["trots att","så att","även om","förutsatt att"]'::jsonb, 3,
     '"Förutsatt att" sätter ett villkor för att generaliseringen ska gälla, vilket matchar meningens logik. "Trots att" inför ett medgivande, men att mätfelet inte återkommer talar för en generalisering, inte emot den. "Så att" anger följd eller syfte, men en generalisering kan inte göra att mätfelet uteblir i nya stickprov. "Även om" uttrycker också ett medgivande och ger samma ologiska samband som "trots att".',
     'agreed', null),
    ('mek-42',
     -- före
     'Välj det alternativ som bäst fyller i meningen.', 'd0816f41e9b583c09cab6ab0da95350a', '["tog hänsyn","ställde krav på","fattade intresse för","gav avkall"]'::jsonb, 1,
     'Kollokationen "ställa krav på" är den naturliga verbfrasen när någon kräver något av någon annan. "Tog hänsyn" betyder att beakta något, vilket är en annan handling än att kräva. "Fattade intresse för" betyder att bli intresserad, vilket har en helt annan innebörd. "Gav avkall" betyder att offra eller minska på något, alltså motsatt riktning mot att ställa krav.',
     -- efter
     'Välj det alternativ som bäst fyller i meningen.', 'Tillsynsmyndigheten ____ noggrannare redovisning av biverkningar.', '["tog hänsyn","ställde krav på","fattade intresse för","gav avkall"]'::jsonb, 1,
     'Kollokationen ”ställa krav på” är den naturliga verbfrasen när en myndighet kräver något av dem den granskar, här en noggrannare redovisning. Komparativen ”noggrannare” visar att myndigheten ville ha en bättre redovisning än den som fanns, alltså ett krav på förbättring. ”Tog hänsyn” betyder att beakta något, vilket är en annan handling än att kräva, och saknar dessutom prepositionen ”till”. ”Fattade intresse för” betyder att bli intresserad av något. Det säger inget om att myndigheten ville åstadkomma en förbättring och passar därför dåligt ihop med ”noggrannare”. ”Gav avkall” saknar prepositionen ”på”, och ”ge avkall på” betyder att avstå från något, alltså motsatt riktning mot att ställa krav.',
     'agreed', null),
    ('mek-54',
     -- före
     'Välj det alternativ som bäst fyller i meningen.', 'bba93e293d6b96c0fc92e82904473709', '["i synnerhet","med andra ord","oaktat","respektive"]'::jsonb, 1,
     '"Med andra ord" omformulerar samma poäng med andra ord, vilket är precis den funktionen som krävs här. "I synnerhet" lyfter fram ett specifikt exempel, inte en omformulering. "Oaktat" betyder trots, en helt annan betydelse. "Respektive" används vid uppräkningar och fyller inte samma funktion som en omformulering.',
     -- efter
     'Välj det alternativ som bäst fyller i meningen.', 'Kostnaderna skenade; det saknades ____ en realistisk riskbuffert från början.', '["följaktligen","nämligen","oaktat","respektive"]'::jsonb, 1,
     '"Nämligen" inleder en förklaring: att det saknades en realistisk riskbuffert från början anger varför kostnaderna skenade. "Följaktligen" skulle i stället göra bristen på riskbuffert till en följd av att kostnaderna skenade, men bufferten saknades redan från början, så sambandet går åt andra hållet. "Oaktat" betyder trots och är en preposition som inte kan stå här. "Respektive" används för att para ihop led i uppräkningar och fungerar inte heller.',
     'agreed', null),
    ('mek-55',
     -- före
     'Välj det alternativ som bäst fyller i luckorna.', '8b667215210ef46563154272804f179e', '["både / och","såväl / som","inte / utan","varken / eller"]'::jsonb, 2,
     '"Inte … utan" korrigerar ett påstående till ett annat och markerar att det är det senare ledet som är det egentliga problemet. "Både … och" anger addition av två saker som båda gäller, inte en korrigering. "Såväl … som" fyller samma additiva funktion och passar inte för att ersätta ett påstående med ett annat. "Varken … eller" nekar båda alternativen samtidigt, vilket inte stämmer med att ett av dem faktiskt gäller.',
     -- efter
     'Välj det alternativ som bäst fyller i luckorna.', 'Problemet är ____ bristen på data ____ bristen på en gemensam definition: det finns gott om data, men studierna använder begreppen på olika sätt.', '["både / och","såväl / som","inte / utan","varken / eller"]'::jsonb, 2,
     '"Inte … utan" avvisar det första ledet och pekar ut det andra som det egentliga problemet, och det stämmer med texten efter kolonet: det finns gott om data, men studierna använder begreppen på olika sätt. "Både … och" och "såväl … som" betyder samma sak och skulle göra även bristen på data till ett problem, vilket motsägs av att det finns gott om data. "Varken … eller" avvisar båda leden, men att studierna använder begreppen på olika sätt är just en brist på gemensam definition.',
     'agreed', null),
    ('mek-56',
     -- före
     'Välj det alternativ som bäst fyller i luckorna.', '884a0be2ce55cb93ba1bcc5bb5211cd9', '["Så / att","Varken / eller","Dels / dels","Ju / desto"]'::jsonb, 3,
     '"Ju … desto" uttrycker en omvänd proportionalitet: ju mer komplexitet, desto färre som klarar kraven, vilket stämmer med meningens innehåll. "Så … att" anger en följdkonstruktion, inte en proportionalitet mellan två storheter. "Varken … eller" nekar båda leden och passar inte här. "Dels … dels" räknar bara upp led utan att uttrycka något samband mellan grader.',
     -- efter (passage oförändrad)
     'Välj det alternativ som bäst fyller i luckorna.', null, '["Så / att","Varken / eller","Dels / dels","Ju / desto"]'::jsonb, 3,
     '"Ju … desto" knyter ihop två grader som förändras tillsammans, här att ju mer komplext regelverket blev, desto färre små aktörer klarade kraven. "Så … att" anger en följdkonstruktion, inte ett samband mellan två grader. "Varken … eller" nekar båda leden och passar inte här. "Dels … dels" räknar bara upp led utan att uttrycka något samband mellan grader.',
     'agreed', null),
    ('mek-57',
     -- före
     'Välj det alternativ som bäst fyller i luckorna.', 'ce1f43ad39eebc92aa42396e8113f83a', '["dels / dels","varken / eller","antingen / eller","ju / desto"]'::jsonb, 0,
     '"Dels … dels" räknar upp två kompletterande delar som tillsammans utgör helheten, vilket matchar meningens uppbyggnad. "Varken … eller" nekar båda leden, vilket är motsatt logik. "Antingen … eller" anger två ömsesidigt uteslutande alternativ, inte två samtidigt gällande delar. "Ju … desto" uttrycker proportionalitet och passar inte för en enkel uppräkning.',
     -- efter
     'Välj det alternativ som bäst fyller i luckorna.', 'Strategin vilar ____ på styrmedel, ____ på frivilliga överenskommelser med branschen, och de två ska komplettera varandra.', '["dels / dels","varken / eller","antingen / eller","ju / desto"]'::jsonb, 0,
     '"Dels … dels" räknar upp två delar som gäller samtidigt, vilket stämmer med att de två ska komplettera varandra. "Varken … eller" nekar båda leden, och då finns det inget som kan komplettera varandra. "Antingen … eller" anger två ömsesidigt uteslutande alternativ, inte två delar som gäller samtidigt. "Ju … desto" uttrycker ett samband mellan grader och passar inte för en enkel uppräkning.',
     'agreed', null),
    ('mek-58',
     -- före
     'Välj det alternativ som bäst fyller i luckorna.', '1ca9a704cb01daf46c4e94368695c484', '["varken / eller","både / och","antingen / eller","så / att"]'::jsonb, 1,
     '"Både … och" täcker två aspekter samtidigt, vilket är den logik meningen bygger på. "Varken … eller" utesluter båda aspekterna, alltså motsatt betydelse. "Antingen … eller" anger att bara en av aspekterna gäller, inte båda. "Så … att" anger en följdkonstruktion och fyller inte samma funktion som en dubbel bekräftelse.',
     -- efter
     'Välj det alternativ som bäst fyller i luckorna.', 'Utvärderingen belyser ____ genomförandet ____ de långsiktiga effekterna och ger därmed en heltäckande bild av programmet.', '["varken / eller","både / och","antingen / eller","så / att"]'::jsonb, 1,
     '"Både … och" anger att båda aspekterna belyses, och det krävs för att utvärderingen ska ge en heltäckande bild. "Varken … eller" utesluter båda aspekterna, och då kan bilden inte vara heltäckande. "Antingen … eller" anger att bara en av aspekterna belyses, inte båda. "Så … att" anger en följd och ger ingen grammatisk mening här.',
     'agreed', null),
    ('mek-60',
     -- före
     'Välj det alternativ som bäst fyller i meningen.', 'dc0c058520e6be542b994a0709ad60a3', '["ställde in","tog avstånd","fäste avseende","lade fram"]'::jsonb, 3,
     '"Lade fram" är den etablerade kollokationen för att presentera en hypotes eller ett förslag, vilket stämmer med sammanhanget. "Ställde in" betyder att avboka något, en helt annan betydelse. "Tog avstånd" betyder att markera oenighet med något, inte att presentera det. "Fäste avseende" är en ovanlig och felaktig kollokation som inte hör ihop med att lägga fram en hypotes.',
     -- efter (passage oförändrad)
     'Välj det alternativ som bäst fyller i meningen.', null, '["ställde in","tog avstånd","fäste avseende","lade fram"]'::jsonb, 3,
     '"Lade fram" är den etablerade kollokationen för att presentera en hypotes eller ett förslag, vilket stämmer med sammanhanget. "Ställde in" betyder att avboka något, en helt annan betydelse. "Tog avstånd" betyder att markera oenighet med något, inte att presentera det. "Fäste avseende" hör till det formella uttrycket "fästa avseende vid", som betyder beakta, och kan inte användas om att lägga fram en hypotes.',
     'agreed', null),
    ('mek-65',
     -- före
     'Välj det alternativ som bäst fyller i meningen.', '3de389a17e61ee6db21806b857c721cb', '["Under","Oaktat","Till följd","I enlighet"]'::jsonb, 0,
     '"Under" anger en tidsrymd, det vill säga medan förhandlingarna pågick, vilket är den betydelse meningen behöver. "Oaktat" betyder trots, vilket är en annan relation. "Till följd" anger en orsak och kräver dessutom kompletteringen "av", vilket inte passar tidsangivelsen. "I enlighet" anger överensstämmelse, inte tidsrymd.',
     -- efter (passage oförändrad)
     'Välj det alternativ som bäst fyller i meningen.', null, '["Under","Oaktat","Till förmån för","I enlighet med"]'::jsonb, 0,
     '”Under” anger en tidsrymd, alltså medan förhandlingarna pågick. Det är den betydelse meningen behöver: att parterna inte lämnade bordet visar att tonen skärptes vid själva förhandlingsbordet, och ”men” ställer den hårdare tonen mot att parterna ändå stannade kvar. ”Oaktat” betyder trots och skulle framställa förhandlingarna som något som borde ha hindrat tonen från att skärpas. Fortsättningen om bordet visar dock att meningen beskriver vad som hände medan förhandlingarna pågick, och då behövs en tidsangivelse, inte ett medgivande. ”Till förmån för” anger att något gynnas, vilket saknar mening här. ”I enlighet med” anger överensstämmelse, inte tidsrymd.',
     'agreed', null),
    ('mek-67',
     -- före
     'Välj det alternativ som bäst fyller i meningen.', '93f01513ff81971fef60e18d6e468bef', '["respektive","således","medan","dessutom"]'::jsonb, 2,
     '"Medan" kontrasterar de två skolorna mot varandra, vilket är den relation meningen beskriver. "Respektive" används vid uppräkningar för att para ihop led, inte som kontrasterande konjunktion. "Således" anger en slutsats, inte en kontrast. "Dessutom" anger ett tillägg, vilket inte stämmer med att ställa två skolor mot varandra.',
     -- efter
     'Välj det alternativ som bäst fyller i meningen.', 'Den ena skolan betonar struktur, ____ den andra lägger tonvikten vid aktörers handlingsutrymme.', '["respektive","således","medan","dessutom"]'::jsonb, 2,
     '"Medan" ställer de två skolorna mot varandra: den ena betonar struktur, den andra lägger tonvikten vid aktörers handlingsutrymme. "Respektive" används vid uppräkningar för att para ihop led, inte som kontrasterande konjunktion. "Således" anger en slutsats, inte en kontrast. "Dessutom" anger ett tillägg, vilket inte stämmer med att ställa två skolor mot varandra.',
     'agreed', null),
    ('mek-68',
     -- före
     'Välj det alternativ som bäst fyller i meningen.', '706f935bb4e61170e4cd639b19f88604', '["oaktat","emellertid","nämligen","alltså"]'::jsonb, 3,
     '"Alltså" preciserar var skillnaden ligger som en slutsats av det tidigare sagda, vilket matchar meningens logik. "Oaktat" betyder trots, en helt annan betydelse. "Emellertid" anger en kontrast snarare än en slutsats. "Nämligen" specificerar en orsak men drar inte samma slutsats som "alltså" gör här.',
     -- efter
     'Välj det alternativ som bäst fyller i meningen.', 'Premisserna är desamma i båda modellerna. Den skillnad som finns måste ____ bero på hur osäkerhet hanteras.', '["oaktat","likaledes","nämligen","alltså"]'::jsonb, 3,
     '"Alltså" markerar en slutsats: när premisserna är desamma måste skillnaden mellan modellerna bero på något annat, och meningen säger vad. "Nämligen" inleder en förklaring till det som just sagts, men att skillnaden beror på hur osäkerhet hanteras förklarar inte varför premisserna är desamma; det är en slutsats av det. "Likaledes" betyder på samma sätt och förutsätter att något likadant redan har nämnts. "Oaktat" betyder trots och är en preposition som måste följas av det den gäller, till exempel "oaktat detta", så den passar inte här.',
     'agreed', null),
    ('mek-71',
     -- före
     'Välj det alternativ som bäst fyller i meningen.', '1127939b2265b69372eda5c84a03ce4c', '["Oaktat","Till följd av","I ljuset av","På bekostnad av"]'::jsonb, 2,
     '"I ljuset av" betyder med de nya rönen som bakgrund, vilket är den innebörd meningen kräver. "Oaktat" betyder trots, en helt annan relation. "Till följd av" anger ett mer direkt kausalt samband än det stödjande sammanhang som avses. "På bekostnad av" betyder att något offras för något annat, vilket inte stämmer med att ge en bakgrund.',
     -- efter (passage oförändrad)
     'Välj det alternativ som bäst fyller i meningen.', null, '["Oaktat","Till följd av","I ljuset av","På bekostnad av"]'::jsonb, 2,
     '"I ljuset av" betyder med de nya rönen som bakgrund, vilket är den innebörd meningen kräver. "Oaktat" betyder trots, en helt annan relation. "Till följd av" anger en direkt orsak till en händelse, men här handlar det om hur rekommendationen ter sig när den ses i ett nytt perspektiv. "På bekostnad av" betyder att något offras för något annat, vilket inte stämmer med att ge en bakgrund.',
     'agreed', null),
    ('mek-76',
     -- före
     'Välj det alternativ som bäst fyller i luckorna.', 'c70e2d01e72606e5d825fab396e8844f', '["varken / eller","antingen / eller","ju / desto","såväl / som"]'::jsonb, 3,
     '"Såväl … som" inkluderar båda grupperna samtidigt, vilket är den betydelse meningen kräver. "Varken … eller" utesluter båda grupperna, motsatt betydelse. "Antingen … eller" anger att bara en av grupperna gäller. "Ju … desto" uttrycker proportionalitet och saknar den inkluderande funktionen helt.',
     -- efter
     'Välj det alternativ som bäst fyller i luckorna.', 'Åtgärden berör ____ hushållen ____ de mindre företagen i innerstaden, så båda grupperna måste anpassa sig.', '["varken / eller","antingen / eller","ju / desto","såväl / som"]'::jsonb, 3,
     '"Såväl … som" anger att åtgärden berör båda grupperna, vilket stämmer med att båda måste anpassa sig. "Varken … eller" utesluter båda grupperna, och då skulle ingen av dem behöva anpassa sig. "Antingen … eller" anger att bara en av grupperna berörs, inte båda. "Ju … desto" uttrycker proportionalitet och saknar den inkluderande funktionen helt.',
     'agreed', null),
    ('mek-78',
     -- före
     'Välj det alternativ som bäst fyller i meningen.', '412cb0583bd56c93959125a48d1aafdd', '["backar","avhåller","köttar","svävar"]'::jsonb, 1,
     '"Avhåller" hör till uttrycket "avhålla sig från" och passar det formella registret i meningen. "Backar" är vardagligt och beskriver en annan, mer konkret handling. "Köttar" är talspråklig slang som inte hör hemma i en formell text. "Svävar" betyder att vara osäker eller obestämd, vilket inte matchar betydelsen att avstå från något.',
     -- efter (passage oförändrad)
     'Välj det alternativ som bäst fyller i meningen.', null, '["backar","avhåller","köttar","svävar"]'::jsonb, 1,
     '"Avhåller" hör till uttrycket "avhålla sig från" och passar det formella registret i meningen. "Backar" kan inte stå med "sig": man backar från något, men "backar sig från" går inte. "Köttar" är talspråklig slang som inte hör hemma i en formell text. "Svävar" betyder att vara osäker eller obestämd, vilket inte matchar betydelsen att avstå från något.',
     'agreed', null),
    ('mek-80',
     -- före
     'Välj det alternativ som bäst fyller i luckorna.', '2ad4b8a44d6620c4a32900b3460ff1c0', '["varken / eller","antingen / eller","dels / dels","inte bara / utan även"]'::jsonb, 3,
     '"Inte bara … utan även" utvidgar påståendet till att gälla mer än bara det tekniska, vilket är den betydelse meningen kräver. "Varken … eller" nekar båda leden, motsatt den utvidgande betydelsen. "Antingen … eller" anger ett ömsesidigt uteslutande val, inte en utvidgning. "Dels … dels" räknar bara upp led utan den gradvisa utvidgning som "inte bara … utan även" uttrycker.',
     -- efter (passage oförändrad)
     'Välj det alternativ som bäst fyller i luckorna.', null, '["varken / eller","antingen / eller","ju / desto","inte bara / utan även"]'::jsonb, 3,
     '"Inte bara … utan även" anger att förändringen gick utöver det tekniska, och det visar texten efter kolonet: de nya rutinerna krävde en ny ansvarsfördelning. "Varken … eller" nekar båda leden, vilket motsägs av att ansvarsfördelningen måste ändras. "Antingen … eller" anger att bara det ena gäller, inte båda. "Ju … desto" kräver komparativ, till exempel "ju mer …, desto …", och ger här ingen grammatisk mening.',
     'agreed', null),
    ('ovn-las-003',
     -- före
     'Vilken slutsats kan man dra av texten?', 'b4efce26df64967ed69c9cf0a1c22d28', '["Röda löv har sannolikt kvar mer kväve när de fälls än gula, eftersom det röda skyddar dem.","Soliga höstar för troligen tillbaka mer näring till trädet än mulna, eftersom löven då blir rödare.","Ett träd som får röda löv lägger mindre resurser på sina blad under hösten än ett träd som får gula.","Ett träd vars löv fälls medan de ännu är gröna förlorar näring som det annars kunnat ta tillvara."]'::jsonb, 3,
     'Enligt texten monteras bladets fotosyntesapparat ned innan bladet fälls, och näringen förs in i grenar och stam för att användas igen nästa vår; det gula lövet beskrivs som ”ett blad som håller på att tömmas”. Ett löv som faller medan det ännu är grönt har alltså inte tömts, och trädet förlorar då näring som det annars kunnat ta tillvara. Att röda löv skulle ha mer kväve kvar vänder på sambandet, eftersom det röda enligt solskyddsförklaringen skyddar bladet just medan näringen förs ut. Att soliga höstar skulle ge tillbaka mer näring har inget stöd, eftersom texten bara säger att de ger rödare löv. Att träd med röda löv skulle lägga mindre resurser på bladen motsägs av att antocyaninerna beskrivs som en satsning på något nytt i ett skede då trädet annars sparar.',
     -- efter (passage oförändrad)
     'Vilken slutsats kan man dra av texten?', null, '["Röda löv har sannolikt kvar mer kväve när de fälls än gula, eftersom det röda skyddar dem.","Soliga höstar för troligen tillbaka mer näring till trädet än mulna, eftersom löven då blir rödare.","Ett träd som får röda löv lägger mindre resurser på sina blad under hösten än ett träd som får gula.","Ett träd vars löv fälls medan de ännu är gröna förlorar näring som det annars kunnat ta tillvara."]'::jsonb, 3,
     'Enligt texten är klorofyllet bundet till kvävehaltiga proteiner, och innan bladet fälls monteras fotosyntesapparaten ned och näringen förs in i grenar och stam för att användas igen nästa vår; det gula lövet beskrivs som ”ett blad som håller på att tömmas”. Ett löv som faller medan det ännu är grönt har kvar sitt klorofyll och har alltså inte hunnit tömmas, så trädet förlorar näring som det annars kunnat ta tillvara. Att röda löv skulle ha mer kväve kvar vänder på sambandet, eftersom det röda enligt solskyddsförklaringen skyddar bladet just medan näringen förs ut. Att soliga höstar skulle föra tillbaka mer näring har inget stöd: det röda skyddar enligt texten mot det starka ljus som klara dagar för med sig, och under en mulen höst utsätts bladen inte för samma ljus, så rödare löv visar inte att mer näring tas tillvara. Att träd med röda löv skulle lägga mindre resurser på bladen motsägs av att antocyaninerna beskrivs som en satsning på något nytt i ett skede då trädet annars sparar.',
     'agreed', null),
    ('ovn-las-007',
     -- före
     'Vilken roll spelar jämförelsen med opinionsmätningar i författarens resonemang?', '716425f03e7a3f7afa82c6ed4b355c28', '["Den visar att råden är mer representativa än de urval som opinionsmätningar bygger på.","Den lyfter fram något som råden kan visa men som mätningar av spontana åsikter missar.","Den förklarar varför politiker sällan vågar lägga fram djärva förslag.","Den stöder invändningen att ingen kan ställas till svars för rådens förslag."]'::jsonb, 1,
     'Författaren skriver att råden kan visa vad vanliga människor kommer fram till när de har fått tid och kunskap, något som opinionsmätningar, där man svarar ”på stående fot”, aldrig kan fånga; jämförelsen ringar alltså in rådens särskilda bidrag. Att råden skulle vara mer representativa än opinionsmätningarnas urval sägs inte; representativiteten tas upp som förespråkarnas argument och jämförs då med parlamentet. Att politiker sällan vågar lägga fram djärva förslag nämns i ett annat stycke och förklaras inte med hjälp av opinionsmätningarna. Jämförelsen hör till det stycke där författaren försvarar rådens värde, inte till invändningen om att ingen kan ställas till svars.',
     -- efter (passage oförändrad)
     'Vilken roll spelar jämförelsen med opinionsmätningar i författarens resonemang?', null, '["Den visar att råden är mer representativa än de urval som opinionsmätningar bygger på.","Den lyfter fram något som råden kan visa men som mätningar av spontana åsikter missar.","Den förklarar varför politiker sällan vågar lägga fram djärva förslag.","Den stöder invändningen att ingen kan ställas till svars för rådens förslag."]'::jsonb, 1,
     'Författaren skriver att råden kan visa vad vanliga människor kommer fram till när de har fått tid och kunskap, något som opinionsmätningar, där man svarar ”på stående fot”, aldrig kan fånga; jämförelsen ringar alltså in rådens särskilda bidrag. Att råden skulle vara mer representativa än opinionsmätningarnas urval sägs inte; representativiteten tas upp som förespråkarnas argument och jämförs då med parlamentet. Jämförelsen förklarar inte heller varför politiker sällan vågar lägga fram djärva förslag: att rådens besked kan ge politiker mod nämns visserligen i meningen efter, men som en följd av det råden kan visa, inte som en förklaring till varför politiker saknar mod. Jämförelsen hör till det stycke där författaren försvarar rådens värde, inte till invändningen om att ingen kan ställas till svars.',
     'agreed', null),
    ('ovn-las-012',
     -- före
     'Vad är det enligt texten som gör att även de bästa vitsorden i husförhören säger förhållandevis lite om förmågan att läsa en okänd text?', '5e7be19e6ab8c7b1047c98d371fe3f45', '["Att prövningen gällde ett fåtal texter som deltagarna redan kände väl.","Att många som läste obehindrat i psalmboken knappt kunde skriva sitt namn.","Att prästerna på många håll skilde mellan läsning i bok och utantillkunskap.","Att längderna bara finns bevarade i en del av landets socknar."]'::jsonb, 0,
     'Författaren skriver att texterna i husförhören var få och välbekanta, och att även de bästa vitsorden därför säger mer om förtrogenhet med ett begränsat antal texter än om förmågan att ta sig an en okänd text. Att många som läste obehindrat knappt kunde skriva stämmer enligt texten, men det gäller skillnaden mellan läsning och skrivning, inte vad läsvitsorden säger. Att prästerna skilde mellan läsning i bok och utantillkunskap stämmer också, men det framställs som ett försök att hantera problemet, och meningen därefter inleds med ”Men även de bästa vitsorden”. Att längderna inte finns bevarade överallt kan man ana av texten, men det har inget med vitsordens innebörd att göra.',
     -- efter (passage oförändrad)
     'Vad är det enligt texten som gör att även de bästa vitsorden i husförhören säger förhållandevis lite om förmågan att läsa en okänd text?', null, '["Att prövningen gällde ett fåtal texter som deltagarna redan kände väl.","Att många som läste obehindrat i psalmboken knappt kunde skriva sitt namn.","Att prästerna sällan skilde mellan läsning i bok och utantillkunskap.","Att längderna bara finns bevarade i en del av landets socknar."]'::jsonb, 0,
     'Författaren skriver att texterna i husförhören var få och välbekanta, och att även de bästa vitsorden därför säger mer om förtrogenhet med ett begränsat antal texter än om förmågan att ta sig an en okänd text. Att många som läste obehindrat knappt kunde skriva stämmer enligt texten, men det gäller skillnaden mellan läsning och skrivning, inte vad läsvitsorden säger. Att prästerna sällan skulle ha skilt mellan läsning i bok och utantillkunskap stämmer inte: enligt texten gjorde man den åtskillnaden på många håll, men även de bästa vitsorden gällde ändå ett fåtal välbekanta texter. Att längderna inte finns bevarade överallt kan man ana av texten, men det har inget med vitsordens innebörd att göra.',
     'agreed', null),
    ('ovn-las-020',
     -- före
     'Vad vill författaren visa med exemplet med forskaren som har skrivit sin avhandling på engelska?', '102756b2e8a7262115fcf311c1b3ee54', '["Att forskare som skriver på engelska förlorar förmågan att uttrycka sig på svenska i allmänhet.","Att det främst är journalister och lärare som får bära följderna av domänförlust.","Att domänförlust kan gå obemärkt förbi ända tills ämnet ska behandlas på svenska.","Att avhandlingar på engelska sällan når någon utanför den egna forskarvärlden."]'::jsonb, 2,
     'Exemplet inleds med att ”följderna märks inte genast”: forskaren klarar sig utmärkt i sitt arbete, och problemet uppstår först när hon ska förklara, undervisa eller debattera på svenska och märker att hon saknar orden. Texten säger inte att hon förlorar förmågan att uttrycka sig på svenska i allmänhet, bara att hon saknar orden när hon ska tala om sina resultat. Journalisten och gymnasieklassen nämns som exempel på sammanhang där bristen visar sig, men det är forskaren som saknar orden. Att avhandlingar på engelska sällan når utanför forskarvärlden sägs inte.',
     -- efter (passage oförändrad)
     'Vad vill författaren visa med exemplet med forskaren som har skrivit sin avhandling på engelska?', null, '["Att forskare som skriver på engelska förlorar förmågan att uttrycka sig på svenska i allmänhet.","Att det främst är journalister och lärare som får bära följderna av domänförlust.","Att domänförlust kan gå obemärkt förbi ända tills ämnet ska behandlas på svenska.","Att avhandlingar på engelska sällan når någon utanför den egna forskarvärlden."]'::jsonb, 2,
     'Stycket med exemplet inleds med konstaterandet att följderna inte märks genast: forskaren klarar sig utmärkt i sitt arbete, och problemet uppstår först när hon ska förklara, undervisa eller debattera på svenska och märker att hon saknar orden. Texten säger inte att hon förlorar förmågan att uttrycka sig på svenska i allmänhet, bara att hon saknar orden när hon ska tala om sitt ämne. Journalisten och gymnasieklassen nämns som exempel på sammanhang där bristen visar sig, men det är forskaren som saknar orden. Att avhandlingar på engelska sällan når utanför forskarvärlden sägs inte.',
     'agreed', null),
    ('ovn-las-009',
     -- före
     'Vilket av följande sammanfattar bäst textens huvudtanke?', '5e7be19e6ab8c7b1047c98d371fe3f45', '["Den tidiga svenska läskunnigheten har överdrivits, eftersom husförhörslängderna är opålitliga.","Svenskarna lärde sig tidigt läsa, men eftersom få kunde skriva hade läsningen liten praktisk betydelse.","Svenskarna kunde tidigt läsa, men det innebar något annat än vad vi i dag menar med att läsa.","Husförhörslängderna visar att de flesta svenskar kunde både läsa och skriva redan på 1700-talet."]'::jsonb, 2,
     'Författaren skriver att bilden av ett tidigt läsande folk är ”inte felaktig” men behöver preciseras: läsningen var skild från skrivandet, gällde få och välbekanta texter och var något annat än det som dagens läsforskning frågar efter. Texten påstår inte att läskunnigheten har överdrivits eller att längderna är opålitliga, utan kallar dem ”en ovärderlig källa”. Att många knappt kunde skriva stämmer, men författaren betonar i fjärde stycket att kyrkans läsundervisning tvärtom hade stor betydelse. Att de flesta kunde både läsa och skriva motsägs av att kyrkan krävde läsning, inte skrivning, och att många som läste obehindrat knappt kunde skriva sitt namn.',
     -- efter (passage oförändrad)
     'Vilket av följande sammanfattar bäst textens huvudtanke?', null, '["Den tidiga svenska läskunnigheten har överdrivits, eftersom husförhörslängderna är opålitliga.","Svenskarna lärde sig tidigt läsa, men eftersom få kunde skriva hade läsningen liten praktisk betydelse.","Svenskarna kunde tidigt läsa, men det innebar något annat än vad vi i dag menar med att läsa.","Husförhörslängderna visar att de flesta svenskar kunde både läsa och skriva redan på 1700-talet."]'::jsonb, 2,
     'Författaren skriver att bilden av ett tidigt läsande folk är ”inte felaktig” men behöver preciseras: läsningen var skild från skrivandet, gällde få och välbekanta texter och var något annat än det som dagens läsforskning frågar efter. Texten påstår inte att läskunnigheten har överdrivits eller att längderna är opålitliga, utan kallar dem ”en ovärderlig källa”. Att många knappt kunde skriva stämmer, men författaren betonar i fjärde stycket att kyrkans läsundervisning tvärtom hade stor betydelse. Att de flesta kunde både läsa och skriva motsägs av att kyrkan krävde läsning, inte skrivning, och att många som läste obehindrat knappt kunde skriva sitt namn.',
     'agreed', null),
    ('ovn-las-031',
     -- före
     'Vilken roll spelar stycket om den andra marknaden i textens resonemang?', '71d4abf432afe2d5fc919c4a04c82140', '["Det visar att kön, trots sina brister, åtminstone håller pengarna utanför frågan om vem som får varan.","Det ger ytterligare ett exempel på att kön gynnar dem som vet hur systemet fungerar och kan utnyttja det.","Det visar att priset slår igenom även när det hålls nere, men mellanskillnaden når inte producenterna.","Det visar att svarthandel med biljetter och kontrakt uppstår först när köerna har blivit orimligt långa."]'::jsonb, 2,
     'Stycket beskriver hur det, när priset hålls under vad människor är beredda att betala, uppstår en andra marknad där någon annan tar ut mellanskillnaden; prismekanismen kommer tillbaka bakvägen, men pengarna hamnar hos andra än dem som skulle kunna öka utbudet. Kön håller alltså inte pengarna utanför; det är bara mellanskillnaden som hamnar hos andra. Att kön gynnar dem som vet hur systemet fungerar sägs i stycket före och är inte detta styckes poäng. Texten säger inte att svarthandel uppstår först när köerna har blivit orimligt långa.',
     -- efter (passage oförändrad)
     'Vilken roll spelar stycket om den andra marknaden i textens resonemang?', null, '["Det visar att kön, trots sina brister, åtminstone håller pengarna utanför frågan om vem som får varan.","Det ger ytterligare ett exempel på att kön gynnar dem som vet hur systemet fungerar och kan utnyttja det.","Det visar att priset slår igenom även när det hålls nere, men mellanskillnaden når inte producenterna.","Det visar att svarthandel med biljetter och kontrakt uppstår först när köerna har blivit orimligt långa."]'::jsonb, 2,
     'Stycket beskriver hur det, när priset hålls under vad människor är beredda att betala, uppstår en andra marknad där någon annan tar ut mellanskillnaden; prismekanismen kommer tillbaka bakvägen, men mellanskillnaden hamnar hos andra än dem som skulle kunna öka utbudet. Kön håller alltså inte pengarna utanför frågan om vem som får varan; via andrahandsmarknaden avgör priset ändå. Att kön gynnar dem som vet hur systemet fungerar sägs i stycket före och är inte detta styckes poäng. Texten säger inte att svarthandel uppstår först när köerna har blivit orimligt långa.',
     'agreed', null),
    ('ovn-las-033',
     -- före
     'Varför menar författaren att kravet i sista stycket är det rätta, trots att det är tyngre att uppfylla?', '8c59ff23a3fde4d397b6e820c4aab2ee', '["Eftersom det gör det svårare att utvidga undantagen, så att preskriptionen behålls för de flesta brott.","Eftersom det tvingar fram ett svar på alla skäl för preskription, inte bara på frågan om bevisning.","Eftersom det bygger på insikten att tekniken inte kan göra tiden ofarlig för bevisningen.","Eftersom det ger samhällets fördömande större vikt än den misstänktes intresse av att lämnas i fred."]'::jsonb, 1,
     'Enligt sista stycket räcker det inte att visa att ett brott går att bevisa lång tid efteråt; man måste visa att skälen för att låta brottet vila inte gäller, och kravet är det enda som ”tar preskriptionens skäl på allvar”. Att kravet gör det svårare att utvidga undantagen stämmer, men författaren nämner det som en kostnad (”tyngre att uppfylla, men”), inte som skälet till att kravet är rätt, och texten säger inte att målet är att behålla preskriptionen. Att tekniken bara delvis gör tiden ofarlig för bevisningen är en del av författarens resonemang i fjärde stycket, men det är inte det som gör kravet rätt. Texten väger inte samhällets fördömande mot den misstänktes intresse av att lämnas i fred.',
     -- efter (passage oförändrad)
     'Varför menar författaren att kravet i sista stycket är det rätta, trots att det är tyngre att uppfylla?', null, '["Eftersom det gör det svårare att utvidga undantagen, så att preskriptionen behålls för de flesta brott.","Eftersom det tvingar fram ett svar på alla skäl för preskription, inte bara på frågan om bevisning.","Eftersom det bygger på insikten att tekniken inte kan göra tiden ofarlig för bevisningen.","Eftersom det ger samhällets fördömande större vikt än den misstänktes intresse av att lämnas i fred."]'::jsonb, 1,
     'Enligt sista stycket räcker det inte att visa att ett brott går att bevisa lång tid efteråt; man måste visa att preskriptionens skäl inte gäller för just det brottet, alltså inte bara skälet som rör bevisningen utan också skälen som rör straffets mening och att låta saker vila. Kravet är det enda som ”tar preskriptionens skäl på allvar”. Att kravet gör det svårare att utvidga undantagen stämmer, men författaren nämner det som en kostnad (”tyngre att uppfylla, men”), inte som skälet till att kravet är rätt, och texten säger inte att målet är att behålla preskriptionen. Att tekniken bara delvis gör tiden ofarlig för bevisningen är en del av författarens resonemang i fjärde stycket, men det är inte det som gör kravet rätt. Texten väger inte samhällets fördömande mot den misstänktes intresse av att lämnas i fred.',
     'agreed', null),
    ('ovn-las-038',
     -- före
     'Vilken funktion fyller exemplet med barnen som vill höra samma saga, sett till texten som helhet?', '5906ca3e43f81c3018af3b59e42cc08e', '["Det visar först hur vuxna ser på omläsning och sedan att förväntan inte kräver ovisshet.","Det visar att barn läser på ett mer ursprungligt sätt än vuxna, eftersom de ännu inte söker det nya.","Det illustrerar att den som bara läser om samma få berättelser har gett upp den glädje som ovetandet ger.","Det visar att läsaren förändras mellan läsningarna, även när texten är exakt densamma som förra gången."]'::jsonb, 0,
     'I inledningen används barnens önskan att höra samma saga för att visa hur vuxna ser på omläsning: som ett stadium man växer ifrån och något som behöver en ursäkt. I sjätte stycket återkommer exemplet: barnet är ”inte likgiltigt för spänning” utan njuter av att vänta på något som det vet ska komma, vilket motsäger tanken i andra stycket att spänningen förutsätter ovisshet. Texten påstår inte att barn läser på ett mer ursprungligt sätt än vuxna. Att den som bara läser om samma få böcker har gett upp ovetandet sägs i sista stycket om vuxna läsare, och att läsaren förändras tas upp i sjunde stycket med en vuxen läsare som exempel.',
     -- efter (passage oförändrad)
     'Vilken funktion fyller exemplet med barnen som vill höra samma saga, sett till texten som helhet?', null, '["Det visar först hur vuxna ser på omläsning och sedan att förväntan inte kräver ovisshet.","Det visar att barn läser på ett mer ursprungligt sätt än vuxna, eftersom de ännu inte söker det nya.","Det illustrerar att den som bara läser om samma få berättelser har gett upp den glädje som ovetandet ger.","Det visar att läsaren förändras mellan läsningarna, även när texten är exakt densamma som förra gången."]'::jsonb, 0,
     'I inledningen används barnens önskan att höra samma saga för att visa hur vuxna ser på omläsning: som ett stadium man växer ifrån och något som behöver en ursäkt. I sjätte stycket återkommer exemplet: barnet är ”inte likgiltigt för spänning” utan njuter av att vänta på något som det vet ska komma, vilket motsäger tanken i andra stycket att spänningen förutsätter ovisshet. Texten påstår inte att barn läser på ett mer ursprungligt sätt än vuxna. Att den som bara läser om samma få böcker har gett upp ovetandet sägs i sista stycket om läsare i allmänhet och knyts inte till barnet, och att läsaren förändras visas i sjunde stycket med romanen som man läser som sjuttonåring och läser om som femtioåring.',
     'agreed', null),
    ('ovn-las-021',
     -- före
     'Vilket av följande skulle enligt resonemanget i fjärde stycket göra överjaktshypotesen mer informativ?', 'd730cfa7e4fefbce9cd4707fb09ac6a9', '["Att man hittade betydligt fler platser där mammutar och mastodonter hade dödats och styckats.","Att hypotesen i förväg angav vilka fynd som skulle tala emot den.","Att dateringarna av människans ankomst till olika områden blev säkrare.","Att hypotesen också kunde förklara varför så få arter försvann i Afrika."]'::jsonb, 1,
     'Författaren invänder att anhängarnas svar gör hypotesen förenlig med både många och få fynd: talrika slaktplatser skulle räknas som bevis och sällsynta som ett väntat utfall. En förklaring som ”klarar sig oavsett vad man hittar löper ingen risk” och säger därför mindre än den verkar göra; den blir mer informativ först om den pekar ut fynd som skulle tala emot den. Fler slaktplatser skulle bara räknas som stöd och ändrar inte detta. Dateringarnas osäkerhet tas upp i ett annat stycke som ett problem för båda sidor, och Afrika förklarar hypotesen redan enligt anhängarna.',
     -- efter (passage oförändrad)
     'Vilket av följande skulle enligt resonemanget i fjärde stycket göra överjaktshypotesen mer informativ?', null, '["Att man hittade betydligt fler platser där mammutar och mastodonter hade dödats och styckats.","Att hypotesen i förväg angav vilka fynd som skulle tala emot den.","Att dateringarna av människans ankomst till olika områden blev säkrare.","Att hypotesen också kunde förklara varför så få arter försvann i Afrika."]'::jsonb, 1,
     'Författaren invänder att anhängarnas svar gör hypotesen förenlig med både många och få fynd: talrika slaktplatser skulle räknas som bevis och sällsynta som ett väntat utfall. En förklaring som ”klarar sig oavsett vad man hittar löper ingen risk” och säger därför mindre än den verkar göra; den blir mer informativ först om den pekar ut fynd som skulle tala emot den. Fler slaktplatser skulle bara räknas som stöd och ändrar inte detta. Dateringarnas osäkerhet tas upp i ett annat stycke som ett problem för båda sidor, och hypotesen förklarar enligt anhängarna redan varför så få arter försvann i Afrika; de räknar det som ett stöd.',
     'agreed', null),
    ('las-1',
     -- före
     'Vad är textens huvudpoäng?', '1ff03b082826ebc961c9e0f70c956e8e', '["Fler fakta gör alltid människor bättre informerade","Problemet är främst urval och inramning, inte rå mängd information","Googling är den viktigaste färdigheten","Medier bör sluta publicera långa texter"]'::jsonb, 1,
     'Texten framhåller att problemet är hur information väljs ut och ramas in, inte hur mycket information som finns, vilket gör att huvudpoängen handlar om urval och inramning snarare än mängd. Att fler fakta alltid gör människor bättre informerade motsägs av just den poängen, eftersom texten ifrågasätter att mer data i sig hjälper. Att googling är den viktigaste färdigheten är en för smal och konkret tolkning som inte fångar resonemanget om inramning. Att medier bör sluta publicera långa texter nämns inte och är en helt annan slutsats än den om urval och tålamod.',
     -- efter (passage oförändrad)
     'Vad är textens huvudpoäng?', null, '["Medierna överdriver hur mycket information som finns när de talar om informationsöverflöd.","Man blir bättre informerad av att granska det man läser noga än av att söka efter mer.","Informationskompetens handlar främst om att snabbt kunna hitta fram till många källor.","Medierna bör ta större ansvar för att välja ut och rama in det som är viktigt för läsarna."]'::jsonb, 1,
     'Textens slutsats, markerad med ”därför”, är att informationskompetens är mindre en fråga om snabb googling och mer om tålamod: att stanna kvar i en text tillräckligt länge för att se vad som faktiskt påstås. Slutsatsen bygger på att problemet är urval och inramning snarare än mängden fakta, och på att den som bara samlar mer data utan att pröva källor och perspektiv riskerar att bli sämre informerad, inte bättre. Huvudpoängen är alltså att man blir bättre informerad av att granska det man läser noga än av att söka efter mer. Texten säger inte att medierna överdriver hur mycket information som finns, bara att problemet sällan är mängden i sig. Att snabbt hitta fram till många källor går emot slutsatsen. Texten uppmanar inte heller medierna att ta större ansvar för urvalet. Att urval och inramning styr vad som uppfattas som viktigt beskrivs som själva problemet, och slutsatsen gäller hur läsaren själv läser, inte vad medierna bör göra.',
     'agreed', null),
    ('las-2',
     -- före
     'Vilket påstående stöds av texten?', '1ff03b082826ebc961c9e0f70c956e8e', '["Tålamod är oviktigt vid läsning","Alla nyhetsmedier ljuger medvetet","Att samla mer data utan källkritik kan försämra förståelsen","Fakta och inramning är samma sak"]'::jsonb, 2,
     'Texten stödjer att det är problematiskt att samla mer data utan att pröva källorna, eftersom det är just denna okritiska datainsamling som texten varnar för. Att alla nyhetsmedier ljuger medvetet är en överdrift som går längre än vad texten påstår om brister i granskning. Att tålamod är oviktigt vid läsning strider mot textens betoning av tålamod som en dygd. Att fakta och inramning är samma sak motsäger textens poäng om att det är just skillnaden mellan dem som spelar roll.',
     -- efter (passage oförändrad)
     'Vilket påstående stöds av texten?', null, '["Medierna väljer medvetet ut och vinklar nyheter för att styra vad läsarna tycker.","Den som söker snabbt i många källor blir oftast bättre informerad än den som läser noga.","Att samla in mer data utan källkritik kan försämra förståelsen i stället för att förbättra den.","Det är främst mängden fakta, inte urvalet, som gör det svårt att hålla sig informerad."]'::jsonb, 2,
     'Texten säger att den som bara samlar mer data utan att pröva källor och perspektiv riskerar att bli sämre informerad, inte bättre. Att urval och inramning styr vad som uppfattas som viktigt står i texten, men inte att medierna gör det medvetet eller för att påverka vad läsarna tycker. Att den som söker snabbt i många källor skulle bli bättre informerad går emot slutsatsen att informationskompetens handlar mer om tålamod än om snabb googling. Att mängden fakta skulle vara det största problemet motsägs av första meningen, som säger att problemet sällan är mängden fakta i sig.',
     'agreed', null),
    ('las-3',
     -- före
     'Vad menar författaren med att forskningens värde inte bara sitter i resultatet?', 'd90caa8053c8397bb72109ec9cf77e2f', '["Att metod, osäkerhet och negativa fynd också är centrala","Att negativa fynd bör döljas","Att spektakulära resultat alltid är bäst","Att finansiering bör upphöra"]'::jsonb, 0,
     'Författaren menar att forskningens värde också ligger i metoddisciplin, redovisad osäkerhet och negativa fynd, inte bara i det slutliga resultatet. Att negativa fynd bör döljas är motsatsen till vad som lyfts fram, eftersom texten snarare vill synliggöra dem. Att spektakulära resultat alltid är bäst är precis den syn som texten ifrågasätter genom att peka på andra värden i forskningen. Att finansiering bör upphöra är en långtgående slutsats som inte har stöd i resonemanget om vad som gör forskning värdefull.',
     -- efter (passage oförändrad)
     'Vad menar författaren med att forskningens värde inte bara sitter i resultatet?', null, '["Att det är lika viktigt hur forskningen bedrivs och redovisas som vad den kommer fram till.","Att forskning bör bedömas efter vilken nytta den gör för samhället på lång sikt.","Att negativa fynd ofta är mer värdefulla än positiva och därför bör prioriteras.","Att spektakulära resultat sällan håller när andra forskare försöker upprepa dem."]'::jsonb, 0,
     'Författaren skriver att forskningens värde ”lika mycket” sitter i metoddisciplin: att formulera frågor precist, redovisa osäkerhet och låta negativa fynd synas. Det gäller alltså hur forskningen bedrivs och redovisas, inte bara vad den kommer fram till. Att forskning ska bedömas efter den nytta den gör ligger nära den syn som texten ifrågasätter, att ”nyttiga” resultat är det enda måttet på framgång. Texten säger att negativa fynd ska få synas, men inte att de är mer värdefulla än positiva. Den säger inte heller något om huruvida spektakulära resultat håller när de upprepas, utan varnar för att urvalet av vad som publiceras blir snedvridet när bara sådana resultat belönas.',
     'agreed', null),
    ('las-4',
     -- före
     'Vilken följd varnar texten för?', 'd90caa8053c8397bb72109ec9cf77e2f', '["Ökad publicering av negativa fynd","Snedvridet urval och överdriven bild av säkerhet","Lägre krav på metod","Att forskare slutar formulera frågor"]'::jsonb, 1,
     'Texten varnar för att belöning av spektakulära resultat leder till snedvridet urval och en överdriven bild av hur säker kunskapen egentligen är. Ökad publicering av negativa fynd är motsatt riktning mot vad som varnas för, eftersom det snarare skulle motverka snedvridningen. Lägre krav på metod är inte den konsekvens som texten pekar ut, utan snarare en följd av snedvridet urval än varningen i sig. Att forskare slutar formulera frågor nämns inte och ligger utanför det som beskrivs som konsekvens.',
     -- efter (passage oförändrad)
     'Vilken följd varnar texten för?', null, '["Att forskare frestas att förfalska data för att kunna visa upp spektakulära resultat.","Att osäkerheten i forskningen inte syns, eftersom bara vissa resultat publiceras.","Att det publiceras alltför många studier med svaga eller osäkra resultat.","Att forskningen blir långsammare när kraven på metoddisciplin skärps."]'::jsonb, 1,
     'Texten varnar för att det uppstår ett snedvridet urval av vad som publiceras när bara spektakulära resultat belönas, och att bilden av kunskapen då blir säkrare än den egentligen är. Osäkerheten syns alltså inte, och det skadar enligt texten både vetenskapen och allmänhetens tillit. Texten nämner inte fusk med data; problemet är vilka resultat som publiceras, inte att resultat förfalskas. Att för många studier med svaga eller osäkra resultat skulle publiceras är snarast motsatsen till varningen, eftersom det är de mindre spektakulära resultaten som riskerar att inte publiceras. Texten tar inte heller upp att forskningen skulle bli långsammare av krav på metod; metoddisciplin beskrivs tvärtom som en del av forskningens värde.',
     'agreed', null),
    ('las-5',
     -- före
     'Vilken beskrivning av städernas grönska stämmer bäst?', '27e67c99b7e69ddbef8dff86e2d3753d', '["Grönska är bara dekoration","Socioekonomi saknar betydelse för vegetation","Träd hjälper bara på landsbygden","Grönska har mätbara effekter och är ojämnt fördelad"]'::jsonb, 3,
     'Texten kopplar samman grönskans mätbara effekter, till exempel på temperatur och hälsa, med att den är ojämnt fördelad mellan olika områden. Att grönska bara är dekoration motsäger att texten lyfter fram konkreta, mätbara effekter. Att träd bara hjälper på landsbygden strider mot att resonemanget handlar om städer. Att socioekonomi saknar betydelse för vegetation går emot att texten just kopplar den ojämna fördelningen till sociala och ekonomiska skillnader.',
     -- efter (passage oförändrad)
     'Vilken beskrivning av städernas grönska stämmer bäst?', null, '["Grönska gör störst nytta i glest bebyggda områden.","Grönska påverkar främst luftkvaliteten, inte temperaturen.","Grönska är jämnt fördelad men olika väl skött.","Grönska har mätbara effekter och är ojämnt fördelad."]'::jsonb, 3,
     'Texten säger att forskning visar att träd och parker påverkar temperatur, luftkvalitet och människors stressnivåer, alltså effekter som går att belägga, och att grönskan är ojämnt fördelad: socioekonomiskt starka stadsdelar har ofta mer vegetation. Effekten är enligt texten störst i täta områden, inte i glest bebyggda. Texten ger inte luftkvaliteten någon särställning: temperaturen nämns lika uttryckligen, och effekten är störst där hårdgjorda ytor annars samlar värme. Att grönskan skulle vara jämnt fördelad motsägs direkt av texten, som inte heller jämför hur väl den sköts i olika stadsdelar.',
     'agreed', null),
    ('las-6',
     -- före
     'Vad krävs enligt texten för att trädsatsningar ska fungera?', '27e67c99b7e69ddbef8dff86e2d3753d', '["Skötsel och lokal förankring","Bara fler planteringsceremonier","Att undvika täta områden","Att ta bort parker i rika områden"]'::jsonb, 0,
     'Texten anger uttryckligen att skötsel och lokal förankring krävs för att trädsatsningar ska fungera på sikt. Fler planteringsceremonier beskriver en engångshändelse och saknar den långsiktiga skötsel som texten kräver. Att undvika täta områden nämns inte som ett villkor för att satsningarna ska lyckas. Att ta bort parker i rika områden är en omfördelningsåtgärd som inte är det som texten anger som förutsättning.',
     -- efter (passage oförändrad)
     'Vad krävs enligt texten för att trädsatsningar ska fungera?', null, '["Att träden underhålls och att satsningen har stöd i närområdet.","Att träden planteras där hårdgjorda ytor annars samlar mest värme.","Att satsningen motiveras med folkhälsa och rättvisa snarare än med estetik.","Att träden planteras i så stor skala att effekten märks i hela staden."]'::jsonb, 0,
     'Texten anger villkoret i sista meningen: att plantera träd är en fråga om rättvisa och folkhälsa ”förutsatt att skötsel och lokal förankring finns”, alltså att träden underhålls och att satsningen har stöd bland dem som bor i området. Att effekten är störst i täta områden där hårdgjorda ytor samlar värme säger var nyttan blir störst, men det ställs inte upp som ett krav. Texten säger att trädplantering inte bara är estetik utan också en fråga om rättvisa och folkhälsa, men den säger inget om hur en satsning ska motiveras. Att träden måste planteras i stor skala nämns inte.',
     'agreed', null),
    ('elf-1',
     -- före
     'What is the main claim of the passage?', 'f2397c3bc8febb03b5bba6a0566a7eea', '["Remote work always increases productivity","Junior staff prefer offices for social reasons only","Hallways are more important than software","The hidden cost is lost informal learning, so mentorship must be redesigned"]'::jsonb, 3,
     'The passage''s main claim is that remote work carries a hidden cost in lost informal learning, which means mentorship needs to be deliberately redesigned rather than left to chance. The claim that remote work always increases productivity overstates the passage''s point, which is about a specific cultural cost rather than a blanket productivity effect. Saying hallways matter more than software takes a supporting image too literally instead of the broader argument about learning. Reducing junior staff''s preference for offices to social reasons only ignores the passage''s emphasis on learning, not just socializing.',
     -- efter (passage oförändrad)
     'What is the main claim of the passage?', null, '["Remote work is essentially a trade-off, so flexibility must be weighed against productivity.","Junior staff suffer most from remote work, so they should return to the office.","Remote work is mainly a logistics problem, so desks, software and meetings come first.","Remote work''s hidden cost is lost informal learning, so mentorship must be redesigned."]'::jsonb, 3,
     'The passage notes that remote work is ''often framed'' as a trade-off between flexibility and productivity, but argues that ''the more interesting shift is cultural'': without a shared hallway, informal learning shrinks, and the organizations that adapt best respond by redesigning mentorship deliberately. The trade-off is therefore only the usual framing, not the author''s own claim. Junior staff are mentioned because they lose the conversations that taught them how decisions are made, but the passage neither says that they suffer most nor suggests bringing them back to the office. And treating remote work as a logistics problem of desks, software and meetings is exactly the approach that, according to the passage, misses ''this quieter cost''.',
     'agreed', null),
    ('elf-2',
     -- före
     'According to the passage, what do weaker remote strategies miss?', 'f2397c3bc8febb03b5bba6a0566a7eea', '["The cultural cost of fewer informal learning moments","The price of office furniture","How to schedule more meetings","That flexibility never matters"]'::jsonb, 0,
     'Weaker remote strategies overlook the cultural cost of fewer informal learning moments, since they treat remote work only as a logistical matter. The price of office furniture is irrelevant and not something the passage discusses as a missed cost. Scheduling more meetings is not identified as the missing insight, since the issue is the quality of informal exchange, not meeting frequency. Claiming flexibility never matters overstates the passage''s position, which criticizes shallow strategies, not flexibility itself.',
     -- efter (passage oförändrad)
     'According to the passage, what do companies that treat remote work as a logistics problem alone miss?', null, '["The cultural cost of fewer informal learning moments","The productivity that staff lose in exchange for flexibility","The strain that frequent video meetings put on staff","The formal training that junior staff no longer receive"]'::jsonb, 0,
     'Companies that treat remote work as ''a logistics problem alone'' are said to ''miss this quieter cost'', and the cost referred to is the cultural one described just before: informal learning shrinks, and junior staff lose the half-overheard conversations that once taught them how decisions are made. Productivity is mentioned only as part of the usual way of framing remote work, not as the cost these companies overlook. Meetings appear only as one of the logistical matters such companies concentrate on, and nothing is said about any strain they cause. And what junior staff lose is the informal learning of overheard conversations, not formal training.',
     'agreed', null),
    ('elf-3',
     -- före
     'What does the author suggest successful organizations do?', 'f2397c3bc8febb03b5bba6a0566a7eea', '["Ban remote work","Add more hallways online","Redesign mentorship on purpose","Ignore junior staff"]'::jsonb, 2,
     'According to the author, successful organizations deliberately redesign mentorship to compensate for what remote work removes. Banning remote work contradicts the passage''s assumption that remote work continues and simply needs better mentorship. Adding more hallways online is a literal misreading of the hallway image rather than the actual recommendation to redesign mentorship. Ignoring junior staff is the opposite of the intent, since the passage''s concern is precisely about supporting them.',
     -- efter (passage oförändrad)
     'What does the author suggest successful organizations do?', null, '["Bring junior staff back to the office","Let mentoring develop by itself","Redesign mentorship on purpose","Focus on desks, software and meetings"]'::jsonb, 2,
     'The successful organizations in the passage are those that ''adapt best'', and they ''redesign mentorship deliberately, instead of hoping it happens by accident''. Letting mentoring develop by itself is therefore exactly what they avoid. Bringing junior staff back to the office is never suggested; the passage is about adapting to remote work, not ending it. And concentrating on desks, software and meetings is the logistics-only approach that, according to the passage, misses the cultural cost of lost informal learning.',
     'agreed', null),
    ('elf-4',
     -- före
     'Which statement best matches the passage?', '68a5a28158f2684b5cf0b06fffaf60f4', '["Journalists invent climate disasters","Sudden events get more attention than slow trends, so readers must look for the trend","Floods are unimportant","Insurance is unrelated to climate"]'::jsonb, 1,
     'The passage''s core idea is that sudden events attract more attention than slow-moving trends, so readers need to actively look for the underlying trend themselves. Saying journalists invent climate disasters goes beyond the claim, which is about attention bias, not fabrication. Calling floods unimportant misreads the point, since floods are used as an example of a sudden event, not dismissed as trivial. Saying insurance is unrelated to climate ignores that such details likely serve as evidence within the passage''s argument, not as an unrelated aside.',
     -- efter
     'Which statement best matches the passage?', 'Climate reporting has improved at describing extreme weather, but it still struggles with time. Readers are shown a flood or a fire as a dramatic event, and then the story ends. The slower processes — soil degradation, insurance retreat, rising baseline heat — get less airtime because they lack a single climax. This narrative bias does not mean journalists are dishonest; it means the formats that attract attention favour suddenness. Understanding climate risk therefore requires reading past the event to the trend underneath.', '["Journalists deliberately distort climate news to attract more readers.","Sudden events get more attention than slow trends, so readers must look for the trend.","Slow processes matter less than extreme events because they lack a single climax.","Climate reporting has become good at explaining long-term climate risk."]'::jsonb, 1,
     'The passage says that slow processes such as soil degradation and rising baseline heat ''get less airtime because they lack a single climax'' and that ''the formats that attract attention favour suddenness''; it concludes that understanding climate risk ''requires reading past the event to the trend underneath''. Deliberate distortion is ruled out, since this bias ''does not mean journalists are dishonest''. The slow processes are not said to matter less; they get less coverage, which is why readers have to look for them. And although climate reporting has improved at describing extreme weather, it ''still struggles with time'', so it has not become good at explaining long-term risk.',
     'agreed', null),
    ('ovn-ord-004',
     -- före
     'Vad betyder ”pejorativ”?', null, '["nedsättande","förskönande","ålderdomlig","vardaglig","överdriven"]'::jsonb, 0,
     'Pejorativ betyder nedsättande och används om ord och uttryck med en negativ värdering: ”pamp” är till exempel en pejorativ beteckning på en makthavare. Förskönande är närmast motsatsen, eftersom en förskönande omskrivning får något att låta mildare än det är. Ålderdomlig, vardaglig och överdriven beskriver också ord, men de anger ålder, stilnivå och grad, inte en negativ värdering.',
     -- efter (passage oförändrad)
     'Vad betyder ”pejorativ”?', null, '["nedsättande","fackspråklig","ålderdomlig","vardaglig","överdriven"]'::jsonb, 0,
     'Pejorativ betyder nedsättande och används om ord och uttryck med en negativ värdering: ”pamp” är till exempel en pejorativ beteckning på en makthavare. Fackspråklig, ålderdomlig, vardaglig och överdriven beskriver också ord, men de anger fackområde, ålder, stilnivå och grad, inte en negativ värdering.',
     'agreed', null),
    ('ovn-ord-008',
     -- före
     'Vad betyder ”abdikera”?', null, '["avsätta en kung","bli krönt","ärva tronen","gå i landsflykt","avsäga sig tronen"]'::jsonb, 4,
     'Att abdikera är att frivilligt avsäga sig tronen, och i överförd betydelse att avstå från makt eller ansvar: ”drottningen abdikerade till förmån för sin son”. Avsätta en kung innebär tvärtom att någon annan tar ifrån kungen makten. Bli krönt och ärva tronen handlar om att få makten, och gå i landsflykt om att lämna landet, inte tronen.',
     -- efter (passage oförändrad)
     'Vad betyder ”abdikera”?', null, '["avsätta en kung","bli krönt","ärva tronen","gå i landsflykt","avsäga sig tronen"]'::jsonb, 4,
     'Att abdikera är att avsäga sig tronen, och i överförd betydelse att avstå från makt eller ansvar: ”drottningen abdikerade till förmån för sin son”. Den som abdikerar lämnar alltså själv tronen, ibland under tryck, medan avsätta en kung innebär att någon annan tar ifrån kungen makten. Bli krönt och ärva tronen handlar om att få makten, och gå i landsflykt om att lämna landet, inte tronen.',
     'agreed', null),
    ('ovn-ord-009',
     -- före
     'Vad betyder ”sinekur”?', null, '["obotlig sjukdom","kurort","lätt och välbetald syssla","tillfällig tjänstledighet","provanställning"]'::jsonb, 2,
     'En sinekur är en lätt och välbetald syssla, alltså en tjänst som ger god lön men kräver lite eller inget arbete: ”styrelseposten var i praktiken en sinekur”. Ordet kommer av latinets sine cura, ”utan omsorg”, och har inget med kur i betydelsen behandling att göra, så kurort och obotlig sjukdom är fel. Tillfällig tjänstledighet och provanställning är andra slags anställningsvillkor och säger inget om att arbetet är lätt men välbetalt.',
     -- efter (passage oförändrad)
     'Vad betyder ”sinekur”?', null, '["obotlig sjukdom","kurort","lätt och välbetald syssla","tillfällig tjänstledighet","provanställning"]'::jsonb, 2,
     'En sinekur är en lätt och välbetald syssla, alltså en tjänst som ger god lön men kräver lite eller inget arbete: ”styrelseposten var i praktiken en sinekur”. Ordet kommer av latinets sine cura, ”utan omsorg”, och betydelsen hänger inte ihop med kur i betydelsen behandling, så kurort och obotlig sjukdom är fel. Tillfällig tjänstledighet och provanställning är andra slags anställningsvillkor och säger inget om att arbetet är lätt men välbetalt.',
     'agreed', null),
    ('ovn-ord-010',
     -- före
     'Vad betyder ”slå dövörat till”?', null, '["vägra lyssna","ge någon en örfil","höja rösten","lyssna i smyg","avbryta någon"]'::jsonb, 0,
     'Att slå dövörat till är att låtsas att man inte hör, alltså vägra lyssna på till exempel en begäran eller kritik: ”ledningen slog dövörat till personalens protester”. Ge någon en örfil bygger på en bokstavlig läsning av slå och öra. Höja rösten, lyssna i smyg och avbryta någon handlar om andra sätt att tala och lyssna, inte om att stänga ute det man inte vill höra.',
     -- efter (passage oförändrad)
     'Vad betyder ”slå dövörat till”?', null, '["vägra lyssna","ge någon en örfil","höja rösten","lyssna i smyg","avbryta någon"]'::jsonb, 0,
     'Att slå dövörat till är att låtsas att man inte hör, alltså vägra lyssna på till exempel en begäran eller kritik: ”ledningen slog dövörat till för personalens protester”. Ge någon en örfil bygger på en bokstavlig läsning av slå och öra. Höja rösten, lyssna i smyg och avbryta någon handlar om andra sätt att tala och lyssna, inte om att stänga ute det man inte vill höra.',
     'agreed', null),
    ('ovn-ord-016',
     -- före
     'Vad betyder ”vanhävd”?', null, '["gammal sedvänja","vanära","äganderätt","vantro","vanskötsel"]'::jsonb, 4,
     'Vanhävd betyder vanskötsel eller försummelse, särskilt av jord, skog eller byggnader: ”de gamla ängarna har vuxit igen genom vanhävd”. Hävd betyder här brukande och skötsel av mark, och förledet van- anger att det görs dåligt, som i vanvård. Gammal sedvänja och äganderätt bygger på andra betydelser av hävd, medan vanära betyder skam och vantro betyder vidskepelse.',
     -- efter (passage oförändrad)
     'Vad betyder ”vanhävd”?', null, '["gammal sedvänja","vanära","äganderätt","vantro","vanskötsel"]'::jsonb, 4,
     'Vanhävd betyder vanskötsel eller försummelse, särskilt av jord, skog eller byggnader: ”de gamla ängarna har vuxit igen genom vanhävd”. Hävd betyder här brukande och skötsel av mark, och förledet van- anger att det görs dåligt, som i vanvård. Gammal sedvänja och äganderätt bygger på andra betydelser av hävd, medan vanära betyder skam och vantro betyder falsk tro eller otro.',
     'agreed', null),
    ('ovn-ord-018',
     -- före
     'Vad betyder ”dementera”?', null, '["bekräfta","läcka","offentligt förneka","spekulera","bli förvirrad"]'::jsonb, 2,
     'Att dementera är att offentligt förneka en uppgift eller ett rykte: ”ministern dementerade uppgifterna om sin avgång”. Bekräfta är motsatsen. Läcka och spekulera hör till samma nyhetsvärld men betyder att föra ut hemliga uppgifter respektive att gissa, och bli förvirrad bygger på en felaktig koppling till ordet dement.',
     -- efter (passage oförändrad)
     'Vad betyder ”dementera”?', null, '["kommentera","läcka","förneka","spekulera","bli förvirrad"]'::jsonb, 2,
     'Att dementera är att offentligt förneka en uppgift eller ett rykte: ”ministern dementerade uppgifterna om sin avgång”. Kommentera liknar ordet till formen men betyder bara att uttala sig om något. Läcka och spekulera hör till samma nyhetsvärld men betyder att föra ut hemliga uppgifter respektive att gissa, och bli förvirrad bygger på en felaktig koppling till ordet dement.',
     'agreed', null),
    ('ord-1',
     -- före
     'Vad betyder ordet ”adekvat”?', null, '["överdriven","lämplig / tillräcklig","otydlig","tillfällig"]'::jsonb, 1,
     'Adekvat betyder lämplig eller tillräcklig för ett givet syfte. Överdriven beskriver något som gått för långt, vilket är en annan dimension än lämplighet. Otydlig handlar om klarhet, inte om att passa syftet. Tillfällig syftar på varaktighet i tid, inte på lämplighet.',
     -- efter (passage oförändrad)
     'Vad betyder ”adekvat”?', null, '["lämplig","akut","avancerad","kostnadsfri","omfattande"]'::jsonb, 0,
     'Adekvat betyder lämplig, alltså att något passar sitt syfte och motsvarar det som behövs: ”patienten fick inte adekvat vård”. Akut, avancerad, kostnadsfri och omfattande kan också beskriva vård, men de betyder brådskande, högt specialiserad, gratis respektive stor till omfånget och säger inget om att vården passar behovet.',
     'agreed', null),
    ('ord-2',
     -- före
     'Vad betyder ”implikation”?', null, '["följd / underförstådd betydelse","direkt motsägelse","offentlig debatt","formell ursäkt"]'::jsonb, 0,
     'En implikation är en följd eller underförstådd betydelse som ett påstående för med sig. Direkt motsägelse är motsatsen, eftersom en implikation snarare hänger ihop med utsagan än strider mot den. Offentlig debatt handlar om diskussion, inte om logisk följd. Formell ursäkt saknar helt kopplingen till följd eller antydan.',
     -- efter (passage oförändrad)
     'Vad betyder ”implikation”?', null, '["genomförande","följd","tillämpning","förveckling","efterapning"]'::jsonb, 1,
     'En implikation är en följd eller konsekvens av något, ofta en som inte sägs rakt ut: ”resultaten får viktiga implikationer för hur skolan bör arbeta”. Genomförande, tillämpning och efterapning är betydelser av de liknande orden implementering, applikation och imitation. Förveckling är betydelsen av komplikation, som också liknar ordet men syftar på en oväntad svårighet.',
     'agreed', null),
    ('ord-3',
     -- före
     'Vad betyder ”premissen”?', null, '["slutsatserna","undantaget","utgångspunkten / antagandet","bevisbördan"]'::jsonb, 2,
     'Premissen är den utgångspunkt eller det antagande som ett resonemang bygger på. Slutsatserna är istället vad man kommer fram till efter resonemanget, alltså motsatt ände av tankekedjan. Undantaget rör avvikelser från en regel, inte grunden för argumentet. Bevisbördan handlar om vem som måste styrka ett påstående, vilket är en annan juridisk/logisk term.',
     -- efter (passage oförändrad)
     'Vad betyder ”premissen”?', null, '["undantaget","belöningen","förutsättningen","bevisbördan","motargumentet"]'::jsonb, 2,
     'En premiss är en förutsättning eller ett antagande som ett resonemang bygger på: ”om premissen är felaktig faller hela slutsatsen”. Belöningen är betydelsen av det liknande ordet premien. Undantaget, bevisbördan och motargumentet hör också hemma i argumentation och juridik, men betyder ett avsteg från en regel, skyldigheten att bevisa något respektive ett argument som talar emot en tes.',
     'agreed', null),
    ('ord-4',
     -- före
     'Vad betyder ”ambivalent”?', null, '["helt säker","kluven / dubbeltydigt sinnad","ointresserad","öppen och glad"]'::jsonb, 1,
     'Ambivalent betyder kluven eller att ha motstridiga känslor samtidigt. Helt säker är motsatsen, då det utesluter tvekan. Ointresserad beskriver brist på engagemang snarare än dubbelhet i känslor. Öppen och glad beskriver ett positivt, enhetligt sinnestillstånd utan den inneboende splittringen.',
     -- efter (passage oförändrad)
     'Vad betyder ”ambivalent”?', null, '["ärelysten","likgiltig","kringresande","kluven","mångsidig"]'::jsonb, 3,
     'Ambivalent betyder kluven, alltså att man har motstridiga känslor eller inställningar till något på samma gång: ”hon var ambivalent inför flytten, glad över jobbet men ledsen över att lämna vännerna”. Ärelysten och kringresande är betydelser av de liknande orden ambitiös och ambulerande. Likgiltig förväxlas ibland med ambivalent, men den som är ambivalent bryr sig tvärtom och dras åt två håll, och mångsidig handlar om att kunna många saker, inte om inre splittring.',
     'agreed', null),
    ('ord-5',
     -- före
     'Vad betyder ”koncist”?', null, '["kortfattat och precist","långrandigt","poetiskt","vardagligt"]'::jsonb, 0,
     'Koncist betyder kortfattat och precist formulerat. Långrandigt är motsatsen, eftersom det syftar på utdragna och ordrika formuleringar. Poetiskt handlar om stilistiskt bildspråk, inte om korthet. Vardagligt beskriver register snarare än hur kort eller precis en text är.',
     -- efter (passage oförändrad)
     'Vad betyder ”koncist”?', null, '["konkret","sakligt","konsekvent","kortsiktigt","kortfattat"]'::jsonb, 4,
     'Koncist betyder kortfattat och träffande, alltså utan onödiga ord: ”hon sammanfattade utredningen koncist på en enda sida”. Konkret och konsekvent liknar ordet till formen men betyder åskådligt respektive följdriktigt. Kortsiktigt handlar om tid snarare än omfång, och sakligt betyder att man håller sig till fakta, vilket går att göra både kort och utförligt.',
     'agreed', null),
    ('ord-6',
     -- före
     'Vad betyder ”relativisera”?', null, '["absolutgöra","förstora","sätta i perspektiv / tona ner absoluthet","bevisa"]'::jsonb, 2,
     'Att relativisera är att sätta något i perspektiv eller tona ner dess absoluta karaktär genom att jämföra med annat. Absolutgöra är motsatsen, eftersom det förstärker snarare än nyanserar ett påstående. Förstora handlar om att göra något större, inte om att relativisera dess betydelse. Bevisa syftar på att styrka sanningshalt, vilket inte har med perspektivering att göra.',
     -- efter (passage oförändrad)
     'Vad betyder ”relativisera”?', null, '["sätta i perspektiv","förverkliga","återge","arbeta om","förenkla"]'::jsonb, 0,
     'Att relativisera är att sätta något i perspektiv, alltså visa att det inte är absolut utan beror på vad man jämför med: ”forskaren relativiserade resultaten genom att jämföra dem med andra länders”. Förverkliga, återge och arbeta om är betydelser av de liknande orden realisera, relatera och revidera. Förenkla är fel eftersom den som relativiserar inte gör saken enklare utan ställer den i relation till något annat.',
     'agreed', null),
    ('ord-7',
     -- före
     'Vad betyder ”diskrepans”?', null, '["överensstämmelse","upprepning","sammanfattning","skillnad / bristande överensstämmelse"]'::jsonb, 3,
     'Diskrepans betyder skillnad eller bristande överensstämmelse mellan till exempel två uppgifter. Överensstämmelse är motsatsen, då den beskriver att saker stämmer ihop. Sammanfattning handlar om att komprimera information, inte om att peka på skillnader. Upprepning innebär att säga samma sak igen, vilket är en annan process än att jämföra och hitta avvikelser.',
     -- efter (passage oförändrad)
     'Vad betyder ”diskrepans”?', null, '["meningsutbyte","skillnad","tystlåtenhet","undantag","särbehandling"]'::jsonb, 1,
     'Diskrepans betyder skillnad, särskilt mellan saker som borde stämma överens: ”det fanns en stor diskrepans mellan budgeten och de faktiska kostnaderna”. Meningsutbyte, tystlåtenhet, undantag och särbehandling är betydelser av de liknande orden diskussion, diskretion, dispens och diskriminering.',
     'agreed', null),
    ('ord-8',
     -- före
     'Vad betyder ”eminent”?', null, '["medelmåttig","tillfällig","okänd","framstående"]'::jsonb, 3,
     'Eminent betyder framstående eller synnerligen skicklig. Medelmåttig är närmast motsatsen, eftersom det beskriver genomsnittlig kvalitet. Okänd beskriver brist på uppmärksamhet, vilket strider mot att vara framstående. Tillfällig handlar om varaktighet i tid och saknar koppling till skicklighet eller status.',
     -- efter (passage oförändrad)
     'Vad betyder ”eminent”?', null, '["överhängande","pensionerad","framstående","flitig","framåtsträvande"]'::jsonb, 2,
     'Eminent betyder framstående eller utmärkt: ”hon är en eminent kännare av 1700-talets litteratur”. Överhängande är betydelsen av engelskans imminent, och pensionerad bygger på en förväxling med emeritus, som i professor emeritus. Flitig och framåtsträvande säger något om hur hårt någon arbetar eller hur långt någon vill nå, inte om hur skicklig och ansedd personen faktiskt är.',
     'agreed', null),
    ('ord-9',
     -- före
     'Vad betyder ”provisorisk”?', null, '["slutgiltig","tillfällig","laglig","dyr"]'::jsonb, 1,
     'Provisorisk betyder tillfällig, ofta som en lösning i väntan på något bättre. Slutgiltig är motsatsen, då den betecknar det som är avgjort och bestående. Laglig rör lagenlighet, inte varaktighet. Dyr handlar om kostnad, vilket är en helt annan egenskap än hur länge något ska gälla.',
     -- efter (passage oförändrad)
     'Vad betyder ”provisorisk”?', null, '["utmanande","småstadsaktig","framstegsvänlig","tillfällig","förebyggande"]'::jsonb, 3,
     'Provisorisk betyder tillfällig, alltså tänkt att fungera bara tills en permanent lösning finns: ”efter stormen byggdes en provisorisk bro över ån”. Utmanande, småstadsaktig och framstegsvänlig är betydelser av de liknande orden provocerande, provinsiell och progressiv. Förebyggande handlar om att förhindra att något händer, inte om hur länge en lösning ska gälla.',
     'agreed', null),
    ('ord-10',
     -- före
     'Vad betyder ”subversiv”?', null, '["stödjande","högtidlig","neutral","omstörtande / underminerande"]'::jsonb, 3,
     'Subversiv betyder omstörtande eller underminerande gentemot en rådande ordning. Stödjande är motsatsen, eftersom det innebär att man bidrar till att upprätthålla något snarare än att underminera det. Neutral beskriver avsaknad av ställningstagande, vilket inte stämmer med den aktiva undermineringen i subversiv. Högtidlig rör ett formellt tonläge och saknar den ifrågasättande innebörden.',
     -- efter (passage oförändrad)
     'Vad betyder ”subversiv”?', null, '["undermedveten","hårfin","personligt färgad","underordnad","omstörtande"]'::jsonb, 4,
     'Subversiv betyder omstörtande, alltså att något syftar till att undergräva eller störta en rådande ordning: ”regimen förbjöd tidningen och kallade den subversiv”. Hårfin och personligt färgad är betydelser av de liknande orden subtil och subjektiv. Underordnad och undermedveten bygger på att sub- betyder under, men har inget med att störta en ordning att göra.',
     'agreed', null),
    ('ord-11',
     -- före
     'Vad betyder ”tautologi”?', null, '["exempel","motsägelse","cirkelresonemang / upprepning av samma sak","bevis"]'::jsonb, 2,
     'Tautologi är ett cirkelresonemang eller en upprepning av samma sak i andra ordalag. Motsägelse beskriver istället två påståenden som inte kan vara sanna samtidigt, vilket är motsatt logik. Exempel är en illustration av något, inte en upprepning av samma innebörd. Bevis syftar på belägg för ett påstående, vilket skiljer sig från att bara omformulera det.',
     -- efter (passage oförändrad)
     'Vad betyder ”tautologi”?', null, '["upprepning med andra ord","gudslära","överdrift","ordhärledning","förskönande omskrivning"]'::jsonb, 0,
     'En tautologi är en upprepning av samma sak med andra ord, som i ”ensam och allena”. I logiken kallas också ett påstående som alltid är sant, som ”antingen regnar det eller så regnar det inte”, för en tautologi. Gudslära och ordhärledning är betydelser av de liknande orden teologi och etymologi, och överdrift och förskönande omskrivning är andra stilfigurer, nämligen hyperbol och eufemism. Tautologi ska inte förväxlas med cirkelresonemang, där slutsatsen redan förutsätts i premisserna.',
     'agreed', null),
    ('ord-12',
     -- före
     'Vad betyder ”kontroversiell”?', null, '["omstridd","allmänt accepterad","hemlig","teknisk"]'::jsonb, 0,
     'Kontroversiell betyder omstridd, det väcker starka och motstridiga åsikter. Allmänt accepterad är motsatsen, eftersom den beskriver bred enighet snarare än konflikt. Hemlig handlar om att vara dold, inte om att vara omdebatterad. Teknisk syftar på fackmässig karaktär och har ingen koppling till grad av oenighet.',
     -- efter (passage oförändrad)
     'Vad betyder ”kontroversiell”?', null, '["förtrolig","omstridd","behärskad","affärsmässig","traditionsbunden"]'::jsonb, 1,
     'Kontroversiell betyder omstridd, alltså att något väcker strid och delade meningar: ”förslaget att riva den gamla teatern var mycket kontroversiellt”. Förtrolig, affärsmässig och traditionsbunden är betydelser av de liknande orden konfidentiell, kommersiell och konventionell, och behärskad hör ihop med kontrollerad, inte med strid och oenighet.',
     'agreed', null),
    ('ord-13',
     -- före
     'Vad betyder ”indignation”?', null, '["nöjdhet","rättmätig vrede / upprördhet","nyfikenhet","trötthet"]'::jsonb, 1,
     'Indignation betyder rättmätig vrede eller upprördhet över något som uppfattas som orätt. Nöjdhet är motsatsen, då den beskriver ett tillfredsställt sinnestillstånd. Nyfikenhet handlar om intresse för att veta mer, inte om upprördhet. Trötthet syftar på brist på energi och saknar den känslomässiga laddningen i indignation.',
     -- efter (passage oförändrad)
     'Vad betyder ”indignation”?', null, '["förnedring","tecken","harm","nedstämdhet","inbillning"]'::jsonb, 2,
     'Indignation betyder harm, alltså vrede och upprördhet över något som man uppfattar som orätt eller kränkande: ”beslutet att stänga skolan väckte stor indignation bland föräldrarna”. Förnedring, tecken och inbillning är betydelser av de liknande orden indignity (på engelska), indikation och imagination. Nedstämdhet är ett slags sorgsenhet snarare än vrede.',
     'agreed', null),
    ('ord-14',
     -- före
     'Vad betyder ”implicit”?', null, '["uttryckligen sagt","högljutt","felaktigt","underförstått"]'::jsonb, 3,
     'Implicit betyder underförstått, det är antytt snarare än uttalat. Uttryckligen sagt är motsatsen, eftersom det betecknar det som sägs rakt ut. Felaktigt handlar om sanningshalt, inte om hur något förmedlas. Högljutt rör volym eller intensitet i uttryck, vilket saknar koppling till underförstådd betydelse.',
     -- efter (passage oförändrad)
     'Vad betyder ”implicit”?', null, '["inblandad","invecklad","näsvis","underförstådd","ståtlig"]'::jsonb, 3,
     'Implicit betyder underförstådd, alltså att något inte sägs rakt ut men ändå framgår: ”i inbjudan låg en implicit förväntan på att alla skulle komma”. Inblandad, invecklad, näsvis och ståtlig är betydelser av de liknande orden implicerad, komplicerad, impertinent och imposant.',
     'agreed', null),
    ('ord-15',
     -- före
     'Vad betyder ”konsensus”?', null, '["konflikt","omröstning","samförstånd","kompromisslöshet"]'::jsonb, 2,
     'Konsensus betyder samförstånd eller allmän enighet. Konflikt är motsatsen, då den beskriver oenighet snarare än samstämmighet. Omröstning är en metod för att fatta beslut men innebär inte i sig enighet. Kompromisslöshet betecknar en ovilja att mötas, vilket är raka motsatsen till samförstånd.',
     -- efter (passage oförändrad)
     'Vad betyder ”konsensus”?', null, '["folkräkning","samvete","omröstning","eftergift","samförstånd"]'::jsonb, 4,
     'Konsensus betyder samförstånd eller enighet, alltså att alla inblandade är överens: ”efter långa förhandlingar nådde partierna konsensus om budgeten”. Folkräkning, samvete och eftergift är betydelser av de liknande orden census, conscience (på engelska) och koncession. Omröstning är ett sätt att fatta beslut när alla inte är överens, inte själva enigheten.',
     'agreed', null),
    ('ord-16',
     -- före
     'Vad betyder ”epitet”?', null, '["tillnamn / beskrivande beteckning","fotnot","citat","rubrik"]'::jsonb, 0,
     'Epitet är ett tillnamn eller en beskrivande beteckning som fästs vid någon eller något. Fotnot är en förklarande not i en text, vilket är en annan textuell funktion än ett tillnamn. Citat är ett återgivet uttalande, inte en beskrivande benämning. Rubrik är en titel som inleder en text, vilket skiljer sig från ett epitet som beskriver en person eller sak.',
     -- efter (passage oförändrad)
     'Vad betyder ”epitet”?', null, '["tillnamn","gravskrift","slutord","valspråk","avsnitt"]'::jsonb, 0,
     'Ett epitet är ett tillnamn eller en karakteriserande benämning: ”Gustav II Adolf fick epitetet Lejonet från Norden”. Gravskrift, slutord och avsnitt är betydelser av de liknande orden epitafium, epilog och episod. Ett valspråk är en kort devis som någon själv väljer att leva efter, inte en benämning som beskriver personen.',
     'agreed', null),
    ('ord-17',
     -- före
     'Vad betyder ”fatal”?', null, '["ofarlig","ödesdiger / katastrofal","rolig","långsam"]'::jsonb, 1,
     'Fatal betyder ödesdiger eller katastrofal, ofta med allvarliga eller dödliga följder. Ofarlig är motsatsen, eftersom den utesluter allvarlig skada. Rolig beskriver ett lustfyllt intryck, vilket är oförenligt med den allvarliga innebörden i fatal. Långsam handlar om hastighet, inte om graden av allvar i följderna.',
     -- efter (passage oförändrad)
     'Vad betyder ”fatal”?', null, '["ödestroende","ödesdiger","förförisk","alldaglig","fullständig"]'::jsonb, 1,
     'Fatal betyder ödesdiger, alltså att något får mycket olyckliga eller allvarliga följder: ”att inte byta de slitna bromsarna visade sig vara ett fatalt misstag”. Ödestroende är betydelsen av det besläktade ordet fatalistisk, och förförisk bygger på uttrycket femme fatale. Alldaglig och fullständig är betydelser av banal och total, som rimmar på fatal.',
     'agreed', null),
    ('ord-18',
     -- före
     'Vad betyder ”abstrahera”?', null, '["göra konkret","översätta","räkna","lyfta ut det väsentliga / bortse från detaljer"]'::jsonb, 3,
     'Att abstrahera är att lyfta ut det väsentliga och bortse från enskilda detaljer. Göra konkret är motsatsen, då det innebär att knyta något till specifika, konkreta exempel snarare än att generalisera. Räkna handlar om matematisk bearbetning, inte om att bortse från detaljer. Översätta rör överföring mellan språk, vilket är en annan process än generalisering.',
     -- efter (passage oförändrad)
     'Vad betyder ”abstrahera”?', null, '["avhålla sig","störa","bortse från detaljer","dra till sig","suga upp"]'::jsonb, 2,
     'Att abstrahera är att bortse från detaljer och enskildheter för att få fram det allmänna och väsentliga: ”för att se mönstret måste man abstrahera från de enskilda fallen”. Störa, dra till sig och suga upp är betydelser av de liknande orden distrahera, attrahera och absorbera, och avhålla sig hör ihop med abstinens.',
     'agreed', null),
    ('ord-19',
     -- före
     'Vad betyder ”legitim”?', null, '["olaglig","hemlig","berättigad / giltig","tillfällig"]'::jsonb, 2,
     'Legitim betyder berättigad eller giltig, ofta i juridisk eller moralisk mening. Olaglig är motsatsen, eftersom den betecknar det som strider mot lagen. Hemlig handlar om att vara dold, vilket inte har med giltighet att göra. Tillfällig syftar på varaktighet i tid, en annan egenskap än att vara berättigad.',
     -- efter (passage oförändrad)
     'Vad betyder ”legitim”?', null, '["lagstiftande","sagoomspunnen","vemodig","berättigad","kamratlig"]'::jsonb, 3,
     'Legitim betyder berättigad, alltså att något har stöd i lag, regler eller allmänt godtagna principer: ”hon hade ett legitimt skäl att utebli från mötet”. Lagstiftande, sagoomspunnen, vemodig och kamratlig är betydelser av de liknande orden legislativ, legendarisk, elegisk och kollegial.',
     'agreed', null),
    ('ord-20',
     -- före
     'Vad betyder ”paradox”?', null, '["citat","enkel sanning","statistik","självmotsägande påstående som kan rymma en sanning"]'::jsonb, 3,
     'En paradox är ett självmotsägande påstående som trots det kan rymma en sanning. Enkel sanning är motsatsen, då den saknar den motsägelsefulla ytan som utmärker en paradox. Statistik handlar om sifferunderlag, inte om ett logiskt spänningsfullt påstående. Citat är ett återgivet uttalande, vilket inte i sig behöver innehålla någon motsägelse.',
     -- efter (passage oförändrad)
     'Vad betyder ”paradox”?', null, '["liknelse","förebild","svårt val","omskrivning","skenbar motsägelse"]'::jsonb, 4,
     'En paradox är en skenbar motsägelse, alltså ett påstående som verkar orimligt men som vid närmare eftertanke kan vara sant: ”det är en paradox att ju fler alternativ vi har, desto svårare blir det att välja”. Liknelse, förebild och omskrivning är betydelser av de liknande orden parabel, paradigm och parafras. Ett svårt val kallas dilemma, ett ord som ofta förväxlas med paradox.',
     'agreed', null),
    ('ord-21',
     -- före
     'Vad betyder ”resursstark”?', null, '["fattig på medel","som har goda tillgångar / kapacitet","ointresserad","svag"]'::jsonb, 1,
     'Resursstark betyder att ha goda tillgångar eller kapacitet, till exempel ekonomiskt eller organisatoriskt. Fattig på medel är motsatsen, eftersom den beskriver brist snarare än överflöd av resurser. Ointresserad handlar om engagemang, inte om tillgång till resurser. Svag beskriver bristande kraft eller förmåga, vilket är motsatt innebörd till att vara resursstark.',
     -- efter (passage oförändrad)
     'Vad betyder ”resursstark”?', null, '["med goda tillgångar","kostsam","resolut","sparsam","med stor uthållighet"]'::jsonb, 0,
     'Resursstark betyder att man har gott om resurser, till exempel pengar, kunskap och kontakter: ”barn till resursstarka föräldrar får ofta mer hjälp med läxorna”. Kostsam och sparsam har också med resurser att göra, men betyder att något kostar mycket respektive att man hushållar med det man har. Resolut (beslutsam) liknar ordet bara till formen, och med stor uthållighet bygger på en felaktig läsning av -stark som kroppslig eller psykisk styrka.',
     'agreed', null),
    ('ord-22',
     -- före
     'Vad betyder ”dogmatisk”?', null, '["låst vid fasta läror utan nyans","öppen för kritik","humoristisk","praktisk"]'::jsonb, 0,
     'Dogmatisk betyder att vara låst vid fasta läror utan att öppna för nyans eller kritik. Öppen för kritik är motsatsen, eftersom den beskriver en beredskap att ompröva sina ståndpunkter. Humoristisk rör lekfullhet i uttryck, vilket saknar kopplingen till orubblig övertygelse. Praktisk handlar om verklighetsanpassning snarare än om orubblig fasthet vid en lära.',
     -- efter (passage oförändrad)
     'Vad betyder ”dogmatisk”?', null, '["taktfull","låst vid en lära","metodisk","noga med detaljer","teatralisk"]'::jsonb, 1,
     'Dogmatisk betyder låst vid en lära, alltså att man håller fast vid vissa åsikter eller principer utan att pröva dem eller lyssna på invändningar: ”hans dogmatiska syn på uppfostran lämnade inget utrymme för diskussion”. Taktfull, metodisk och teatralisk är betydelser av de liknande orden diplomatisk, systematisk och dramatisk. Noga med detaljer beskriver den som är pedantisk, vilket inte är samma sak som att vara bunden vid en lära.',
     'agreed', null),
    ('ord-23',
     -- före
     'Vad betyder ”implicera”?', null, '["utesluta","bevisa med experiment","innebära / antyda","citera"]'::jsonb, 2,
     'Att implicera är att innebära eller antyda något utan att säga det rakt ut. Utesluta är motsatsen, då det innebär att avlägsna eller frånta möjligheten, inte att antyda. Bevisa med experiment syftar på empirisk verifiering, vilket är en mycket starkare och annorlunda process än att antyda. Citera handlar om att återge någons ord, inte om att låta något förstås indirekt.',
     -- efter (passage oförändrad)
     'Vad betyder ”implicera”?', null, '["förklara","försvåra","innebära","kopiera","stryka på"]'::jsonb, 2,
     'Att implicera är att innebära eller medföra något som en följd: ”ett ja till förslaget implicerar att skatten måste höjas”. Förklara, försvåra, kopiera och stryka på är betydelser av de liknande orden explicera, komplicera, duplicera och applicera.',
     'agreed', null),
    ('ord-24',
     -- före
     'Vad betyder ”koherent”?', null, '["sammanhängande / logiskt enhetlig","osammanhängande","lång","poetisk"]'::jsonb, 0,
     'Koherent betyder sammanhängande och logiskt enhetlig, utan inbördes motsägelser. Osammanhängande är motsatsen, eftersom det just beskriver brist på inre logik. Lång handlar om omfång, vilket är oberoende av om resonemanget hänger ihop. Poetisk rör stilistiskt bildspråk, vilket inte har med logisk sammanhållning att göra.',
     -- efter (passage oförändrad)
     'Vad betyder ”koherent”?', null, '["kunnig","inneboende","sammanstrålande","sammanhängande","oföränderlig"]'::jsonb, 3,
     'Koherent betyder sammanhängande, alltså att delarna hänger ihop logiskt och bildar en helhet: ”uppsatsen var koherent från inledning till slutsats”. Kunnig, inneboende, sammanstrålande och oföränderlig är betydelser av de liknande orden kompetent, inherent, konvergent och konstant.',
     'agreed', null),
    ('mek-69',
     -- före
     'Välj det alternativ som bäst fyller i luckorna.', 'c07eca853331c68ec9c8262771612050', '["så / att","ju / desto","varken / eller","dels / dels"]'::jsonb, 0,
     '"Så … att" anger följden av vagheten som beskrivs, vilket är den relation meningen bygger på. "Ju … desto" uttrycker proportionalitet mellan två storheter, inte en enkel följdrelation. "Varken … eller" nekar båda leden och passar inte som följdkonstruktion. "Dels … dels" räknar bara upp led utan att ange en följd.',
     -- efter
     'Välj det alternativ som bäst fyller i luckorna.', 'Definitionen var ____ vag ____ jämförbarheten mellan studierna i praktiken blev omöjlig.', '["så / att","ju / desto","varken / eller","dels / dels"]'::jsonb, 0,
     '"Så … att" anger följden av vagheten som beskrivs, vilket är den relation meningen bygger på. "Ju … desto" uttrycker proportionalitet mellan två storheter, inte en enkel följdrelation. "Varken … eller" nekar båda leden och passar inte som följdkonstruktion. "Dels … dels" räknar bara upp led utan att ange en följd.',
     'agreed', null)
      ) as v(id,
             old_prompt, old_passage_md5, old_options, old_correct_index, old_explain,
             new_prompt, new_passage, new_options, new_correct_index, new_explain,
             new_verification, new_note)
  loop
    update public.questions q
       set prompt = fix.new_prompt,
           passage = coalesce(fix.new_passage, q.passage),
           options = fix.new_options,
           correct_index = fix.new_correct_index,
           explain = fix.new_explain,
           verification = fix.new_verification,
           verification_note = fix.new_note
     where q.id = fix.id
       and q.prompt = fix.old_prompt
       and md5(q.passage) is not distinct from fix.old_passage_md5
       and q.options = fix.old_options
       and q.correct_index = fix.old_correct_index
       and q.explain = fix.old_explain;
    get diagnostics updated = row_count;
    if updated = 1 then
      done := done + 1;
    elsif exists (
      select 1
        from public.questions q
       where q.id = fix.id
         and q.prompt = fix.new_prompt
         and (fix.new_passage is null or q.passage = fix.new_passage)
         and q.options = fix.new_options
         and q.correct_index = fix.new_correct_index
         and q.explain = fix.new_explain
    ) then
      already := already + 1;
    elsif exists (select 1 from public.questions q where q.id = fix.id) then
      skipped := skipped || fix.id;
    end if;
  end loop;

  raise notice '0021: % frågor rättade, % hade redan rättats, % hoppades över (annat innehåll än det granskade): %',
    done, already, coalesce(array_length(skipped, 1), 0), array_to_string(skipped, ', ');
end
$$;
