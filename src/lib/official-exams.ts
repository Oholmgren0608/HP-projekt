/** Officiella HP-prov från UHR — PDF:erna streamas från studera.nu (ej omhostade). */

export type OfficialDocKind =
  | "kvantitativ"
  | "verbal"
  | "facit"
  | "kallor"
  | "normering"
  | "ovrigt"
  | "provpass";

export type OfficialDocument = {
  kind: OfficialDocKind;
  title: string;
  url: string;
};

export type OfficialExam = {
  id: string;
  date: string;
  title: string;
  year: number;
  pageUrl: string;
  documents: OfficialDocument[];
};

export const OFFICIAL_EXAMS: OfficialExam[] = [
  {
    "id": "2025-10-19",
    "date": "2025-10-19",
    "title": "Hösten 2025 · 19 oktober",
    "year": 2025,
    "pageUrl": "https://www.studera.nu/hogskoleprov/fpn/provfragor-facit-och-normering-hosten-2025/",
    "documents": [
      {
        "kind": "kvantitativ",
        "title": "Provpass 1 · Kvantitativ",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2025-10-19/provpass-1-kvant.pdf"
      },
      {
        "kind": "verbal",
        "title": "Provpass 3 · Verbal (utan ELF)",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2025-10-19/provpass-3-verb-utan-elf.pdf"
      },
      {
        "kind": "kvantitativ",
        "title": "Provpass 4 · Kvantitativ",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2025-10-19/provpass-4-kvant.pdf"
      },
      {
        "kind": "verbal",
        "title": "Provpass 5 · Verbal (utan ELF)",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2025-10-19/provpass-5-verb-utan-elf.pdf"
      },
      {
        "kind": "facit",
        "title": "Facit",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2025-10-19/hp-25b.pdf"
      },
      {
        "kind": "kallor",
        "title": "Källförteckning",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2025-10-19/kallhanv.pdf"
      },
      {
        "kind": "normering",
        "title": "Normering verbal",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/normeringstabeller/normering-ht2025-19-oktober/norm25b_verb.pdf"
      },
      {
        "kind": "normering",
        "title": "Normering kvantitativ",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/normeringstabeller/normering-ht2025-19-oktober/norm25b_kvant.pdf"
      },
      {
        "kind": "normering",
        "title": "Normering hela provet",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/normeringstabeller/normering-ht2025-19-oktober/norm25b_helaprovet.pdf"
      }
    ]
  },
  {
    "id": "2025-04-05",
    "date": "2025-04-05",
    "title": "Våren 2025 · 5 april",
    "year": 2025,
    "pageUrl": "https://www.studera.nu/hogskoleprov/fpn/provfragor-och-facit-varen-2025/",
    "documents": [
      {
        "kind": "verbal",
        "title": "Provpass 2 · Verbal (utan ELF)",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2025-04-05/provpass-2-verb-utan-elf.pdf"
      },
      {
        "kind": "kvantitativ",
        "title": "Provpass 3 · Kvantitativ",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2025-04-05/provpass-3-kvant.pdf"
      },
      {
        "kind": "verbal",
        "title": "Provpass 4 · Verbal (utan ELF)",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2025-04-05/provpass-4-verb-utan-elf.pdf"
      },
      {
        "kind": "kvantitativ",
        "title": "Provpass 5 · Kvantitativ",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2025-04-05/provpass-5-kvant.pdf"
      },
      {
        "kind": "facit",
        "title": "Facit",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2025-04-05/hogskoleprovet-facit-25a.pdf"
      },
      {
        "kind": "kallor",
        "title": "Källförteckning",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2025-04-05/kallhanv.pdf"
      }
    ]
  },
  {
    "id": "2024-10-20",
    "date": "2024-10-20",
    "title": "Hösten 2024 · 20 oktober",
    "year": 2024,
    "pageUrl": "https://www.studera.nu/hogskoleprov/fpn/provfragor-och-facit-hosten-2024/",
    "documents": [
      {
        "kind": "kvantitativ",
        "title": "Provpass 1 · Kvantitativ",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2024-10-20/provpass-1-kvant.pdf"
      },
      {
        "kind": "verbal",
        "title": "Provpass 3 · Verbal (utan ELF)",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2024-10-20/provpass-3-verb-utan-elf.pdf"
      },
      {
        "kind": "kvantitativ",
        "title": "Provpass 4 · Kvantitativ",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2024-10-20/provpass-4-kvant.pdf"
      },
      {
        "kind": "verbal",
        "title": "Provpass 5 · Verbal (utan ELF)",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2024-10-20/provpass-5-verb-utan-elf.pdf"
      },
      {
        "kind": "facit",
        "title": "Facit",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2024-10-20/hogskoleprovet-facit-24b.pdf"
      },
      {
        "kind": "kallor",
        "title": "Källförteckning",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2024-10-20/kallhanv.pdf"
      }
    ]
  },
  {
    "id": "2024-04-13",
    "date": "2024-04-13",
    "title": "Våren 2024 · 13 april",
    "year": 2024,
    "pageUrl": "https://www.studera.nu/hogskoleprov/fpn/provfragor-och-facit-varen-2024/",
    "documents": [
      {
        "kind": "verbal",
        "title": "Provpass 1 · Verbal (utan ELF)",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2024-04-13/provpass-1-verb-utan-elf.pdf"
      },
      {
        "kind": "kvantitativ",
        "title": "Provpass 2 · Kvantitativ",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2024-04-13/provpass-2-kvant.pdf"
      },
      {
        "kind": "verbal",
        "title": "Provpass 4 · Verbal (utan ELF)",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2024-04-13/provpass-4-verb-utan-elf.pdf"
      },
      {
        "kind": "kvantitativ",
        "title": "Provpass 5 · Kvantitativ",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2024-04-13/provpass-5-kvant.pdf"
      },
      {
        "kind": "facit",
        "title": "Facit",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2024-04-13/hogskoleprovet-facit-24a.pdf"
      },
      {
        "kind": "kallor",
        "title": "Källförteckning",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2024-04-13/kallhanv.pdf"
      }
    ]
  },
  {
    "id": "2023-10-22",
    "date": "2023-10-22",
    "title": "Hösten 2023 · 22 oktober",
    "year": 2023,
    "pageUrl": "https://www.studera.nu/hogskoleprov/fpn/provfragor-och-facit-hosten-2023/",
    "documents": [
      {
        "kind": "kvantitativ",
        "title": "Provpass 2 · Kvantitativ",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2023-10-22/provpass-2-kvant.pdf"
      },
      {
        "kind": "verbal",
        "title": "Provpass 3 · Verbal (utan ELF)",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2023-10-22/provpass-3-verb-utan-elf.pdf"
      },
      {
        "kind": "kvantitativ",
        "title": "Provpass 4 · Kvantitativ",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2023-10-22/provpass-4-kvant.pdf"
      },
      {
        "kind": "verbal",
        "title": "Provpass 5 · Verbal (utan ELF)",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2023-10-22/provpass-5-verb_utan-elf.pdf"
      },
      {
        "kind": "facit",
        "title": "Facit",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2023-10-22/hogskoleprovet-facit-23b.pdf"
      },
      {
        "kind": "kallor",
        "title": "Källförteckning",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2023-10-22/kallhanv.pdf"
      }
    ]
  },
  {
    "id": "2023-03-25",
    "date": "2023-03-25",
    "title": "Våren 2023 · 25 mars",
    "year": 2023,
    "pageUrl": "https://www.studera.nu/hogskoleprov/fpn/provfragor-och-facit-varen-2023/",
    "documents": [
      {
        "kind": "kvantitativ",
        "title": "Provpass 2 · Kvantitativ",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2023-03-25/provpass-2-kvant.pdf"
      },
      {
        "kind": "verbal",
        "title": "Provpass 3 · Verbal (utan ELF)",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2023-03-25/provpass-3-verb-utan-elf.pdf"
      },
      {
        "kind": "kvantitativ",
        "title": "Provpass 4 · Kvantitativ",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2023-03-25/provpass-4-kvant.pdf"
      },
      {
        "kind": "verbal",
        "title": "Provpass 5 · Verbal (utan ELF)",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2023-03-25/provpass-5-verb-utan-elf.pdf"
      },
      {
        "kind": "facit",
        "title": "Facit",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2023-03-25/hogskoleprovet-facit-23a.pdf"
      },
      {
        "kind": "kallor",
        "title": "Källförteckning",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2023-03-25/kallhanv.pdf"
      }
    ]
  },
  {
    "id": "2022-10-23",
    "date": "2022-10-23",
    "title": "Hösten 2022 · 23 oktober",
    "year": 2022,
    "pageUrl": "https://www.studera.nu/hogskoleprov/fpn/provfragor-och-facit-hosten-2022-23-okt/",
    "documents": [
      {
        "kind": "kvantitativ",
        "title": "Provpass 1 · Kvantitativ",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2022-10-23/provpass-1-kvant.pdf"
      },
      {
        "kind": "verbal",
        "title": "Provpass 2 · Verbal (utan ELF)",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2022-10-23/provpass-2-verb-utan-elf.pdf"
      },
      {
        "kind": "kvantitativ",
        "title": "Provpass 4 · Kvantitativ",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2022-10-23/provpass-4-kvant.pdf"
      },
      {
        "kind": "verbal",
        "title": "Provpass 5 · Verbal (utan ELF)",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2022-10-23/provpass-5-verb-utan-elf.pdf"
      },
      {
        "kind": "facit",
        "title": "Facit",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2022-10-23/hogskoleprovet-facit-22b.pdf"
      },
      {
        "kind": "kallor",
        "title": "Källförteckning",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2022-10-23/kallhanv.pdf"
      }
    ]
  },
  {
    "id": "2022-05-07",
    "date": "2022-05-07",
    "title": "Våren 2022 · 7 maj",
    "year": 2022,
    "pageUrl": "https://www.studera.nu/hogskoleprov/fpn/provfragor-och-facit-varen-2022-7-maj/",
    "documents": [
      {
        "kind": "kvantitativ",
        "title": "Provpass 1 · Kvantitativ",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2022-05-07/provpass-1-kvant.pdf"
      },
      {
        "kind": "verbal",
        "title": "Provpass 3 · Verbal (utan ELF)",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2022-05-07/provpass-3-verb-utan-elf.pdf"
      },
      {
        "kind": "kvantitativ",
        "title": "Provpass 4 · Kvantitativ",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2022-05-07/provpass-4-kvant.pdf"
      },
      {
        "kind": "verbal",
        "title": "Provpass 5 · Verbal (utan ELF)",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2022-05-07/provpass-5-verb-utan-elf.pdf"
      },
      {
        "kind": "facit",
        "title": "Facit",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2022-05-07/hogskoleprovet-facit-22a2-7-maj.pdf"
      },
      {
        "kind": "kallor",
        "title": "Källförteckning",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2022-05-07/kallhanv.pdf"
      }
    ]
  },
  {
    "id": "2022-03-12",
    "date": "2022-03-12",
    "title": "Våren 2022 · 12 mars",
    "year": 2022,
    "pageUrl": "https://www.studera.nu/hogskoleprov/fpn/provfragor-och-facit-varen-2022-12-mars/",
    "documents": [
      {
        "kind": "verbal",
        "title": "Provpass 2 · Verbal (utan ELF)",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2022-03-12/provpass-2-verb-utan-elf.pdf"
      },
      {
        "kind": "kvantitativ",
        "title": "Provpass 3 · Kvantitativ",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2022-03-12/provpass-3-kvant.pdf"
      },
      {
        "kind": "verbal",
        "title": "Provpass 4 · Verbal (utan ELF)",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2022-03-12/provpass-4-verb-utan-elf.pdf"
      },
      {
        "kind": "kvantitativ",
        "title": "Provpass 5 · Kvantitativ",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2022-03-12/provpass-5-kvant.pdf"
      },
      {
        "kind": "facit",
        "title": "Facit",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2022-03-12/hogskoleprovet-facit-22a1.pdf"
      },
      {
        "kind": "kallor",
        "title": "Källförteckning",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2022-03-12/kallhanv.pdf"
      }
    ]
  },
  {
    "id": "2021-10-24",
    "date": "2021-10-24",
    "title": "Hösten 2021 · 24 oktober",
    "year": 2021,
    "pageUrl": "https://www.studera.nu/hogskoleprov/fpn/provfragor-och-facit-hosten-2021-24-oktober/",
    "documents": [
      {
        "kind": "kvantitativ",
        "title": "Provpass 1 · Kvantitativ",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2021-10-24/211024-provpass-1-kvant.pdf"
      },
      {
        "kind": "verbal",
        "title": "Provpass 2 · Verbal (utan ELF)",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2021-10-24/211024-provpass-2-verb-utan-elf.pdf"
      },
      {
        "kind": "kvantitativ",
        "title": "Provpass 4 · Kvantitativ",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2021-10-24/211024-provpass-4-kvant.pdf"
      },
      {
        "kind": "verbal",
        "title": "Provpass 5 · Verbal (utan ELF)",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2021-10-24/211024-provpass-5-verb-utan-elf.pdf"
      },
      {
        "kind": "facit",
        "title": "Facit",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2021-10-24/hogskoleprovet-facit-21-b.pdf"
      },
      {
        "kind": "kallor",
        "title": "Källförteckning",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2021-10-24/kallhanv.pdf"
      }
    ]
  },
  {
    "id": "2021-05-08",
    "date": "2021-05-08",
    "title": "Våren 2021 · 8 maj",
    "year": 2021,
    "pageUrl": "https://www.studera.nu/hogskoleprov/fpn/provfragor-och-facit-varen-2021-8-maj/",
    "documents": [
      {
        "kind": "verbal",
        "title": "Provpass 1 · Verbal (utan ELF)",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2021-05-08/provpass-1-verb-utan-elf.pdf"
      },
      {
        "kind": "kvantitativ",
        "title": "Provpass 2 · Kvantitativ",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2021-05-08/provpass-2-kvant.pdf"
      },
      {
        "kind": "verbal",
        "title": "Provpass 4 · Verbal (utan ELF)",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2021-05-08/provpass-4-verb-utan-elf.pdf"
      },
      {
        "kind": "kvantitativ",
        "title": "Provpass 5 · Kvantitativ",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2021-05-08/provpass-5-kvant.pdf"
      },
      {
        "kind": "facit",
        "title": "Facit",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2021-05-08/hogskoleprovet-facit-21a2.pdf"
      },
      {
        "kind": "kallor",
        "title": "Källförteckning",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2021-05-08/kallhanv.pdf"
      }
    ]
  },
  {
    "id": "2021-03-13",
    "date": "2021-03-13",
    "title": "Våren 2021 · 13 mars",
    "year": 2021,
    "pageUrl": "https://www.studera.nu/hogskoleprov/fpn/provfragor-och-facit-varen-2021-13-mars/",
    "documents": [
      {
        "kind": "verbal",
        "title": "Provpass 1 · Verbal (utan ELF)",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2021-03-13/provpass-1-verb-utan-elf.pdf"
      },
      {
        "kind": "kvantitativ",
        "title": "Provpass 3 · Kvantitativ",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2021-03-13/hogskoleprovet-2021-03-13-del-3_kvantitativ-del.pdf"
      },
      {
        "kind": "verbal",
        "title": "Provpass 4 · Verbal (utan ELF)",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2021-03-13/provpass-4-verb-utan-elf.pdf"
      },
      {
        "kind": "kvantitativ",
        "title": "Provpass 5 · Kvantitativ",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2021-03-13/hogskoleprovet-2021-03-13-del-5_kvantitativ-del.pdf"
      },
      {
        "kind": "facit",
        "title": "Facit",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2021-03-13/hogskoleprovet-facit-21a1.pdf"
      },
      {
        "kind": "kallor",
        "title": "Källförteckning",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2021-03-13/kallhanv.pdf"
      }
    ]
  },
  {
    "id": "2020-10-25",
    "date": "2020-10-25",
    "title": "Hösten 2020 · 25 oktober",
    "year": 2020,
    "pageUrl": "https://www.studera.nu/hogskoleprov/fpn/provfragor-och-facit-hosten-2020/",
    "documents": [
      {
        "kind": "verbal",
        "title": "Provpass 2 · Verbal (utan ELF)",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2020-10-25/hogskoleprovet-2020-10-25-del-2_verbal-del-utan-elf.pdf"
      },
      {
        "kind": "kvantitativ",
        "title": "Provpass 3 · Kvantitativ",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2020-10-25/hogskoleprovet-2020-10-25-del-3_kvantitativ-del.pdf"
      },
      {
        "kind": "verbal",
        "title": "Provpass 4 · Verbal (utan ELF)",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2020-10-25/hogskoleprovet-2020-10-25-del-4_verbal-del-utan-elf.pdf"
      },
      {
        "kind": "kvantitativ",
        "title": "Provpass 5 · Kvantitativ",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2020-10-25/hogskoleprovet-2020-10-25-del-5_kvantitativ-del.pdf"
      },
      {
        "kind": "facit",
        "title": "Facit",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2020-10-25/facit-hp-2020-10-25.pdf"
      },
      {
        "kind": "kallor",
        "title": "Källförteckning",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2020-10-25/kallhanv.pdf"
      }
    ]
  },
  {
    "id": "2019-10-20",
    "date": "2019-10-20",
    "title": "Hösten 2019 · 20 oktober",
    "year": 2019,
    "pageUrl": "https://www.studera.nu/hogskoleprov/fpn/provfragor-och-facit-hosten-2019/",
    "documents": [
      {
        "kind": "kvantitativ",
        "title": "Provpass 1 · Kvantitativ",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2019-10-20/hogskoleprovet-2019-10-20-del-1_kvantitativ-del-version-1.pdf"
      },
      {
        "kind": "kvantitativ",
        "title": "Provpass 1 · Kvantitativ",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2019-10-20/provpass-1-2-kvant.pdf"
      },
      {
        "kind": "verbal",
        "title": "Provpass 3 · Verbal (utan ELF)",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2019-10-20/hogskoleprovet-2019-10-20-del-3_verbal-del-utan-elf.pdf"
      },
      {
        "kind": "kvantitativ",
        "title": "Provpass 4 · Kvantitativ",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2019-10-20/provpass-4-kvant.pdf"
      },
      {
        "kind": "verbal",
        "title": "Provpass 5 · Verbal (utan ELF)",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2019-10-20/provpass-5-verb-utan-elf.pdf"
      },
      {
        "kind": "facit",
        "title": "Facit",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2019-10-20/hogskoleprovet-facit-19b---version-1.pdf"
      },
      {
        "kind": "facit",
        "title": "Facit",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2019-10-20/hogskoleprovet-facit-19b---version-2.pdf"
      },
      {
        "kind": "kallor",
        "title": "Källförteckning",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2019-10-20/kallhanv.pdf"
      },
      {
        "kind": "ovrigt",
        "title": "provort-version-1-och-2",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2019-10-20/provort-version-1-och-2.pdf"
      }
    ]
  },
  {
    "id": "2019-04-06",
    "date": "2019-04-06",
    "title": "Våren 2019 · 6 april",
    "year": 2019,
    "pageUrl": "https://www.studera.nu/hogskoleprov/fpn/provfragor-och-facit-varen-2019/",
    "documents": [
      {
        "kind": "verbal",
        "title": "Provpass 1 · Verbal (utan ELF)",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2019-04-06/provpass-1-verb-utan-elf.pdf"
      },
      {
        "kind": "kvantitativ",
        "title": "Provpass 2 · Kvantitativ",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2019-04-06/hogskoleprovet-2019-04-06-del-2_kvantitativ-del2.pdf"
      },
      {
        "kind": "verbal",
        "title": "Provpass 4 · Verbal (utan ELF)",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2019-04-06/provpass-4-verb-utan-elf.pdf"
      },
      {
        "kind": "kvantitativ",
        "title": "Provpass 5 · Kvantitativ",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2019-04-06/hogskoleprovet-2019-04-06-del-5_kvantitativ-del.pdf"
      },
      {
        "kind": "facit",
        "title": "Facit",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2019-04-06/facit-hogskoleprovet-vt-2019.pdf"
      },
      {
        "kind": "kallor",
        "title": "Källförteckning",
        "url": "https://www.studera.nu/globalassets/05-hogskoleprovet/hp-2019-04-06/kallforteckning-2019-a---dtk_las_mek-0022.pdf"
      }
    ]
  }
];

export const OFFICIAL_INDEX_URL =
  "https://www.studera.nu/hogskoleprov/om/forbereda/tidigare/";
