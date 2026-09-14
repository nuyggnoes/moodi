import { renderHook, act } from "@testing-library/react";
import { useDebouncedValue } from "./useDebouncedValue";

describe("useDebouncedValue", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("keeps the initial value until the delay passes", () => {
    const { result } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      { initialProps: { value: "a", delay: 300 } },
    );

    expect(result.current).toBe("a");

    act(() => {
      jest.advanceTimersByTime(299);
    });
    expect(result.current).toBe("a");
  });

  it("updates to the latest value once the delay elapses", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      { initialProps: { value: "a", delay: 300 } },
    );

    rerender({ value: "ab", delay: 300 });

    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current).toBe("ab");
  });

  it("resets the timer when the value changes again before the delay elapses", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      { initialProps: { value: "a", delay: 300 } },
    );

    rerender({ value: "ab", delay: 300 });
    act(() => {
      jest.advanceTimersByTime(200);
    });
    rerender({ value: "abc", delay: 300 });
    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(result.current).toBe("a");

    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current).toBe("abc");
  });
});
