import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { createAdminClient, verifyUser } from "@/lib/supabase/server";
import { moderateAvatar } from "@/lib/avatar/moderation";
import { AVATAR_DAILY_LIMIT, AVATAR_INPUT_FORMATS, AVATAR_SIZE, validateUpload } from "@/lib/avatar/upload";

/**
 * Profilbild (docs/profilbild/plan.md). POST tar emot en bild från den inloggade
 * användaren, kodar om den till 256×256 WebP utan metadata, låter Claude
 * kontrollera den och sparar den bara om den godkänns (eller som väntande hos
 * teamet om kontrollen inte svarar). DELETE tar bort bilden.
 */
export const runtime = "nodejs";
export const maxDuration = 60;

const BUCKET = "avatars";

function json(status: number, body: Record<string, unknown>) {
  return Response.json(body, { status });
}

async function authenticate(request: Request) {
  const token = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const userId = await verifyUser(token);
  const admin = createAdminClient();
  return { userId, admin };
}

export async function POST(request: Request) {
  const { userId, admin } = await authenticate(request);
  if (!userId) return json(401, { error: "Du måste vara inloggad." });
  if (!admin) return json(503, { error: "Profilbilder är inte konfigurerade." });

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("avatar_upload_attempts")
    .select("user_id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);
  if ((count ?? 0) >= AVATAR_DAILY_LIMIT) {
    return json(429, { error: "Du har bytt bild många gånger i dag. Försök igen i morgon." });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json(400, { error: "Skicka en bild." });
  }
  const file = form.get("file");
  if (!(file instanceof File)) return json(400, { error: "Skicka en bild." });
  const invalid = validateUpload(file);
  if (invalid) return json(400, { error: invalid });

  let webp: Buffer;
  try {
    const input = Buffer.from(await file.arrayBuffer());
    const image = sharp(input, { limitInputPixels: 40_000_000, pages: 1 });
    const meta = await image.metadata();
    if (!meta.format || !(AVATAR_INPUT_FORMATS as readonly string[]).includes(meta.format)) {
      return json(400, { error: "Bara JPEG, PNG och WebP fungerar." });
    }
    // rotate() följer EXIF-riktningen; metadata (plats, kamera) följer inte med.
    webp = await image.rotate().resize(AVATAR_SIZE, AVATAR_SIZE, { fit: "cover" }).webp({ quality: 82 }).toBuffer();
  } catch {
    return json(400, { error: "Bilden gick inte att läsa." });
  }

  await admin.from("avatar_upload_attempts").insert({ user_id: userId });
  const outcome = await moderateAvatar(webp);
  if (outcome.decision === "rejected") {
    return json(422, { status: "rejected", error: `Bilden godkändes inte: ${outcome.reason}` });
  }
  if (outcome.decision === "unavailable") {
    console.warn("[profilbild] kontrollen svarade inte:", outcome.detail);
  }

  const path = `${userId}/${randomUUID()}.webp`;
  const upload = await admin.storage
    .from(BUCKET)
    .upload(path, webp, { contentType: "image/webp", cacheControl: "31536000", upsert: false });
  if (upload.error) return json(502, { error: "Bilden kunde inte sparas. Försök igen." });

  const { data: previous } = await admin.from("user_avatars").select("path").eq("user_id", userId).maybeSingle();
  const status = outcome.decision === "approved" ? "approved" : "pending";
  const { error } = await admin.from("user_avatars").upsert({
    user_id: userId,
    path,
    status,
    checked_by: "claude",
    reason: outcome.decision === "approved" ? null : "Kontrollen svarade inte; väntar på teamet.",
    updated_at: new Date().toISOString(),
  });
  if (error) {
    await admin.storage.from(BUCKET).remove([path]);
    return json(502, { error: "Bilden kunde inte sparas. Försök igen." });
  }
  if (previous?.path && previous.path !== path) await admin.storage.from(BUCKET).remove([previous.path]);
  return json(200, { status, path });
}

export async function DELETE(request: Request) {
  const { userId, admin } = await authenticate(request);
  if (!userId) return json(401, { error: "Du måste vara inloggad." });
  if (!admin) return json(503, { error: "Profilbilder är inte konfigurerade." });
  const { data } = await admin.from("user_avatars").select("path").eq("user_id", userId).maybeSingle();
  await admin.from("user_avatars").delete().eq("user_id", userId);
  if (data?.path) await admin.storage.from(BUCKET).remove([data.path]);
  return json(200, { status: "none" });
}
