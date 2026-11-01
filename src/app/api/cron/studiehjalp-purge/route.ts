import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Schemalagd gallring av Studiehjälps underlag (Vercel Cron, se vercel.json):
 * filer vars lagringstid har gått ut (30 dagar efter beslut, högst 90 dagar),
 * uppladdningar som aldrig bekräftades och filer i bucketen som saknar en rad.
 * Därefter gamla ansökningar och revisionsloggen (0031): avslagna och
 * tillbakadragna efter 12 månader, orörda utkast efter 6 månader, loggen
 * efter 24 månader.
 *
 * Kräver miljövariabeln CRON_SECRET; Vercel skickar den som Bearer-token.
 * Utan den svarar routen 503 och gör ingenting.
 */

const BUCKET = "expert-documents";

function authorized(request: Request, secret: string): boolean {
  const header = request.headers.get("authorization") ?? "";
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(header);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return Response.json({ error: "CRON_SECRET saknas" }, { status: 503 });
  if (!authorized(request, secret)) return Response.json({ error: "unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  if (!admin) return Response.json({ error: "NOT_CONFIGURED" }, { status: 503 });

  const due = await admin.rpc("expert_documents_due", { p_limit: 500 });
  if (due.error) return Response.json({ error: due.error.message }, { status: 500 });
  const rows = due.data ?? [];
  let purged = 0;
  if (rows.length > 0) {
    const removed = await admin.storage.from(BUCKET).remove(rows.map((r) => r.storage_path));
    if (removed.error) return Response.json({ error: removed.error.message }, { status: 500 });
    const marked = await admin.rpc("expert_documents_mark_deleted", { p_ids: rows.map((r) => r.id) });
    if (marked.error) return Response.json({ error: marked.error.message }, { status: 500 });
    purged = marked.data ?? 0;
  }

  const orphans = await admin.rpc("expert_storage_orphans", { p_limit: 500 });
  if (orphans.error) return Response.json({ error: orphans.error.message, purged }, { status: 500 });
  const names = (orphans.data ?? []).map((o) => o.name);
  if (names.length > 0) {
    const removed = await admin.storage.from(BUCKET).remove(names);
    if (removed.error) return Response.json({ error: removed.error.message, purged }, { status: 500 });
  }

  const retention = await admin.rpc("expert_retention_purge");
  if (retention.error) {
    return Response.json({ error: retention.error.message, purged, orphansRemoved: names.length }, { status: 500 });
  }

  return Response.json({
    purged,
    orphansRemoved: names.length,
    applicationsRemoved: retention.data?.applications ?? 0,
    auditLogRowsRemoved: retention.data?.audit_log_rows ?? 0,
  });
}
