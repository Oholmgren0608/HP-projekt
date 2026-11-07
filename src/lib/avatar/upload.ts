/** Gränser för profilbilder, delas av webbläsaren och servern (docs/profilbild/plan.md). */
export const AVATAR_MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const AVATAR_SIZE = 256;
/** Hur många uppladdningar (även underkända) en användare får göra per dygn. */
export const AVATAR_DAILY_LIMIT = 10;
export const AVATAR_INPUT_FORMATS = ["jpeg", "png", "webp"] as const;

/** Kontrollerar att filen ser ut som en bild vi tar emot, innan den läses in. */
export function validateUpload(file: { size: number; type: string }): string | null {
  if (file.size <= 0) return "Filen är tom.";
  if (file.size > AVATAR_MAX_UPLOAD_BYTES) return "Bilden är för stor (högst 5 MB).";
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return "Bara JPEG, PNG och WebP fungerar.";
  }
  return null;
}
