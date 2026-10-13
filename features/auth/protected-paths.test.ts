import {
  hidesNav,
  isApiPath,
  requiresAuth,
  requiresProfile,
} from "./protected-paths";

describe("requiresAuth", () => {
  it.each([
    ["/record", true],
    ["/record/edit", true],
    ["/diary", true],
    ["/diary/2026-09-14", true],
    ["/profile/setup", true],
    ["/profile/abc", true],
    ["/search", true],
    ["/", true],
    ["/api/music/search", true],
    ["/anything-new", true],
    ["/logins", true],
    ["/login", false],
    ["/login/extra", false],
    ["/signup", false],
  ])("%s -> %s", (path, expected) => {
    expect(requiresAuth(path)).toBe(expected);
  });
});

describe("requiresProfile", () => {
  it.each([
    ["/record", true],
    ["/diary", true],
    ["/search", true],
    ["/profile/abc", true],
    ["/", true],
    ["/anything-new", true],
    ["/profile/setup", false],
    ["/login", false],
    ["/signup", false],
    ["/api/music/search", false],
  ])("%s -> %s", (path, expected) => {
    expect(requiresProfile(path)).toBe(expected);
  });
});

describe("isApiPath", () => {
  it.each([
    ["/api", true],
    ["/api/music/search", true],
    ["/api/ai/mood-suggest", true],
    ["/apiary", false],
    ["/diary", false],
    ["/", false],
  ])("%s -> %s", (path, expected) => {
    expect(isApiPath(path)).toBe(expected);
  });
});

describe("hidesNav", () => {
  it.each([
    ["/login", true],
    ["/signup", true],
    ["/profile/setup", true],
    ["/", false],
    ["/record", false],
    ["/diary", false],
    ["/search", false],
    ["/profile/abc", false],
  ])("%s -> %s", (path, expected) => {
    expect(hidesNav(path)).toBe(expected);
  });
});
