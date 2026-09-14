import { MOOD_OPTIONS, MOOD_COLORS } from "./mood";

describe("mood", () => {
  it("has a color for every mood option", () => {
    for (const option of MOOD_OPTIONS) {
      expect(MOOD_COLORS[option.value]).toBeTruthy();
    }
  });

  it("uses a distinct color per mood", () => {
    const colors = Object.values(MOOD_COLORS);
    expect(new Set(colors).size).toBe(colors.length);
  });
});
