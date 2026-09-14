import { isProtectedPath } from "./protected-paths";

describe("isProtectedPath", () => {
  it.each([
    ["/record", true],
    ["/record/edit", true],
    ["/diary", true],
    ["/diary/2026-09-14", true],
    ["/", false],
    ["/login", false],
    ["/signup", false],
    ["/search", false],
    ["/records", false],
  ])("%s -> %s", (path, expected) => {
    expect(isProtectedPath(path)).toBe(expected);
  });
});
