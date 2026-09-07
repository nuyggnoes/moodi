import { createClient } from "./client";

describe("supabase browser client", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = {
      ...OLD_ENV,
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
    };
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it("클라이언트를 생성한다", () => {
    expect(createClient()).toBeTruthy();
  });

  it("from · auth 메서드를 노출한다", () => {
    const supabase = createClient();
    expect(typeof supabase.from).toBe("function");
    expect(typeof supabase.auth.getUser).toBe("function");
  });
});
