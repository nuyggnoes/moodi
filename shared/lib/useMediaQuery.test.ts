import { act, renderHook } from "@testing-library/react";
import { useMediaQuery } from "./useMediaQuery";

type Listener = () => void;

function mockMatchMedia(initial: boolean) {
  let matches = initial;
  const listeners = new Set<Listener>();
  window.matchMedia = jest.fn().mockImplementation(() => ({
    get matches() {
      return matches;
    },
    addEventListener: (_: string, l: Listener) => listeners.add(l),
    removeEventListener: (_: string, l: Listener) => listeners.delete(l),
  }));
  return (next: boolean) => {
    matches = next;
    listeners.forEach((l) => l());
  };
}

describe("useMediaQuery", () => {
  it("returns the current match and updates when it changes", () => {
    const setMatches = mockMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery("(max-width: 1100px)"));

    expect(result.current).toBe(false);

    act(() => setMatches(true));
    expect(result.current).toBe(true);
  });
});
