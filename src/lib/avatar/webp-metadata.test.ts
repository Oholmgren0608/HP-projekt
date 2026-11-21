import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { stripWebpMetadata } from "./webp-metadata";

const ascii = (text: string) => [...text].map((c) => c.charCodeAt(0));

function chunk(id: string, payload: number[]): Uint8Array {
  const out = new Uint8Array(8 + payload.length + (payload.length % 2));
  out.set(ascii(id), 0);
  new DataView(out.buffer).setUint32(4, payload.length, true);
  out.set(payload, 8);
  return out;
}

function riff(...chunks: Uint8Array[]): Uint8Array {
  const bodyLength = chunks.reduce((sum, c) => sum + c.length, 0);
  const out = new Uint8Array(12 + bodyLength);
  out.set(ascii("RIFF"), 0);
  new DataView(out.buffer).setUint32(4, 4 + bodyLength, true);
  out.set(ascii("WEBP"), 8);
  let position = 12;
  for (const c of chunks) {
    out.set(c, position);
    position += c.length;
  }
  return out;
}

function chunkIds(webp: Uint8Array): string[] {
  const view = new DataView(webp.buffer, webp.byteOffset, webp.byteLength);
  const ids: string[] = [];
  for (let offset = 12; offset < webp.length; ) {
    ids.push(String.fromCharCode(...webp.subarray(offset, offset + 4)));
    const size = view.getUint32(offset + 4, true);
    offset += 8 + size + (size % 2);
  }
  return ids;
}

describe("stripWebpMetadata", () => {
  it("tar bort EXIF och XMP och nollar deras flaggor i VP8X", () => {
    const vp8x = [0x20 | 0x08 | 0x04, 0, 0, 0, 7, 0, 0, 7, 0, 0]; // ICC + EXIF + XMP
    const input = riff(
      chunk("VP8X", vp8x),
      chunk("ICCP", [1, 2, 3, 4]),
      chunk("VP8L", [9, 9, 9]),
      chunk("EXIF", [7, 7, 7]),
      chunk("XMP ", [5, 5]),
    );
    const out = stripWebpMetadata(input);
    expect(chunkIds(out)).toEqual(["VP8X", "ICCP", "VP8L"]);
    expect(out[20]).toBe(0x20); // VP8X-flaggorna: bara ICC kvar
    expect(new DataView(out.buffer).getUint32(4, true)).toBe(out.length - 8);
  });

  it("lämnar en enkel WebP utan metadata orörd", () => {
    const input = riff(chunk("VP8 ", [1, 2, 3, 4, 5]));
    expect(stripWebpMetadata(input)).toEqual(input);
  });

  it("kastar fel för filer som inte är WebP eller är trasiga", () => {
    expect(() => stripWebpMetadata(new Uint8Array([1, 2, 3]))).toThrow();
    const truncated = riff(chunk("VP8 ", [1, 2, 3, 4])).slice(0, 18);
    expect(() => stripWebpMetadata(truncated)).toThrow();
  });

  it("ger en riktig WebP utan EXIF som fortfarande går att läsa", async () => {
    const withExif = await sharp({ create: { width: 8, height: 8, channels: 3, background: "#3366cc" } })
      .webp()
      .withExif({ IFD0: { Copyright: "Anna Andersson" } })
      .toBuffer();
    expect((await sharp(withExif).metadata()).exif).toBeDefined();

    const stripped = Buffer.from(stripWebpMetadata(new Uint8Array(withExif)));
    const meta = await sharp(stripped).metadata();
    expect(meta.exif).toBeUndefined();
    expect(meta.width).toBe(8);
    expect(stripped.includes("Anna Andersson")).toBe(false);
  });
});
