import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Profilbilden till en expertprofil, med profilens publika id.
 *
 * Bildernas sökvägar i bucketen avatars börjar med kontots id (0039). Expertens
 * profil känns medvetet bara igen på public_id, så att den inte kan kopplas till
 * kontot i forumet och topplistorna (0029). Därför skickar servern bilden själv
 * i stället för att lämna ut sökvägen. Bara godkända bilder visas; bilden finns
 * redan publikt i forumet, så servern behöver inte kontrollera mer än att
 * profilen finns.
 */
export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const notFound = () => new Response(null, { status: 404, headers: { "Cache-Control": "public, max-age=300" } });

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/expertbild/[publicId]">) {
  const { publicId } = await ctx.params;
  if (!UUID.test(publicId)) return notFound();
  const admin = createAdminClient();
  if (!admin) return new Response(null, { status: 503 });

  const { data: profile } = await admin
    .from("expert_profiles")
    .select("user_id")
    .eq("public_id", publicId)
    .maybeSingle();
  if (!profile) return notFound();
  const { data: avatar } = await admin
    .from("user_avatars")
    .select("path")
    .eq("user_id", profile.user_id)
    .eq("status", "approved")
    .maybeSingle();
  if (!avatar) return notFound();

  const { data: file, error } = await admin.storage.from("avatars").download(avatar.path);
  if (error || !file) return notFound();
  return new Response(file, {
    headers: {
      "Content-Type": "image/webp",
      // Kort cache: en ny eller borttagen bild syns inom några minuter.
      "Cache-Control": "public, max-age=300, s-maxage=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
