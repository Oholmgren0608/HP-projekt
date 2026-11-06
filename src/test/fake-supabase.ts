/**
 * Supabase-attrapp i minnet för synktesterna. Den kan bara det som
 * storage-sync använder mot tabellen user_state. Servern sätter själv
 * updated_at (strikt ökande, med mikrosekunder) och ignorerar klientens värde,
 * som databasen gör efter migration 0032. Testerna mäter alltså mot serverns
 * ordning och inte mot enheternas klockor.
 */

export type CloudRow = {
  user_id: string;
  storage_key: string;
  value: { v?: string } | null;
  updated_at: string;
};

export type QueryResult = {
  data: unknown;
  error: { message: string; code?: string } | null;
  status: number;
};

const OFFLINE: QueryResult = {
  data: null,
  error: { message: "TypeError: fetch failed" },
  status: 0,
};

export class FakeServer {
  readonly rows = new Map<string, CloudRow>();
  /** Sant: varje anrop misslyckas som när nätet är borta. */
  offline = false;
  /** Anrop som inte har besvarats än. */
  inflight = 0;
  private lastMicros = 0;

  constructor(private readonly trueNow: () => number) {}

  /** Serverns tid för en skrivning: aldrig samma värde och aldrig bakåt. */
  stamp(): string {
    const next = Math.max(Math.floor(this.trueNow()) * 1000, this.lastMicros + 1);
    this.lastMicros = next;
    const seconds = new Date(Math.floor(next / 1000)).toISOString().slice(0, 19);
    return `${seconds}.${String(next % 1_000_000).padStart(6, "0")}+00:00`;
  }

  /** Användarens rader som { nyckel: rå sträng }. */
  valuesFor(userId: string): Record<string, string | null> {
    const out: Record<string, string | null> = {};
    for (const row of this.rows.values()) {
      if (row.user_id === userId) out[row.storage_key] = row.value?.v ?? null;
    }
    return out;
  }

  async run(work: () => QueryResult): Promise<QueryResult> {
    this.inflight += 1;
    try {
      await Promise.resolve();
      if (this.offline) return OFFLINE;
      return work();
    } finally {
      this.inflight -= 1;
    }
  }

  /** Klient för en enhet. `session` ger den inloggade användaren (som RLS). */
  client(session: () => string | null): FakeClient {
    return new FakeClient(this, session);
  }
}

const UNKNOWN_TABLE = (table: string): QueryResult => ({
  data: null,
  error: { message: `relation "public.${table}" does not exist`, code: "42P01" },
  status: 404,
});

class SelectQuery implements PromiseLike<QueryResult> {
  private readonly filters: Array<[string, unknown]> = [];

  constructor(
    private readonly server: FakeServer,
    private readonly table: string,
    private readonly session: () => string | null,
  ) {}

  eq(column: string, value: unknown): this {
    this.filters.push([column, value]);
    return this;
  }

  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private execute(): Promise<QueryResult> {
    return this.server.run(() => {
      if (this.table !== "user_state") return UNKNOWN_TABLE(this.table);
      const user = this.session();
      const rows = [...this.server.rows.values()].filter(
        (row) =>
          row.user_id === user &&
          this.filters.every(([column, value]) => (row as Record<string, unknown>)[column] === value),
      );
      return { data: rows.map((row) => structuredClone(row)), error: null, status: 200 };
    });
  }
}

export class FakeClient {
  constructor(
    private readonly server: FakeServer,
    private readonly session: () => string | null,
  ) {}

  from(table: string) {
    const { server, session } = this;
    return {
      select: (columns?: string) => {
        void columns;
        return new SelectQuery(server, table, session);
      },
      upsert: (values: CloudRow | CloudRow[], options?: { onConflict?: string }) => {
        void options;
        return server.run(() => {
          if (table !== "user_state") return UNKNOWN_TABLE(table);
          const user = session();
          for (const row of Array.isArray(values) ? values : [values]) {
            if (!user || row.user_id !== user) {
              return {
                data: null,
                error: { message: "new row violates row-level security policy", code: "42501" },
                status: 403,
              };
            }
            server.rows.set(`${row.user_id}|${row.storage_key}`, {
              user_id: row.user_id,
              storage_key: row.storage_key,
              value: structuredClone(row.value),
              updated_at: server.stamp(),
            });
          }
          return { data: null, error: null, status: 201 };
        });
      },
    };
  }

  rpc(fn: string, args?: Record<string, unknown>) {
    void args;
    return this.server.run(() => ({
      data: null,
      error: { message: `Could not find the function public.${fn}`, code: "PGRST202" },
      status: 404,
    }));
  }
}
