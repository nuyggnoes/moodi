import {
  getRecentSearches,
  addRecentSearch,
  __resetRecentSearchesCacheForTests,
} from "./recentSearches";

describe("recentSearches", () => {
  beforeEach(() => {
    window.localStorage.clear();
    __resetRecentSearchesCacheForTests();
  });

  it("returns an empty array when nothing is stored", () => {
    expect(getRecentSearches()).toEqual([]);
  });

  it("adds a search to the front", () => {
    addRecentSearch("aespa");
    addRecentSearch("아이유");

    expect(getRecentSearches()).toEqual(["아이유", "aespa"]);
  });

  it("dedupes case-insensitively and moves the item to the front", () => {
    addRecentSearch("aespa");
    addRecentSearch("아이유");
    addRecentSearch("AESPA");

    expect(getRecentSearches()).toEqual(["AESPA", "아이유"]);
  });

  it("caps at 5 items", () => {
    for (const q of ["a", "b", "c", "d", "e", "f"]) {
      addRecentSearch(q);
    }

    expect(getRecentSearches()).toEqual(["f", "e", "d", "c", "b"]);
  });

  it("ignores blank queries", () => {
    addRecentSearch("   ");
    expect(getRecentSearches()).toEqual([]);
  });

  it("does not throw when localStorage is unavailable", () => {
    const spy = jest
      .spyOn(window.localStorage.__proto__, "setItem")
      .mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });

    expect(() => addRecentSearch("aespa")).not.toThrow();

    spy.mockRestore();
  });
});
