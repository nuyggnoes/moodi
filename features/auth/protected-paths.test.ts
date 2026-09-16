import { requiresAuth, requiresProfile } from "./protected-paths";

describe("requiresAuth", () => {
  it.each([
    ["/record", true],
    ["/record/edit", true],
    ["/diary", true],
    ["/diary/2026-09-14", true],
    ["/profile/setup", true],
    ["/", true],
    ["/login", false],
    ["/signup", false],
    ["/search", false],
    ["/records", false],
  ])("%s -> %s", (path, expected) => {
    expect(requiresAuth(path)).toBe(expected);
  });
});

describe("requiresProfile", () => {
  it.each([
    ["/record", true],
    ["/diary", true],
    ["/", true],
    ["/profile/setup", false],
    ["/login", false],
  ])("%s -> %s", (path, expected) => {
    expect(requiresProfile(path)).toBe(expected);
  });
});
