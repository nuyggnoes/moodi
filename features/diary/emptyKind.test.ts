import { getEmptyKind } from "./emptyKind";

describe("getEmptyKind", () => {
  it("returns today when the selected day is today", () => {
    expect(getEmptyKind("2026-10-28", "2026-10-28")).toBe("today");
  });

  it("returns past for an earlier day", () => {
    expect(getEmptyKind("2026-10-03", "2026-10-28")).toBe("past");
  });

  it("returns future for a later day", () => {
    expect(getEmptyKind("2026-10-29", "2026-10-28")).toBe("future");
  });

  it("returns month when no day is selected", () => {
    expect(getEmptyKind(null, "2026-10-28")).toBe("month");
  });
});
