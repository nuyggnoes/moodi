import { getPosterTransform, swipeTarget } from "./posterLayout";

const WIDTH = 980;

describe("getPosterTransform", () => {
  it("keeps the centered poster flat, full size and on top", () => {
    const t = getPosterTransform(0, WIDTH);

    expect(t).toMatchObject({
      x: 0,
      z: 0,
      rotateY: 0,
      scale: 1,
      opacity: 1,
      zIndex: 20,
      visible: true,
    });
  });

  it("tilts neighbours toward the center, in opposite directions", () => {
    const left = getPosterTransform(-1, WIDTH);
    const right = getPosterTransform(1, WIDTH);

    expect(left.x).toBeLessThan(0);
    expect(right.x).toBeGreaterThan(0);
    expect(left.x).toBe(-right.x);
    expect(left.rotateY).toBe(34);
    expect(right.rotateY).toBe(-34);
  });

  it("shrinks, fades and pushes back posters as they get farther away", () => {
    const near = getPosterTransform(1, WIDTH);
    const far = getPosterTransform(2, WIDTH);

    expect(far.x).toBeGreaterThan(near.x);
    expect(far.scale).toBeLessThan(near.scale);
    expect(far.opacity).toBeLessThan(near.opacity);
    expect(far.z).toBeLessThan(near.z);
    expect(far.zIndex).toBeLessThan(near.zIndex);
  });

  it("never shrinks below 60%", () => {
    expect(getPosterTransform(3, WIDTH).scale).toBeGreaterThanOrEqual(0.6);
  });

  it("hides and disables posters more than 3 steps away", () => {
    expect(getPosterTransform(3, WIDTH).visible).toBe(true);
    expect(getPosterTransform(4, WIDTH)).toMatchObject({ opacity: 0, visible: false });
    expect(getPosterTransform(-6, WIDTH).visible).toBe(false);
  });

  it("spaces posters by stage width, clamped between 150 and 250", () => {
    const narrow = getPosterTransform(1, 400).x; // gap 150
    const normal = getPosterTransform(1, 800).x; // gap ≈190
    const wide = getPosterTransform(1, 2000).x; // gap 250

    expect(narrow).toBeCloseTo(150 * 1.05);
    expect(normal).toBeGreaterThan(narrow);
    expect(wide).toBeCloseTo(250 * 1.05);
  });
});

describe("swipeTarget", () => {
  it("ignores drags of 50px or less", () => {
    expect(swipeTarget(-50, 3, 6)).toBe(3);
    expect(swipeTarget(20, 3, 6)).toBe(3);
  });

  it("moves forward on a leftward drag and back on a rightward drag", () => {
    expect(swipeTarget(-80, 3, 6)).toBe(4);
    expect(swipeTarget(80, 3, 6)).toBe(2);
  });

  it("stays within the first and last index", () => {
    expect(swipeTarget(80, 0, 6)).toBe(0);
    expect(swipeTarget(-80, 6, 6)).toBe(6);
  });
});
