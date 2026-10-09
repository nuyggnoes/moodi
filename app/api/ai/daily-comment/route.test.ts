/** @jest-environment node */
import { NextRequest } from "next/server";
import { POST } from "./route";
import { createClient } from "@/shared/lib/supabase/server";
import { generateDailyComment } from "@/features/comment/generateDailyComment";

jest.mock("@/shared/lib/supabase/server", () => ({ createClient: jest.fn() }));
jest.mock("@/shared/lib/ai", () => ({ commentGenerator: { generate: jest.fn() } }));
jest.mock("@/features/comment/generateDailyComment", () => ({
  generateDailyComment: jest.fn(),
}));

const mockedCreateClient = createClient as jest.Mock;
const mockedGenerate = generateDailyComment as jest.Mock;
const RECORD_ID = "11111111-1111-1111-1111-111111111111";

function mockUser(user: { id: string } | null) {
  mockedCreateClient.mockResolvedValue({
    auth: { getUser: async () => ({ data: { user } }) },
  });
}

function post(body: unknown) {
  return new NextRequest("http://localhost:3000/api/ai/daily-comment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  mockUser({ id: "user-1" });
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  mockedCreateClient.mockReset();
  mockedGenerate.mockReset();
  jest.restoreAllMocks();
});

describe("POST /api/ai/daily-comment", () => {
  it("returns the comment for the signed-in user's record", async () => {
    mockedGenerate.mockResolvedValue({ success: true, comment: "코멘트예요" });

    const response = await POST(post({ recordId: RECORD_ID }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ comment: "코멘트예요" });
    expect(mockedGenerate).toHaveBeenCalledWith(
      expect.objectContaining({ generator: expect.anything() }),
      "user-1",
      RECORD_ID,
    );
  });

  it("returns 401 without calling the service when not logged in", async () => {
    mockUser(null);

    const response = await POST(post({ recordId: RECORD_ID }));

    expect(response.status).toBe(401);
    expect(mockedGenerate).not.toHaveBeenCalled();
  });

  it.each([
    ["a missing recordId", {}],
    ["a non-string recordId", { recordId: 123 }],
    ["a non-uuid recordId", { recordId: "not-a-uuid" }],
  ])("returns 400 for %s", async (_label, payload) => {
    const response = await POST(post(payload));

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("invalid_input");
    expect(mockedGenerate).not.toHaveBeenCalled();
  });

  it("returns 400 for a malformed JSON body", async () => {
    expect((await POST(post("{not json"))).status).toBe(400);
  });

  it("returns 404 when the record is not found or not the user's", async () => {
    mockedGenerate.mockResolvedValue({ success: false, error: "not_found" });

    const response = await POST(post({ recordId: RECORD_ID }));

    expect(response.status).toBe(404);
    expect((await response.json()).error).toBe("not_found");
  });

  it("returns 422 when there is no memo to comment on", async () => {
    mockedGenerate.mockResolvedValue({ success: false, error: "no_memo" });

    const response = await POST(post({ recordId: RECORD_ID }));

    expect(response.status).toBe(422);
    expect((await response.json()).error).toBe("no_memo");
  });

  it("returns 502 and logs only the record id and cause when generation fails", async () => {
    mockedGenerate.mockResolvedValue({ success: false, error: "upstream", cause: "timeout" });

    const response = await POST(post({ recordId: RECORD_ID }));

    expect(response.status).toBe(502);
    expect((await response.json()).error).toBe("upstream_error");
    expect(console.error).toHaveBeenCalledWith("daily-comment failed", {
      recordId: RECORD_ID,
      cause: "timeout",
    });
  });
});
