import { NAV_ITEMS, isActiveNavItem } from "./nav-items";

describe("isActiveNavItem", () => {
  it.each([
    ["/", "/", true],
    ["/record", "/", false],
    ["/record", "/record", true],
    ["/diary/2026-09-14", "/diary", true],
    ["/diary", "/search", false],
    ["/searching", "/search", false],
  ])("%s vs %s -> %s", (pathname, href, expected) => {
    expect(isActiveNavItem(pathname, href)).toBe(expected);
  });
});

describe("NAV_ITEMS", () => {
  it("links only to routes that exist", () => {
    expect(NAV_ITEMS.map((item) => item.href)).toEqual([
      "/",
      "/record",
      "/diary",
      "/search",
    ]);
  });
});
