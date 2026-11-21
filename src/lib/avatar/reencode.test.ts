import sharp from "sharp";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { reencodeAvatar } = await import("./reencode");

describe("reencodeAvatar (Node, sharp)", () => {
  it("kodar om till 256×256 WebP utan metadata", async () => {
    const jpeg = await sharp({ create: { width: 600, height: 400, channels: 3, background: "#cc3333" } })
      .jpeg()
      .withExif({ IFD0: { Copyright: "Anna Andersson" } })
      .toBuffer();
    const result = await reencodeAvatar(new Blob([new Uint8Array(jpeg)], { type: "image/jpeg" }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const meta = await sharp(result.webp).metadata();
    expect(meta).toMatchObject({ format: "webp", width: 256, height: 256 });
    expect(meta.exif).toBeUndefined();
  });

  it("avvisar bildformat som inte tas emot", async () => {
    const gif = await sharp({ create: { width: 4, height: 4, channels: 3, background: "#000" } }).gif().toBuffer();
    expect(await reencodeAvatar(new Blob([new Uint8Array(gif)]))).toEqual({ ok: false, reason: "format" });
  });

  it("avvisar filer som inte är bilder", async () => {
    expect(await reencodeAvatar(new Blob(["inte en bild"]))).toEqual({ ok: false, reason: "unreadable" });
  });
});
