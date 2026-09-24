import { getSupabase } from "@/lib/supabase/client";
import {
  validateFeatureRequest,
  type FeatureRequestCategory,
  type FeatureRequestKind,
} from "@/lib/feedback/feature-request";

export type FeatureRequestInput = {
  kind: FeatureRequestKind;
  category: FeatureRequestCategory;
  title: string;
  description: string;
  reason?: string;
};

export type SubmitFeatureRequestResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

type DeliveryPayload = {
  kind: FeatureRequestKind;
  category: FeatureRequestCategory;
  title: string;
  description: string;
  reason: string | null;
};

/**
 * Skickar in ett ärende (önskemål eller problemrapport).
 *
 * Det här är den enda kontaktytan för formuläret: byts mottagaren (adminpanel,
 * e-post, externt ärendesystem) är det `deliverFeatureRequest` längst ned som
 * ändras — anropet och returvärdet är desamma.
 */
export async function submitFeatureRequest(
  input: FeatureRequestInput,
): Promise<SubmitFeatureRequestResult> {
  const payload: DeliveryPayload = {
    kind: input.kind,
    category: input.category,
    title: input.title.trim(),
    description: input.description.trim(),
    reason: input.reason?.trim() ? input.reason.trim() : null,
  };

  const invalid = validateFeatureRequest({
    title: payload.title,
    description: payload.description,
    reason: payload.reason ?? "",
  });
  if (invalid) return { ok: false, error: invalid };

  try {
    const id = await deliverFeatureRequest(payload);
    return { ok: true, id };
  } catch (e) {
    console.warn(
      "[feedback] kunde inte skicka ärendet:",
      e instanceof Error ? e.message : e,
    );
    return {
      ok: false,
      error: "Kunde inte skicka just nu. Kontrollera anslutningen och försök igen.",
    };
  }
}

/**
 * Leveransmetoden. Enda stället som känner till vart ärendet tar vägen:
 * i dag RPC:n feature_request_submit (security definer), som sätter user_id
 * och status på serversidan. Kasta ett fel här om leveransen misslyckas —
 * submitFeatureRequest översätter det till ett användarvänligt meddelande.
 */
async function deliverFeatureRequest(payload: DeliveryPayload): Promise<string> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase är inte konfigurerat");

  const { data, error } = await supabase.rpc("feature_request_submit", {
    p_kind: payload.kind,
    p_category: payload.category,
    p_title: payload.title,
    p_description: payload.description,
    p_reason: payload.reason,
  });

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Ingen bekräftelse från servern");
  return data;
}
