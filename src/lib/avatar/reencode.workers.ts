import "server-only";
import { env } from "cloudflare:workers";
import type { ReencodeResult } from "./reencode";
import { AVATAR_INPUT_FORMATS, AVATAR_MAX_INPUT_PIXELS, AVATAR_SIZE, AVATAR_WEBP_QUALITY } from "./upload";
import { stripWebpMetadata } from "./webp-metadata";

const ALLOWED_TYPES = new Set<string>(AVATAR_INPUT_FORMATS.map((format) => `image/${format}`));

/**
 * Cloudflare Workers-varianten av reencode.ts. vite.config.ts byter in den här
 * modulen i vinext-bygget, eftersom sharp inte går att köra på Workers.
 * Cloudflare Images (bindningen IMAGES i cloudflare.config.ts) gör
 * omkodningen och följer EXIF-riktningen. stripWebpMetadata tar bort den
 * metadata som Images annars behåller. anim: false ger bara första bildrutan,
 * som pages: 1 i sharp.
 */
export async function reencodeAvatar(file: Blob): Promise<ReencodeResult> {
  try {
    const info = await env.IMAGES.info(file.stream());
    if (!("width" in info) || !ALLOWED_TYPES.has(info.format)) {
      return { ok: false, reason: "format" };
    }
    if (info.width * info.height > AVATAR_MAX_INPUT_PIXELS) {
      return { ok: false, reason: "unreadable" };
    }
    const result = await env.IMAGES.input(file.stream())
      .transform({ width: AVATAR_SIZE, height: AVATAR_SIZE, fit: "cover" })
      .output({ format: "image/webp", quality: AVATAR_WEBP_QUALITY, anim: false });
    const webp = new Uint8Array(await new Response(result.image()).arrayBuffer());
    return { ok: true, webp: Buffer.from(stripWebpMetadata(webp)) };
  } catch {
    return { ok: false, reason: "unreadable" };
  }
}
