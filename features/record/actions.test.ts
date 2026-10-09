/** @jest-environment node */
import { saveRecord } from "./actions";
import { createClient } from "@/shared/lib/supabase/server";
import { redirect } from "next/navigation";

jest.mock("@/shared/lib/supabase/server", () => ({ createClient: jest.fn() }));
jest.mock("next/navigation", () => ({ redirect: jest.fn() }));

const mockedCreateClient = createClient as jest.Mock;
const mockedRedirect = redirect as unknown as jest.Mock;
const insert = jest.fn();

beforeEach(() => {
  insert.mockResolvedValue({ error: null });
  mockedCreateClient.mockResolvedValue({
    auth: { getUser: async () => ({ data: { user: { id: "user-1" } } }) },
    from: () => ({ insert }),
  });
});

afterEach(() => {
  insert.mockReset();
  mockedCreateClient.mockReset();
  mockedRedirect.mockReset();
});

function formWith(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  const fields: Record<string, string> = {
    trackId: "1",
    trackName: "Next Level",
    artist: "aespa",
    mood: "calm",
    memo: "차분했다",
    ...overrides,
  };
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

describe("saveRecord mood_source", () => {
  it('stores "ai" when the form says the mood came from the AI suggestion', async () => {
    await saveRecord(null, formWith({ moodSource: "ai" }));

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ mood: "calm", mood_source: "ai" }),
    );
    expect(mockedRedirect).toHaveBeenCalledWith("/");
  });

  it('stores "user" for a manual pick', async () => {
    await saveRecord(null, formWith({ moodSource: "user" }));

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ mood_source: "user" }),
    );
  });

  it.each([
    ["missing", {}],
    ["an unknown value", { moodSource: "robot" }],
  ])('falls back to "user" when moodSource is %s', async (_label, extra) => {
    await saveRecord(null, formWith(extra));

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ mood_source: "user" }),
    );
  });
});

describe("saveRecord validation", () => {
  it("rejects an invalid mood without inserting", async () => {
    const result = await saveRecord(null, formWith({ mood: "angry" }));

    expect(result).toEqual({ error: "mood_required" });
    expect(insert).not.toHaveBeenCalled();
  });

  it("rejects a missing track without inserting", async () => {
    const result = await saveRecord(null, formWith({ trackName: "" }));

    expect(result).toEqual({ error: "track_required" });
    expect(insert).not.toHaveBeenCalled();
  });
});
