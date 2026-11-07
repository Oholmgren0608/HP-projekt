import { describe, expect, it } from "vitest";
import { interpretModeration } from "./rules";
import { validateUpload } from "./upload";

const text = (t: string, stop = "end_turn") => ({ stop_reason: stop, content: [{ type: "text", text: t }] });

describe("tolkning av bildkontrollen", () => {
  it("godkänner bara när allowed är sant och kategorin är ok", () => {
    expect(interpretModeration(text('{"allowed":true,"category":"ok","reason":"Ser bra ut"}'))).toEqual({ decision: "approved" });
    const contradictory = interpretModeration(text('{"allowed":true,"category":"hate","reason":"Symbol"}'));
    expect(contradictory.decision).toBe("rejected");
  });

  it("underkänner med skäl och kategori", () => {
    const r = interpretModeration(text('{"allowed":false,"category":"personal_info","reason":"Bilden visar ett telefonnummer."}'));
    expect(r).toEqual({ decision: "rejected", category: "personal_info", reason: "Bilden visar ett telefonnummer." });
  });

  it("ett avböjande från modellen räknas som underkänt", () => {
    const r = interpretModeration({ stop_reason: "refusal", content: [] });
    expect(r.decision).toBe("rejected");
  });

  it("ett svar som inte går att tolka lämnas till teamet", () => {
    expect(interpretModeration(text("inte json")).decision).toBe("unavailable");
    expect(interpretModeration(text('{"category":"ok"}')).decision).toBe("unavailable");
    expect(interpretModeration({ stop_reason: "max_tokens", content: [] }).decision).toBe("unavailable");
  });

  it("ett tomt skäl får ett standardskäl", () => {
    const r = interpretModeration(text('{"allowed":false,"category":"other","reason":"  "}'));
    expect(r.decision === "rejected" && r.reason.length > 0).toBe(true);
  });
});

describe("validering av uppladdningen", () => {
  it("tar emot JPEG, PNG och WebP upp till 5 MB", () => {
    expect(validateUpload({ size: 100_000, type: "image/jpeg" })).toBeNull();
    expect(validateUpload({ size: 100_000, type: "image/webp" })).toBeNull();
  });
  it("avvisar andra typer, tomma och för stora filer", () => {
    expect(validateUpload({ size: 100_000, type: "image/gif" })).toMatch(/JPEG/);
    expect(validateUpload({ size: 100_000, type: "image/svg+xml" })).toMatch(/JPEG/);
    expect(validateUpload({ size: 0, type: "image/png" })).toMatch(/tom/);
    expect(validateUpload({ size: 6 * 1024 * 1024, type: "image/png" })).toMatch(/för stor/);
  });
});
