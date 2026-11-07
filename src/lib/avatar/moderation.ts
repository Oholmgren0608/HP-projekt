import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import {
  MODERATION_SCHEMA,
  MODERATION_SYSTEM_PROMPT,
  interpretModeration,
  type ModerationOutcome,
} from "./rules";

/**
 * Kontrollerar en profilbild (256×256 WebP) med Claude Opus 5.5 innan den
 * syns för andra (Oscars val, docs/profilbild/plan.md). Saknas nyckeln eller
 * svarar inte tjänsten blir resultatet "unavailable" och bilden väntar på
 * teamet. Nyckeln (ANTHROPIC_API_KEY) finns bara på servern.
 */
export async function moderateAvatar(webp: Buffer): Promise<ModerationOutcome> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { decision: "unavailable", detail: "ANTHROPIC_API_KEY saknas" };
  }
  const client = new Anthropic({ timeout: 25_000, maxRetries: 1 });
  try {
    const response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 4000,
      // Avböjer modellen går frågan vidare till en reservmodell; avböjer även den räknas bilden som underkänd.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: { type: "json_schema", schema: MODERATION_SCHEMA } },
      system: MODERATION_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: "image/webp", data: webp.toString("base64") } },
            { type: "text", text: "Granska den här profilbilden." },
          ],
        },
      ],
    });
    return interpretModeration({
      stop_reason: response.stop_reason,
      content: response.content.map((b) => (b.type === "text" ? { type: "text", text: b.text } : { type: b.type })),
    });
  } catch (e) {
    const detail =
      e instanceof Anthropic.APIError ? `API-fel ${e.status ?? ""}`.trim() : e instanceof Error ? e.message : "okänt fel";
    return { decision: "unavailable", detail };
  }
}
