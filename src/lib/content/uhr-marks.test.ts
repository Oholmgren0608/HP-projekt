import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { marksFileUrl, marksToSvg, validateMarks, type UhrMarks, type UhrMarksFile } from "./uhr-marks";

const ROOT = join(__dirname, "..", "..", "..");
const MARKS_DIR = join(ROOT, "public", "uhr", "forklaring");

const base: UhrMarks = {
  image: "/uhr/hp-2019-10-20/p1-q6.webp",
  width: 633,
  height: 276,
  caption: "Basvinklarna är 50° och 63°, så v = 67°.",
  shapes: [{ type: "label", x: 178, y: 240, text: "50°" }],
};

describe("bildförklaringarnas format", () => {
  it("hittar provpassets fil från frågans id", () => {
    expect(marksFileUrl("hp-2019-10-20-p1-q29")).toBe("/uhr/forklaring/hp-2019-10-20-p1.json");
    expect(marksFileUrl("xyz-12")).toBeNull();
  });

  it("godtar en korrekt markering och stoppar fel", () => {
    expect(validateMarks("x", base)).toEqual([]);
    expect(validateMarks("x", { ...base, caption: "kort" })).not.toEqual([]);
    expect(validateMarks("x", { ...base, scale: 5 })).not.toEqual([]);
    expect(validateMarks("x", { ...base, shapes: [] })).not.toEqual([]);
    expect(validateMarks("x", { ...base, shapes: [{ type: "box", x: 600, y: 10, w: 100, h: 10 }] })).not.toEqual([]);
    expect(validateMarks("x", { ...base, shapes: [{ type: "polygon", points: [[0, 0], [1, 1]] }] })).not.toEqual([]);
    expect(validateMarks("x", { ...base, image: "https://example.com/a.png" })).not.toEqual([]);
  });

  it("escapar texten i etiketterna", () => {
    const svg = marksToSvg({ ...base, shapes: [{ type: "label", x: 10, y: 10, text: "<script>&" }] });
    expect(svg).toContain("&lt;script&gt;&amp;");
    expect(svg).not.toContain("<script>");
  });
});

describe("bildförklaringarna i public/uhr/forklaring", () => {
  const files = existsSync(MARKS_DIR) ? readdirSync(MARKS_DIR).filter((f) => f.endsWith(".json")) : [];
  const bank = JSON.parse(readFileSync(join(ROOT, "src", "lib", "content", "fallback-bank.json"), "utf8"));
  const figureOf = new Map<string, string>(
    (bank.questions ?? bank)
      .filter((q: { id: string; figureUrl?: string }) => q.id.startsWith("hp-") && q.figureUrl)
      .map((q: { id: string; figureUrl: string }) => [q.id, q.figureUrl]),
  );

  it.each(files)("%s hör till publicerade frågor med bild och stämmer med bilderna", async (file) => {
    const data = JSON.parse(readFileSync(join(MARKS_DIR, file), "utf8")) as UhrMarksFile;
    expect(`${data.examId}-p${data.passNumber}.json`).toBe(file);
    for (const [id, m] of Object.entries(data.marks)) {
      expect(validateMarks(id, m)).toEqual([]);
      expect(id.startsWith(`${data.examId}-p${data.passNumber}-q`)).toBe(true);
      expect(m.image, id).toBe(figureOf.get(id));
      const meta = await sharp(join(ROOT, "public", m.image)).metadata();
      expect([meta.width, meta.height], id).toEqual([m.width, m.height]);
    }
  });
});
