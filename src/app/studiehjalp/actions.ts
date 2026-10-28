"use server";

import { createAdminClient, createUserClient, verifyUser } from "@/lib/supabase/server";
import { DOCUMENT_MAX_BYTES } from "@/lib/studiehjalp/types";

/**
 * Serverdelen av Studiehjälps dokumenthantering. Underlagen ligger i den
 * privata bucketen `expert-documents` som bara service role når: klienten får
 * en signerad upload-URL för en sökväg som databasen har registrerat, och
 * granskare får en kortlivad signerad läs-URL. Affärsreglerna (vem, vilken
 * ansökan, vilken status, vilka filtyper) avgörs av RPC:erna i migration 0029,
 * som anropas som den inloggade användaren.
 */

const BUCKET = "expert-documents";
/** Hur länge en granskares läslänk gäller (sekunder). */
const VIEW_URL_TTL = 300;

type Fail = { ok: false; error: string };

async function context(accessToken: string) {
  const userId = await verifyUser(accessToken);
  if (!userId) return { error: "NOT_AUTHENTICATED" } as const;
  const admin = createAdminClient();
  const asUser = createUserClient(accessToken);
  if (!admin || !asUser) return { error: "NOT_CONFIGURED" } as const;
  return { userId, admin, asUser } as const;
}

function looksLike(mime: string, head: Uint8Array): boolean {
  if (mime === "image/png") {
    const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return png.every((b, i) => head[i] === b);
  }
  if (mime === "image/jpeg") {
    return head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
  }
  if (mime === "application/pdf") {
    // %PDF- ska stå i början; några få byte före tillåts eftersom en del program
    // skriver sådana, men inte mer (filer som är både PDF och något annat).
    const text = new TextDecoder("latin1").decode(head.subarray(0, 64));
    return text.includes("%PDF-");
  }
  return false;
}

export type BeginUploadResult =
  | { ok: true; documentId: string; path: string; uploadToken: string }
  | Fail;

/** Registrerar ett underlag och ger en signerad upload-URL för det. */
export async function beginDocumentUpload(input: {
  accessToken: string;
  applicationId: string;
  kind: string;
  fileName: string;
  mime: string;
  size: number;
}): Promise<BeginUploadResult> {
  const ctx = await context(input.accessToken);
  if ("error" in ctx) return { ok: false, error: ctx.error as string };

  const { data, error } = await ctx.asUser.rpc("expert_document_begin", {
    p_application_id: input.applicationId,
    p_kind: input.kind,
    p_file_name: String(input.fileName ?? "").slice(0, 200),
    p_mime: input.mime,
    p_size: Math.floor(Number(input.size)),
  });
  const row = Array.isArray(data) ? data[0] : null;
  if (error || !row) return { ok: false, error: error?.message ?? "UPLOAD_FAILED" };

  const signed = await ctx.admin.storage.from(BUCKET).createSignedUploadUrl(row.storage_path);
  if (signed.error || !signed.data) {
    await ctx.admin.from("expert_documents").delete().eq("id", row.id);
    return { ok: false, error: "UPLOAD_FAILED" };
  }
  return { ok: true, documentId: row.id, path: row.storage_path, uploadToken: signed.data.token };
}

export type ConfirmUploadResult = { ok: true } | Fail;

/**
 * Kontrollerar den uppladdade filen (storlek, lagrad typ och filsignatur mot
 * angiven typ) och markerar den som uppladdad. Databasen avgör först att
 * underlaget är användarens eget och att ansökan fortfarande går att ändra.
 * En fil som inte stämmer raderas; raden står kvar som obekräftad och gallras
 * efter ett dygn, så att samma uppladdningslänk inte kan användas igen för att
 * lämna kvar filer.
 */
export async function confirmDocumentUpload(input: {
  accessToken: string;
  documentId: string;
}): Promise<ConfirmUploadResult> {
  const ctx = await context(input.accessToken);
  if ("error" in ctx) return { ok: false, error: ctx.error as string };

  const { data, error } = await ctx.asUser.rpc("expert_document_confirmable", {
    p_document_id: input.documentId,
  });
  const doc = Array.isArray(data) ? data[0] : null;
  if (error || !doc) return { ok: false, error: error?.message ?? "NOT_FOUND" };

  const reject = async (code: string): Promise<Fail> => {
    await ctx.admin.storage.from(BUCKET).remove([doc.storage_path]);
    return { ok: false, error: code };
  };

  const file = await ctx.admin.storage.from(BUCKET).download(doc.storage_path);
  if (file.error || !file.data) return reject("UPLOAD_FAILED");
  if (file.data.size !== doc.size_bytes || file.data.size > DOCUMENT_MAX_BYTES) {
    return reject("FILE_MISMATCH");
  }
  if (file.data.type && !file.data.type.startsWith(doc.mime)) return reject("FILE_MISMATCH");
  const head = new Uint8Array(await file.data.slice(0, 64).arrayBuffer());
  if (!looksLike(doc.mime, head)) return reject("FILE_MISMATCH");

  const { error: updateError } = await ctx.admin
    .from("expert_documents")
    .update({ status: "uploaded" })
    .eq("id", input.documentId)
    .eq("user_id", ctx.userId)
    .eq("status", "pending")
    .is("deleted_at", null);
  if (updateError) return { ok: false, error: "UPLOAD_FAILED" };
  return { ok: true };
}

export type RemoveDocumentResult = { ok: true } | Fail;

/** Tar bort ett eget underlag ur en ansökan som går att ändra. */
export async function removeDocument(input: {
  accessToken: string;
  documentId: string;
}): Promise<RemoveDocumentResult> {
  const ctx = await context(input.accessToken);
  if ("error" in ctx) return { ok: false, error: ctx.error as string };

  const { data: path, error } = await ctx.asUser.rpc("expert_document_remove", {
    p_document_id: input.documentId,
  });
  if (error || typeof path !== "string") return { ok: false, error: error?.message ?? "NOT_FOUND" };
  await removeFiles(ctx.admin, [path]);
  return { ok: true };
}

/**
 * Tar bort filer ur bucketen. Raden är redan markerad som raderad; lyckas inte
 * borttagningen hittar det schemalagda jobbet filen som föräldralös och tar
 * bort den senare (se /api/cron/studiehjalp-purge).
 */
async function removeFiles(admin: NonNullable<ReturnType<typeof createAdminClient>>, paths: string[]) {
  if (paths.length === 0) return;
  const first = await admin.storage.from(BUCKET).remove(paths);
  if (first.error) await admin.storage.from(BUCKET).remove(paths);
}

export type WithdrawResult = { ok: true } | Fail;

/** Drar tillbaka en egen ansökan (och samtycket) och raderar underlagen direkt. */
export async function withdrawApplication(input: {
  accessToken: string;
  applicationId: string;
}): Promise<WithdrawResult> {
  const ctx = await context(input.accessToken);
  if ("error" in ctx) return { ok: false, error: ctx.error as string };

  const { data: paths, error } = await ctx.asUser.rpc("expert_application_withdraw", {
    p_application_id: input.applicationId,
  });
  if (error) return { ok: false, error: error.message };
  await removeFiles(ctx.admin, paths ?? []);
  return { ok: true };
}

export type OpenDocumentResult = { ok: true; url: string } | Fail;

/**
 * Kortlivad läslänk till ett underlag för en granskare med rollen
 * view_sensitive_document. Databasen kontrollerar rollen och loggar visningen.
 */
export async function openDocument(input: {
  accessToken: string;
  documentId: string;
}): Promise<OpenDocumentResult> {
  const ctx = await context(input.accessToken);
  if ("error" in ctx) return { ok: false, error: ctx.error as string };

  const { data: path, error } = await ctx.asUser.rpc("expert_document_open", {
    p_document_id: input.documentId,
  });
  if (error || typeof path !== "string") return { ok: false, error: error?.message ?? "NOT_FOUND" };

  const signed = await ctx.admin.storage.from(BUCKET).createSignedUrl(path, VIEW_URL_TTL);
  if (signed.error || !signed.data) return { ok: false, error: "NOT_FOUND" };
  return { ok: true, url: signed.data.signedUrl };
}

export type PurgeResult = { ok: true; purged: number } | Fail;

/**
 * Gallrar underlag vars lagringstid har gått ut (30 dagar efter beslut) och
 * uppladdningar som aldrig bekräftades. Körs när granskningskön öppnas och
 * från knappen i adminvyn.
 */
export async function purgeDueDocuments(input: { accessToken: string }): Promise<PurgeResult> {
  const ctx = await context(input.accessToken);
  if ("error" in ctx) return { ok: false, error: ctx.error as string };

  const { data: due, error } = await ctx.asUser.rpc("expert_documents_due", { p_limit: 200 });
  if (error) return { ok: false, error: error.message };
  const rows = due ?? [];
  if (rows.length === 0) return { ok: true, purged: 0 };

  const removed = await ctx.admin.storage.from(BUCKET).remove(rows.map((r) => r.storage_path));
  if (removed.error) return { ok: false, error: "UPLOAD_FAILED" };

  const { data: count, error: markError } = await ctx.asUser.rpc("expert_documents_mark_deleted", {
    p_ids: rows.map((r) => r.id),
  });
  if (markError) return { ok: false, error: markError.message };
  return { ok: true, purged: count ?? 0 };
}
