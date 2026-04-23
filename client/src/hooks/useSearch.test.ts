import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const searchMock = vi.fn();

vi.mock("../api/search", () => ({
  searchAll: (...args: unknown[]) => searchMock(...args),
}));

import { useSearch } from "./useSearch";

describe("useSearch", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    searchMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts with empty state", () => {
    const { result } = renderHook(() => useSearch());

    expect(result.current.query).toBe("");
    expect(result.current.results).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("does not fire a request for queries shorter than 2 characters", async () => {
    const { result } = renderHook(() => useSearch());

    act(() => result.current.setQuery("a"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(searchMock).not.toHaveBeenCalled();
    expect(result.current.results).toBeNull();
  });

  it("fires a debounced request after 250ms", async () => {
    searchMock.mockResolvedValue({ query: "react", total: 0, hits: [] });
    const { result } = renderHook(() => useSearch());

    act(() => result.current.setQuery("react"));
    expect(searchMock).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });

    expect(searchMock).toHaveBeenCalledTimes(1);
    expect(searchMock).toHaveBeenCalledWith("react", 25);
  });

  it("stores the results on success", async () => {
    const payload = {
      query: "react",
      total: 1,
      hits: [
        {
          type: "flashcard" as const,
          id: 1,
          title: "Q",
          snippet: "S",
          video_id: 1,
          video_title: "T",
          folder_id: null,
          created_at: "2024-01-01T00:00:00",
        },
      ],
    };
    searchMock.mockResolvedValue(payload);

    const { result } = renderHook(() => useSearch());

    act(() => result.current.setQuery("react"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });

    expect(result.current.results).toEqual(payload);
    expect(result.current.isLoading).toBe(false);
  });

  it("exposes an error message on failure", async () => {
    searchMock.mockRejectedValue(new Error("network"));
    const { result } = renderHook(() => useSearch());

    act(() => result.current.setQuery("vue"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });

    expect(result.current.error).toBe("Search failed.");
  });

  it("forwards a custom limit", async () => {
    searchMock.mockResolvedValue({ query: "go", total: 0, hits: [] });
    const { result } = renderHook(() => useSearch("", 50));

    act(() => result.current.setQuery("go"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });

    expect(searchMock).toHaveBeenCalledWith("go", 50);
  });

  it("debounces rapid keystrokes into a single request", async () => {
    searchMock.mockResolvedValue({ query: "docker", total: 0, hits: [] });
    const { result } = renderHook(() => useSearch());

    act(() => result.current.setQuery("d"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    act(() => result.current.setQuery("do"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    act(() => result.current.setQuery("docker"));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });

    expect(searchMock).toHaveBeenCalledTimes(1);
    expect(searchMock).toHaveBeenCalledWith("docker", 25);
  });
});
