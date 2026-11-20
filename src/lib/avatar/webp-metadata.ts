/**
 * Tar bort EXIF- och XMP-blocken ur en WebP-fil. Cloudflare Images behåller
 * som standard EXIF-taggen för upphovsrätt, och den kan innehålla ett namn.
 * Profilbilder ska sparas helt utan metadata, precis som med sharp.
 *
 * WebP är en RIFF-fil: "RIFF", storlek, "WEBP" och sedan block med en
 * fyrteckenskod, en storlek (little endian) och innehållet, utfyllt till jämnt
 * antal byte. VP8X-blockets första byte har flaggor för vilka block som finns.
 */
const DROPPED_CHUNKS = new Set(["EXIF", "XMP "]);
const VP8X_EXIF_FLAG = 0x08;
const VP8X_XMP_FLAG = 0x04;

function fourCC(bytes: Uint8Array, offset: number): string {
  return String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
}

export function stripWebpMetadata(webp: Uint8Array): Uint8Array {
  if (webp.length < 12 || fourCC(webp, 0) !== "RIFF" || fourCC(webp, 8) !== "WEBP") {
    throw new Error("Inte en WebP-fil.");
  }
  const view = new DataView(webp.buffer, webp.byteOffset, webp.byteLength);
  const kept: Uint8Array[] = [];
  let offset = 12;
  while (offset < webp.length) {
    if (offset + 8 > webp.length) throw new Error("Trasig WebP-fil.");
    const id = fourCC(webp, offset);
    const size = view.getUint32(offset + 4, true);
    const end = offset + 8 + size + (size % 2);
    if (end > webp.length) throw new Error("Trasig WebP-fil.");
    if (!DROPPED_CHUNKS.has(id)) {
      const chunk = webp.slice(offset, end);
      if (id === "VP8X") chunk[8] &= ~(VP8X_EXIF_FLAG | VP8X_XMP_FLAG);
      kept.push(chunk);
    }
    offset = end;
  }

  const bodyLength = kept.reduce((sum, chunk) => sum + chunk.length, 0);
  const out = new Uint8Array(12 + bodyLength);
  out.set(webp.subarray(0, 12));
  new DataView(out.buffer).setUint32(4, 4 + bodyLength, true);
  let position = 12;
  for (const chunk of kept) {
    out.set(chunk, position);
    position += chunk.length;
  }
  return out;
}
