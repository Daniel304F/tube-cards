import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDebounce } from "./useDebounce";

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("hello", 250));

    expect(result.current).toBe("hello");
  });

  it("delays updates until the timeout elapses", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 250),
      { initialProps: { value: "a" } },
    );

    rerender({ value: "b" });
    expect(result.current).toBe("a");

    act(() => {
      vi.advanceTimersByTime(249);
    });
    expect(result.current).toBe("a");

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe("b");
  });

  it("resets the timer when the value changes during the delay", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 250),
      { initialProps: { value: "a" } },
    );

    rerender({ value: "b" });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    rerender({ value: "c" });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Only 200ms after the latest change — still old
    expect(result.current).toBe("a");

    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(result.current).toBe("c");
  });

  it("uses the default delay of 250ms", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      { initialProps: { value: 1 } },
    );

    rerender({ value: 2 });
    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(result.current).toBe(2);
  });

  it("works with non-string values", () => {
    const obj = { count: 1 };
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 100),
      { initialProps: { value: obj } },
    );

    const next = { count: 2 };
    rerender({ value: next });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current).toBe(next);
  });
});
