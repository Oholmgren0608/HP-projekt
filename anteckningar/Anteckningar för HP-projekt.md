OK#Prioriteringar
1. Se till att all logik och alla funktioner inom appen funkar så bra som möjligt. Måste också se till så att frågorna är så indentiska till HP som möjligt (För att förbereda användaren på bästa sätt).
2. Förbättra design och layout på webbsidan så att den blir så enkelt som möjligt att använda. Webbappen har redan ett bra tema men layouten är inte optimal och 

#Förbättringar/åtgärder
 - [x] Ändra så att poäng prognosen bara ändras när ett specifikt antal frågor i varje delprov har besvarats. Testa med att börja med 10 frågor då detta man har mer data att arbeta med och är likt andra HP appar.
 
- [ ] Skapa en funktion i nivåtest sidan som tillåter användaren att bestämma hur mycket frågor de vill besvara på nivåtestet. Detta ger användaren möjligheten att få en bättre veckoplan och analys av deras kunskaper om de beviljar det.

 - [ ] Lägg till en logik/funktion som är att webbappen analyserar resultaten som användaren har fått (antingen tidigare hp elr nivåtest), antal tid per vecka de vill plugga och hu långt kvar det är tills prov-dagen. Om t.ex resultaten är dåliga på flera eller alla delprov, användaren väljer att plugga bara 7 timmar om veckan och provet börjar om 4 veckor. Bör webappen rekommendera användaren att plugga x>7 timmar om veckan. Då använderan kommer mest troligt inte hinna förbättra deras kunskaper inom alla områden som har brister. Webappen måste ha en bra logik som baserar sig på forskning som kan avgöra om pluggtimmarna räcker och om det inte är fallet bästemmer en specifik räckvid av pluggtimmar. Detta ska dock bara vara en rekommendation. Det är användaren som har all kontroll i slutändan.

- [ ] Ha mer dupgående/detaljerade förklaringar på rättningarna. Alltså förklara hur/vad det är som gör det korrekta svaret "korrekt" (det finns redan andra HP appar som gör detta). Detta ska göras för att användaren ska få en djupare förståelse vilket leder till ökad kunskap.

- [x] Förnya öva sidan så att den har subpages för alla delprov (och flashcards). Användaren kan sedan välja vilken delprov de vill öva på och sedan välja hur många frågor de vill ha i övningen (får välja mellan 5-20 frågor och 1-5 frågor på läs delproven). Ha läsbiblioteket som sin egna sida i webbsidan.

#Tokenbudget
Måste vara smart och noggran med vilka modeller jag använder beroende på uppgiften. Har bara ett visst antal credits och vill spara på så mycket pengar som möjligt. Möjlig strategi för detta är att använda den billigaste (och mest relevanta) modellen för en viss uppgift och sedan pusha det som en branch. Om modellen lyckas bra med uppgiften mergar vi till main, annars raderar vi branchen, låter en annan modell göra uppgiften osv. På detta sätt lär jag mig vad för sort uppgifter olika modeller klarar av att genomföra effektivt. Detta betyder att jag kommer behöver experimentera i början och potentiellt bränna mer pengar, men i långsikt så är det mer sparsamt. 
