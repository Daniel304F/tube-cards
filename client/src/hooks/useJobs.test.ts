import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchJobsMock = vi.fn();
const createJobsMock = vi.fn();
const deleteJobMock = vi.fn();
const clearFinishedJobsMock = vi.fn();

vi.mock("../api/jobs", () => ({
  fetchJobs: (...args: unknown[]) => fetchJobsMock(...args),
  createJobs: (...args: unknown[]) => createJobsMock(...args),
  deleteJob: (...args: unknown[]) => deleteJobMock(...args),
  clearFinishedJobs: (...args: unknown[]) => clearFinishedJobsMock(...args),
}));

import { useJobs } from "./useJobs";

function makeJob(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: 1,
    youtube_url: "https://youtu.be/a",
    status: "pending",
    error: null,
    video_id: null,
    created_at: "2026-04-28T00:00:00Z",
    started_at: null,
    finished_at: null,
    ...overrides,
  };
}

describe("useJobs", () => {
  beforeEach(() => {
    fetchJobsMock.mockReset();
    createJobsMock.mockReset();
    deleteJobMock.mockReset();
    clearFinishedJobsMock.mockReset();
    fetchJobsMock.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts in loading state and loads jobs on mount", async () => {
    fetchJobsMock.mockResolvedValueOnce([makeJob()]);

    const { result } = renderHook(() => useJobs());

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.jobs).toHaveLength(1);
    expect(result.current.error).toBeNull();
  });

  it("captures errors", async () => {
    fetchJobsMock.mockRejectedValueOnce(new Error("network down"));

    const { result } = renderHook(() => useJobs());

    await waitFor(() => expect(result.current.error).toBe("network down"));
    expect(result.current.isLoading).toBe(false);
  });

  it("enqueue calls createJobs and refetches", async () => {
    const { result } = renderHook(() => useJobs());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    fetchJobsMock.mockClear();
    createJobsMock.mockResolvedValueOnce([]);

    await act(async () => {
      await result.current.enqueue(["https://youtu.be/a"]);
    });

    expect(createJobsMock).toHaveBeenCalledWith(["https://youtu.be/a"]);
    expect(fetchJobsMock).toHaveBeenCalledTimes(1);
  });

  it("enqueue ignores empty url list", async () => {
    const { result } = renderHook(() => useJobs());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.enqueue([]);
    });

    expect(createJobsMock).not.toHaveBeenCalled();
  });

  it("remove calls deleteJob and refetches", async () => {
    const { result } = renderHook(() => useJobs());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    fetchJobsMock.mockClear();
    deleteJobMock.mockResolvedValueOnce(undefined);

    await act(async () => {
      await result.current.remove(7);
    });

    expect(deleteJobMock).toHaveBeenCalledWith(7);
    expect(fetchJobsMock).toHaveBeenCalledTimes(1);
  });

  it("clearFinished calls clearFinishedJobs and refetches", async () => {
    const { result } = renderHook(() => useJobs());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    fetchJobsMock.mockClear();
    clearFinishedJobsMock.mockResolvedValueOnce(2);

    await act(async () => {
      await result.current.clearFinished();
    });

    expect(clearFinishedJobsMock).toHaveBeenCalledTimes(1);
    expect(fetchJobsMock).toHaveBeenCalledTimes(1);
  });

  it("polls jobs on an interval after the initial load", async () => {
    vi.useFakeTimers();
    fetchJobsMock.mockResolvedValue([makeJob()]);

    const { result, unmount } = renderHook(() => useJobs());

    await vi.waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fetchJobsMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(fetchJobsMock).toHaveBeenCalledTimes(2);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(fetchJobsMock).toHaveBeenCalledTimes(3);

    unmount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });
    expect(fetchJobsMock).toHaveBeenCalledTimes(3);
  });

  it("polling does not flip isLoading back to true", async () => {
    vi.useFakeTimers();

    const { result } = renderHook(() => useJobs());
    await vi.waitFor(() => expect(result.current.isLoading).toBe(false));

    let loadingDuringPoll = false;
    fetchJobsMock.mockImplementationOnce(async () => {
      loadingDuringPoll = result.current.isLoading;
      return [];
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(loadingDuringPoll).toBe(false);
  });
});
