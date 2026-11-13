import { beforeEach, describe, expect, it, vi } from "vitest";

const PUBLIC_ID = "11111111-2222-4333-8444-555555555555";
type Row = Record<string, string>;
let profiles: Row[] = [];
let avatars: Row[] = [];
let downloaded: string[] = [];

function table(rows: () => Row[]) {
  const filters: [string, string][] = [];
  const query = {
    select: () => query,
    eq: (col: string, val: string) => {
      filters.push([col, val]);
      return query;
    },
    maybeSingle: async () => ({ data: rows().find((r) => filters.every(([c, v]) => r[c] === v)) ?? null, error: null }),
  };
  return query;
}

vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: () => ({
    from: (name: string) => table(() => (name === "expert_profiles" ? profiles : avatars)),
    storage: {
      from: () => ({
        download: async (path: string) => {
          downloaded.push(path);
          return { data: new Blob([new Uint8Array([1, 2, 3])], { type: "image/webp" }), error: null };
        },
      }),
    },
  }),
}));

const { GET } = await import("./route");
const call = (publicId: string) =>
  GET(new Request(`http://x/api/expertbild/${publicId}`) as never, { params: Promise.resolve({ publicId }) } as never);

describe("api/expertbild", () => {
  beforeEach(() => {
    profiles = [{ public_id: PUBLIC_ID, user_id: "u1" }];
    avatars = [];
    downloaded = [];
  });

  it("skickar den godkända bilden utan att lämna ut sökvägen", async () => {
    avatars = [{ user_id: "u1", path: "u1/abc.webp", status: "approved" }];
    const res = await call(PUBLIC_ID);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/webp");
    expect(res.headers.get("Location")).toBeNull();
    expect(downloaded).toEqual(["u1/abc.webp"]);
  });

  it("visar aldrig väntande, dolda eller underkända bilder", async () => {
    for (const status of ["pending", "hidden", "rejected"]) {
      avatars = [{ user_id: "u1", path: "u1/x.webp", status }];
      expect((await call(PUBLIC_ID)).status).toBe(404);
    }
    expect(downloaded).toEqual([]);
  });

  it("ger 404 för okända profiler och ogiltiga id", async () => {
    avatars = [{ user_id: "u1", path: "u1/abc.webp", status: "approved" }];
    expect((await call("99999999-2222-4333-8444-555555555555")).status).toBe(404);
    expect((await call("../u1")).status).toBe(404);
  });
});
