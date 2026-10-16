import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/shared/lib/supabase/database.types";
import { getTodayRecord } from "./getTodayRecord";

type Row = Database["public"]["Tables"]["records"]["Row"];

function fakeSupabase(result: { data: Row | null; error: { message: string } | null }) {
  const eqs: [string, unknown][] = [];
  const chain = {
    select: () => chain,
    eq: (column: string, value: unknown) => {
      eqs.push([column, value]);
      return chain;
    },
    maybeSingle: async () => result,
  };
  const from = jest.fn(() => chain);
  return { client: { from } as unknown as SupabaseClient<Database>, from, eqs };
}

const record = { id: "r1", user_id: "u1", record_date: "2026-10-14" } as Row;

describe("getTodayRecord", () => {
  it("looks up the user's record for today's KST date", async () => {
    const { client, from, eqs } = fakeSupabase({ data: record, error: null });

    // 2026-10-13T20:00Z = 2026-10-14 05:00 KST
    const result = await getTodayRecord(client, "u1", new Date("2026-10-13T20:00:00Z"));

    expect(result).toBe(record);
    expect(from).toHaveBeenCalledWith("records");
    expect(eqs).toEqual([
      ["user_id", "u1"],
      ["record_date", "2026-10-14"],
    ]);
  });

  it("returns null when there is no record today", async () => {
    const { client } = fakeSupabase({ data: null, error: null });
    expect(await getTodayRecord(client, "u1")).toBeNull();
  });

  it("throws on a database error instead of pretending there is no record", async () => {
    const { client } = fakeSupabase({ data: null, error: { message: "db" } });
    await expect(getTodayRecord(client, "u1")).rejects.toEqual({ message: "db" });
  });
});
