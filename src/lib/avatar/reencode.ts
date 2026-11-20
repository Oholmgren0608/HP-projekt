import "server-only";
import sharp from "sharp";
import { AVATAR_INPUT_FORMATS, AVATAR_MAX_INPUT_PIXELS, AVATAR_SIZE, AVATAR_WEBP_QUALITY } from "./upload";

export type ReencodeResult =
  | { ok: true; webp: Buffer }
  | { ok: false; reason: "format" | "unreadable" };

/**
 * Kodar om en uppladdad profilbild till 256×256 WebP utan metadata. Den här
 * varianten körs i Node (next dev, next build) med sharp. sharp går inte att
 * köra på Cloudflare Workers, så där byter vite.config.ts ut modulen mot
 * reencode.workers.ts, som gör samma sak med Cloudflare Images.
 */
export async function reencodeAvatar(file: Blob): Promise<ReencodeResult> {
  try {
    const input = Buffer.from(await file.arrayBuffer());
    const image = sharp(input, { limitInputPixels: AVATAR_MAX_INPUT_PIXELS, pages: 1 });
    const meta = await image.metadata();
    if (!meta.format || !(AVATAR_INPUT_FORMATS as readonly string[]).includes(meta.format)) {
      return { ok: false, reason: "format" };
    }
    // rotate() följer EXIF-riktningen; metadata (plats, kamera) följer inte med.
    const webp = await image
      .rotate()
      .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: "cover" })
      .webp({ quality: AVATAR_WEBP_QUALITY })
      .toBuffer();
    return { ok: true, webp };
  } catch {
    return { ok: false, reason: "unreadable" };
  }
}
