import type { ChoiceQuestion } from "@/lib/practice";

/** Egna HP-stil-frågor — inte från officiella prov. */

export const XYZ_BANK: ChoiceQuestion[] = [
  {
    id: "xyz-1",
    kind: "xyz",
    prompt: "Ett rektangulärt rum är 6 m långt och 4 m brett. Hur stor är arean?",
    options: ["20 m²", "24 m²", "28 m²", "36 m²"],
    correctIndex: 1,
    explain: "Area = längd × bredd = 6 × 4 = 24 m².",
  },
  {
    id: "xyz-2",
    kind: "xyz",
    prompt: "Priset sänks med 20 % från 250 kr. Vad kostar varan sedan?",
    options: ["180 kr", "200 kr", "210 kr", "230 kr"],
    correctIndex: 1,
    explain: "20 % av 250 = 50. 250 − 50 = 200 kr.",
  },
  {
    id: "xyz-3",
    kind: "xyz",
    prompt: "En cyklist kör 45 km på 1,5 timme. Vilken medelhastighet?",
    options: ["25 km/h", "30 km/h", "35 km/h", "40 km/h"],
    correctIndex: 1,
    explain: "45 / 1,5 = 30 km/h.",
  },
  {
    id: "xyz-4",
    kind: "xyz",
    prompt: "Lös 3x − 7 = 14. Vad är x?",
    options: ["5", "7", "9", "21"],
    correctIndex: 1,
    explain: "3x = 21 ⇒ x = 7.",
  },
  {
    id: "xyz-5",
    kind: "xyz",
    prompt: "En triangel har bas 10 cm och höjd 6 cm. Area?",
    options: ["16 cm²", "30 cm²", "60 cm²", "120 cm²"],
    correctIndex: 1,
    explain: "Area = (bas × höjd) / 2 = 60 / 2 = 30 cm².",
  },
  {
    id: "xyz-6",
    kind: "xyz",
    prompt: "Ett lån på 8 000 kr ökar med 5 % ränta på ett år. Ny skuld?",
    options: ["8 200 kr", "8 400 kr", "8 500 kr", "8 800 kr"],
    correctIndex: 1,
    explain: "5 % av 8 000 = 400. 8 000 + 400 = 8 400 kr.",
  },
  {
    id: "xyz-7",
    kind: "xyz",
    prompt: "Medelvärdet av 4, 8 och 12 är 8. Vilket tal ska läggas till så att medelvärdet blir 10?",
    options: ["10", "16", "18", "20"],
    correctIndex: 1,
    explain: "Summan ska bli 10 × 4 = 40. Nu 4+8+12=24. Saknas 16.",
  },
  {
    id: "xyz-8",
    kind: "xyz",
    prompt: "En karta har skalan 1:50 000. 4 cm på kartan motsvarar hur lång sträcka i verkligheten?",
    options: ["0,2 km", "2 km", "20 km", "200 km"],
    correctIndex: 1,
    explain: "4 cm × 50 000 = 200 000 cm = 2 000 m = 2 km.",
  },
];

export const KVA_BANK: ChoiceQuestion[] = [
  {
    id: "kva-1",
    kind: "kva",
    prompt: "Kvantitet I: 3/4. Kvantitet II: 0,75. Vilken är störst?",
    options: ["I är större", "II är större", "De är lika stora", "Går inte att avgöra"],
    correctIndex: 2,
    explain: "3/4 = 0,75. Kvantiteterna är lika.",
  },
  {
    id: "kva-2",
    kind: "kva",
    prompt: "Kvantitet I: 2² + 2². Kvantitet II: 2³. Vilken är störst?",
    options: ["I är större", "II är större", "De är lika stora", "Går inte att avgöra"],
    correctIndex: 2,
    explain: "I: 4+4=8. II: 8. Lika.",
  },
  {
    id: "kva-3",
    kind: "kva",
    prompt: "x > 0. Kvantitet I: 2x. Kvantitet II: x + 3. Vilken är störst?",
    options: ["I är större", "II är större", "De är lika stora", "Går inte att avgöra"],
    correctIndex: 3,
    explain: "Beror på x. Om x=1 är II större; om x=4 är I större.",
  },
  {
    id: "kva-4",
    kind: "kva",
    prompt: "Kvantitet I: 15 % av 80. Kvantitet II: 20 % av 60. Vilken är störst?",
    options: ["I är större", "II är större", "De är lika stora", "Går inte att avgöra"],
    correctIndex: 2,
    explain: "I: 12. II: 12. Lika.",
  },
  {
    id: "kva-5",
    kind: "kva",
    prompt: "Kvantitet I: arean av en kvadrat med sidan 5. Kvantitet II: 24. Vilken är störst?",
    options: ["I är större", "II är större", "De är lika stora", "Går inte att avgöra"],
    correctIndex: 0,
    explain: "I: 25. 25 > 24.",
  },
  {
    id: "kva-6",
    kind: "kva",
    prompt: "Kvantitet I: (−3)². Kvantitet II: −9. Vilken är störst?",
    options: ["I är större", "II är större", "De är lika stora", "Går inte att avgöra"],
    correctIndex: 0,
    explain: "(−3)² = 9, vilket är större än −9.",
  },
  {
    id: "kva-7",
    kind: "kva",
    prompt: "Ett tal avrundas till 7,4. Kvantitet I: det ursprungliga talet. Kvantitet II: 7,35. Vilken är störst?",
    options: ["I är större", "II är större", "De är lika stora", "Går inte att avgöra"],
    correctIndex: 3,
    explain: "Ett tal avrundat till 7,4 kan ligga i [7,35 ; 7,45). Relationen till 7,35 är inte entydig (kan vara lika eller större).",
  },
  {
    id: "kva-8",
    kind: "kva",
    prompt: "Kvantitet I: 1/2 + 1/3. Kvantitet II: 5/6. Vilken är störst?",
    options: ["I är större", "II är större", "De är lika stora", "Går inte att avgöra"],
    correctIndex: 2,
    explain: "1/2 + 1/3 = 3/6 + 2/6 = 5/6. Lika.",
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
    explain: "Du behöver båda värdena för att få summan. Varken (1) eller (2) ensam räcker.",
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
    explain: "Delbart med 4 ⇒ jämnt. Delbart med 2 ⇒ jämnt. Vardera räcker.",
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
    explain: "Omkrets 24 och längd 8 ger bredd 4, sedan area 32. Båda behövs.",
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
    explain: "(1) ger k = 4 eller k = −4, så tecknet är okänt. (2) säger direkt att k är positivt.",
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
    explain: "Medelvärdet är (a+b)/2. (1) ger 10 direkt. (2) ensam räcker inte.",
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
    explain: "12 är 40 % ⇒ totalt 30. Båda uppgifterna behövs.",
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
    explain: "Om p = 0 är produkten 0 oavsett q. (1) räcker. (2) ensam räcker inte.",
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
    explain: "Du måste veta både x och y för att kolla om y = 2x + 1. 7 = 2·3 + 1 stämmer, men bara tillsammans.",
  },
];
