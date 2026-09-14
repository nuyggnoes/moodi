import { mapProfileSaveError } from "./error-codes";

describe("mapProfileSaveError", () => {
  it("maps a unique violation to nickname_taken", () => {
    expect(
      mapProfileSaveError({
        code: "23505",
        message: 'duplicate key value violates unique constraint "users_nickname_key"',
      }),
    ).toBe("nickname_taken");
  });

  it("maps anything else to unknown", () => {
    expect(mapProfileSaveError({ message: "connection reset" })).toBe(
      "unknown",
    );
  });
});
