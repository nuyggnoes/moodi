import { isRail, toggleMode } from "./sidebarState";

describe("isRail", () => {
  it("follows the width in auto mode", () => {
    expect(isRail("auto", false)).toBe(false);
    expect(isRail("auto", true)).toBe(true);
  });

  it("ignores the width once the user has pinned a state", () => {
    expect(isRail("open", true)).toBe(false);
    expect(isRail("closed", false)).toBe(true);
  });
});

describe("toggleMode", () => {
  it("collapses a wide auto sidebar", () => {
    expect(toggleMode("auto", false)).toBe("closed");
  });

  it("expands a narrow auto sidebar", () => {
    expect(toggleMode("auto", true)).toBe("open");
  });

  it("flips pinned states", () => {
    expect(toggleMode("open", false)).toBe("closed");
    expect(toggleMode("closed", true)).toBe("open");
  });
});
