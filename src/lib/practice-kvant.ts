import type { ChoiceQuestion } from "@/lib/practice-types";

/** Egna HP-stil-frågor — inte från officiella prov. */

export const XYZ_BANK: ChoiceQuestion[] = [
  {
    id: "xyz-1",
    kind: "xyz",
    prompt: "Ett rektangulärt rum är 6 m långt och 4 m brett. Hur stor är arean?",
    options: ["20 m²", "24 m²", "28 m²", "36 m²"],
    correctIndex: 1,
    explain: "Arean av en rektangel fås genom längd gånger bredd: 6 × 4 = 24 m². 20 m² och 28 m² kommer från felräkningar av multiplikationen, och 36 m² är istället kvadraten på 6, inte rektangelns area.",
  },
  {
    id: "xyz-2",
    kind: "xyz",
    prompt: "Priset sänks med 20 % från 250 kr. Vad kostar varan sedan?",
    options: ["180 kr", "200 kr", "210 kr", "230 kr"],
    correctIndex: 1,
    explain: "20 procent av 250 kr är 50 kr, och 250 − 50 = 200 kr efter sänkningen. 230 kr motsvarar en sänkning med bara 20 kr, 210 kr är för litet avdrag, och 180 kr är ett för stort avdrag för en 20-procentig sänkning.",
  },
  {
    id: "xyz-3",
    kind: "xyz",
    prompt: "En cyklist kör 45 km på 1,5 timme. Vilken medelhastighet?",
    options: ["25 km/h", "30 km/h", "35 km/h", "40 km/h"],
    correctIndex: 1,
    explain: "Medelhastigheten fås genom sträcka delat med tid: 45 km / 1,5 h = 30 km/h. 25 km/h och 35 km/h ligger nära men stämmer inte med divisionen, och 40 km/h skulle kräva en kortare tid än 1,5 timme.",
  },
  {
    id: "xyz-4",
    kind: "xyz",
    prompt: "Lös 3x − 7 = 14. Vad är x?",
    options: ["5", "7", "9", "21"],
    correctIndex: 1,
    explain: "Ekvationen ger 3x = 14 + 7 = 21, vilket ger x = 21/3 = 7. x = 5 och x = 9 uppfyller inte ekvationen vid insättning, och 21 är värdet på 3x, inte på x.",
  },
  {
    id: "xyz-5",
    kind: "xyz",
    prompt: "En triangel har bas 10 cm och höjd 6 cm. Area?",
    options: ["16 cm²", "30 cm²", "60 cm²", "120 cm²"],
    correctIndex: 1,
    explain: "Triangelns area beräknas som (bas × höjd)/2 = (10 × 6)/2 = 30 cm². 60 cm² är produkten bas gånger höjd utan att delas med 2, 120 cm² är dubbelt så mycket, och 16 cm² stämmer inte med formeln alls.",
  },
  {
    id: "xyz-6",
    kind: "xyz",
    prompt: "Ett lån på 8 000 kr ökar med 5 % ränta på ett år. Ny skuld?",
    options: ["8 200 kr", "8 400 kr", "8 500 kr", "8 800 kr"],
    correctIndex: 1,
    explain: "Räntan blir 5 procent av 8 000 kr, det vill säga 400 kr, så den nya skulden är 8 000 + 400 = 8 400 kr. 8 200 kr och 8 500 kr bygger på felaktig procentberäkning, och 8 800 kr motsvarar snarare en räntesats på 10 procent.",
  },
  {
    id: "xyz-7",
    kind: "xyz",
    prompt: "Medelvärdet av 4, 8 och 12 är 8. Vilket tal ska läggas till så att medelvärdet blir 10?",
    options: ["10", "16", "18", "20"],
    correctIndex: 1,
    explain: "För att medelvärdet av fyra tal ska bli 10 måste summan vara 4 × 10 = 40. De tre kända talen summerar till 4 + 8 + 12 = 24, så det fjärde talet måste vara 40 − 24 = 16. 10 och 18 ger fel totalsumma, och 20 skulle ge ett medelvärde högre än 10.",
  },
  {
    id: "xyz-8",
    kind: "xyz",
    prompt: "En karta har skalan 1:50 000. 4 cm på kartan motsvarar hur lång sträcka i verkligheten?",
    options: ["0,2 km", "2 km", "20 km", "200 km"],
    correctIndex: 1,
    explain: "Skalan 1:50 000 innebär att 4 cm på kartan motsvarar 4 × 50 000 = 200 000 cm i verkligheten, vilket är 2 000 m, det vill säga 2 km. 0,2 km är hundra gånger för litet, och 20 km respektive 200 km är för stora eftersom de bygger på en felaktig enhetsomvandling.",
  },
];

export const KVA_BANK: ChoiceQuestion[] = [
  {
    id: "kva-1",
    kind: "kva",
    prompt: "Kvantitet I: 3/4. Kvantitet II: 0,75. Vilken är störst?",
    options: ["I är större", "II är större", "De är lika stora", "Går inte att avgöra"],
    correctIndex: 2,
    explain: "Kvantitet I: 3/4 = 0,75. Kvantitet II: 0,75. De två uttrycken beskriver exakt samma tal, så kvantiteterna är lika stora. Alternativen där I eller II anges som större bygger på att man inte omvandlar bråket till decimalform, och att avgörandet skulle vara omöjligt stämmer inte eftersom talen kan jämföras exakt.",
  },
  {
    id: "kva-2",
    kind: "kva",
    prompt: "Kvantitet I: 2² + 2². Kvantitet II: 2³. Vilken är störst?",
    options: ["I är större", "II är större", "De är lika stora", "Går inte att avgöra"],
    correctIndex: 2,
    explain: "Kvantitet I: 2² + 2² = 4 + 4 = 8. Kvantitet II: 2³ = 8. Båda uttrycken ger samma värde, så kvantiteterna är lika stora. Att påstå att I eller II är större bygger på en felaktig uträkning av potenserna, och uppgiften går att avgöra exakt utan någon okänd variabel.",
  },
  {
    id: "kva-3",
    kind: "kva",
    prompt: "x > 0. Kvantitet I: 2x. Kvantitet II: x + 3. Vilken är störst?",
    options: ["I är större", "II är större", "De är lika stora", "Går inte att avgöra"],
    correctIndex: 3,
    explain: "Kvantitet I: 2x. Kvantitet II: x + 3. Om x = 1 blir I = 2 och II = 4, så II är större, men om x = 4 blir I = 8 och II = 7, så då är I större i stället. Eftersom relationen beror på vilket positivt värde x har går det inte att avgöra vilken kvantitet som är störst, så varken I är större eller II är större eller lika stora kan gälla generellt.",
  },
  {
    id: "kva-4",
    kind: "kva",
    prompt: "Kvantitet I: 15 % av 80. Kvantitet II: 20 % av 60. Vilken är störst?",
    options: ["I är större", "II är större", "De är lika stora", "Går inte att avgöra"],
    correctIndex: 2,
    explain: "Kvantitet I: 15 procent av 80 är 12. Kvantitet II: 20 procent av 60 är också 12. Kvantiteterna är alltså lika stora trots att procentsatserna och grundtalen skiljer sig åt. Att I eller II skulle vara större bygger på att man bara jämför procentsatserna eller grundtalen var för sig i stället för att räkna ut de faktiska värdena.",
  },
  {
    id: "kva-5",
    kind: "kva",
    prompt: "Kvantitet I: arean av en kvadrat med sidan 5. Kvantitet II: 24. Vilken är störst?",
    options: ["I är större", "II är större", "De är lika stora", "Går inte att avgöra"],
    correctIndex: 0,
    explain: "Kvantitet I: arean av en kvadrat med sidan 5 är 5² = 25. Kvantitet II är 24, vilket är mindre än 25, så kvantitet I är störst. Att II skulle vara större eller att de är lika bygger på en felaktig uträkning av kvadratens area, och relationen går att avgöra exakt eftersom inga okända variabler finns.",
  },
  {
    id: "kva-6",
    kind: "kva",
    prompt: "Kvantitet I: (−3)². Kvantitet II: −9. Vilken är störst?",
    options: ["I är större", "II är större", "De är lika stora", "Går inte att avgöra"],
    correctIndex: 0,
    explain: "Kvantitet I: (−3)² = 9, eftersom en negativ faktor multiplicerad med sig själv ger ett positivt tal. Kvantitet II är −9, vilket är betydligt mindre än 9, så kvantitet I är störst. Den vanliga fällan är att tro att (−3)² blir −9 genom att bara kvadrera talet 3 och behålla minustecknet, vilket skulle ge fel svar.",
  },
  {
    id: "kva-7",
    kind: "kva",
    prompt: "Ett tal avrundas till 7,4. Kvantitet I: det ursprungliga talet. Kvantitet II: 7,35. Vilken är störst?",
    options: ["I är större", "II är större", "De är lika stora", "Går inte att avgöra"],
    correctIndex: 3,
    explain: "Ett tal som avrundas till 7,4 kan ligga någonstans i intervallet 7,35 till precis under 7,45. Kvantitet II är exakt 7,35, vilket ligger i den nedre kanten av intervallet, så det ursprungliga talet kan vara lika med 7,35 eller större än 7,35 beroende på var i intervallet det faktiskt låg. Eftersom relationen mellan kvantiteterna varierar beroende på det exakta ursprungsvärdet går det inte att avgöra säkert vilken som är störst, eller om de är lika.",
  },
  {
    id: "kva-8",
    kind: "kva",
    prompt: "Kvantitet I: 1/2 + 1/3. Kvantitet II: 5/6. Vilken är störst?",
    options: ["I är större", "II är större", "De är lika stora", "Går inte att avgöra"],
    correctIndex: 2,
    explain: "Kvantitet I: 1/2 + 1/3 = 3/6 + 2/6 = 5/6. Kvantitet II är också 5/6, så kvantiteterna är lika stora. Att I eller II skulle vara större bygger på en felaktig hantering av gemensam nämnare vid additionen av bråken.",
  },
];

export const NOG_BANK: ChoiceQuestion[] = [
  {
    id: "nog-1",
    kind: "nog",
    prompt:
      "Vad är värdet av x + y? (1) x = 4. (2) y = 6. Vilken information räcker?",
    options: [
      "Bara (1) räcker",
      "Bara (2) räcker",
      "Båda behövs tillsammans, ingen ensam",
      "Inte ens båda räcker",
    ],
    correctIndex: 2,
    explain: "Påstående (1) ger bara x = 4 utan information om y, så summan x + y kan inte beräknas.\nPåstående (2) ger bara y = 6 utan information om x, vilket av samma skäl inte räcker ensamt.\nTillsammans ger de x + y = 4 + 6 = 10, så båda behövs för att lösa uppgiften.",
  },
  {
    id: "nog-2",
    kind: "nog",
    prompt:
      "Är n jämnt? (1) n är delbart med 4. (2) n är delbart med 2. Vilken information räcker?",
    options: [
      "Bara (1) räcker",
      "Bara (2) räcker",
      "Båda behövs tillsammans, ingen ensam",
      "Vardera räcker för sig",
    ],
    correctIndex: 3,
    explain: "Påstående (1) säger att n är delbart med 4, och alla tal som är delbara med 4 är per definition jämna, så (1) räcker ensamt.\nPåstående (2) säger direkt att n är delbart med 2, vilket är samma sak som att n är jämnt, så även (2) räcker ensamt.\nEftersom båda påståendena var för sig avgör frågan, räcker vardera för sig.",
  },
  {
    id: "nog-3",
    kind: "nog",
    prompt:
      "Vad är rektangelns area? (1) Längden är 8 cm. (2) Omkretsen är 24 cm. Vilken information räcker?",
    options: [
      "Bara (1) räcker",
      "Bara (2) räcker",
      "Båda behövs tillsammans, ingen ensam",
      "Inte ens båda räcker",
    ],
    correctIndex: 2,
    explain: "Påstående (1) ger bara längden 8 cm utan information om bredden, så arean går inte att beräkna ensamt.\nPåstående (2) ger enbart omkretsen 24 cm, vilket i sig kan motsvara oändligt många kombinationer av längd och bredd.\nTillsammans ger de bredden 24/2 − 8 = 4 cm och därmed arean 8 × 4 = 32 cm², så båda behövs.",
  },
  {
    id: "nog-4",
    kind: "nog",
    prompt:
      "Är heltalet k positivt? (1) k² = 16. (2) k > 0. Vilken information räcker?",
    options: [
      "Bara (1) räcker",
      "Bara (2) räcker",
      "Båda behövs tillsammans, ingen ensam",
      "Vardera räcker för sig",
    ],
    correctIndex: 1,
    explain: "Påstående (1) ger k² = 16, vilket betyder att k är antingen 4 eller −4, så tecknet på k förblir okänt och räcker inte ensamt.\nPåstående (2) säger direkt att k > 0, vilket omedelbart avgör att k är positivt.\nDärför räcker bara (2) för att besvara frågan.",
  },
  {
    id: "nog-5",
    kind: "nog",
    prompt:
      "Vad är medelvärdet av a och b? (1) a + b = 20. (2) a − b = 4. Vilken information räcker?",
    options: [
      "Bara (1) räcker",
      "Bara (2) räcker",
      "Båda behövs tillsammans, ingen ensam",
      "Vardera räcker för sig",
    ],
    correctIndex: 0,
    explain: "Medelvärdet av a och b är (a + b)/2. Påstående (1) ger a + b = 20 direkt, vilket genast ger medelvärdet 10, så (1) räcker ensamt.\nPåstående (2) ger bara skillnaden a − b = 4, vilket inte säger något om summan och därför inte räcker ensamt för att bestämma medelvärdet.",
  },
  {
    id: "nog-6",
    kind: "nog",
    prompt:
      "Hur många elever finns i klassen? (1) 40 % är flickor. (2) Det finns 12 flickor. Vilken information räcker?",
    options: [
      "Bara (1) räcker",
      "Bara (2) räcker",
      "Båda behövs tillsammans, ingen ensam",
      "Inte ens båda räcker",
    ],
    correctIndex: 2,
    explain: "Påstående (1) ger bara att 40 procent är flickor, utan ett faktiskt antal går det inte att räkna ut klassens storlek.\nPåstående (2) ger enbart antalet flickor, 12, utan att veta vilken andel de utgör av klassen.\nTillsammans ger de att 12 motsvarar 40 procent, vilket ger totalt 12 / 0,4 = 30 elever, så båda behövs.",
  },
  {
    id: "nog-7",
    kind: "nog",
    prompt:
      "Vad är p · q? (1) p = 0. (2) q = 17. Vilken information räcker?",
    options: [
      "Bara (1) räcker",
      "Bara (2) räcker",
      "Båda behövs tillsammans, ingen ensam",
      "Inte ens båda räcker",
    ],
    correctIndex: 0,
    explain: "Påstående (1) ger p = 0, och då blir produkten p · q alltid 0 oavsett vad q är, så (1) räcker ensamt.\nPåstående (2) ger bara q = 17 utan information om p, vilket inte räcker för att bestämma produkten.\nDärför räcker bara (1) för att besvara frågan.",
  },
  {
    id: "nog-8",
    kind: "nog",
    prompt:
      "Ligger punkten (x, y) på linjen y = 2x + 1? (1) x = 3. (2) y = 7. Vilken information räcker?",
    options: [
      "Bara (1) räcker",
      "Bara (2) räcker",
      "Båda behövs tillsammans, ingen ensam",
      "Inte ens båda räcker",
    ],
    correctIndex: 2,
    explain: "Påstående (1) ger bara x = 3 utan att ange y, så det går inte att kontrollera om punkten ligger på linjen.\nPåstående (2) ger bara y = 7 utan att ange x, vilket av samma skäl inte räcker ensamt.\nTillsammans ger de att 2 · 3 + 1 = 7, vilket stämmer med y-värdet, så båda behövs för att avgöra att punkten faktiskt ligger på linjen.",
  },
];
