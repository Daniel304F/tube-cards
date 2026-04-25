import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const processBatchMock = vi.fn();

vi.mock("../api/videos", () => ({
  processBatch: (...args: unknown[]) => processBatchMock(...args),
}));

import { useBatchProcessor } from "./useBatchProcessor";

describe("useBatchProcessor", () => {
  beforeEach(() => {
    processBatchMock.mockReset();
  });

  it("starts idle", () => {
    const { result } = renderHook(() => useBatchProcessor());

    expect(result.current.isProcessing).toBe(false);
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("sets isProcessing while running and stores the result", async () => {
    const payload = {
      results: [
        { youtube_url: "https://youtu.be/a", success: true, result: null, error: null },
      ],
      success_count: 1,
      error_count: 0,
    };
    processBatchMock.mockResolvedValueOnce(payload);

    const { result } = renderHook(() => useBatchProcessor());

    await act(async () => {
      await result.current.process(["https://youtu.be/a"]);
    });

    await waitFor(() => expect(result.current.result).toEqual(payload));
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("captures errors and stays usable", async () => {
    processBatchMock.mockRejectedValueOnce(new Error("network down"));

    const { result } = renderHook(() => useBatchProcessor());

    await act(async () => {
      await result.current.process(["https://youtu.be/x"]);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.isProcessing).toBe(false);
  });

  it("ignores empty url list", async () => {
    const { result } = renderHook(() => useBatchProcessor());

    await act(async () => {
      await result.current.process([]);
    });

    expect(processBatchMock).not.toHaveBeenCalled();
  });

  it("reset clears state", async () => {
    processBatchMock.mockResolvedValueOnce({
      results: [], success_count: 0, error_count: 0,
    });
    const { result } = renderHook(() => useBatchProcessor());

    await act(async () => {
      await result.current.process(["https://youtu.be/a"]);
    });
    act(() => result.current.reset());

    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
