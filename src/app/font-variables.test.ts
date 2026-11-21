import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Filerna läses som text: testet behöver varken Tailwind eller next/font.
const layout = readFileSync(new URL("./layout.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("./globals.css", import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

/** Variabeln som next/font sätter på <html>, t.ex. "--font-body". */
const fontVar = layout.match(/variable:\s*"(--[\w-]+)"/)?.[1];
/** Värdet på --font-sans i `@theme inline`. */
const themeFontSans = css.match(/@theme inline\s*\{[^}]*?--font-sans:\s*([^;]+);/)?.[1];

describe("teckensnittet", () => {
  it("next/font-variabeln heter inte som temats --font-sans", () => {
    // Med samma namn refererar --font-sans till sig själv, och då faller texten
    // tillbaka på Times New Roman så fort next/fonts klass inte vinner kaskaden.
    expect(fontVar).toBeDefined();
    expect(fontVar).not.toBe("--font-sans");
  });

  it("temats --font-sans pekar på next/font-variabeln och har en reserv", () => {
    expect(themeFontSans).toMatch(new RegExp(`^var\\(${fontVar},\\s*"[^"]+"\\),`));
  });
});
