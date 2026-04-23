import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();
const createMock = vi.fn();
const updateMock = vi.fn();
const deleteMock = vi.fn();

vi.mock("../api/tags", () => ({
  fetchTags: (...a: unknown[]) => fetchMock(...a),
  createTag: (...a: unknown[]) => createMock(...a),
  updateTag: (...a: unknown[]) => updateMock(...a),
  deleteTag: (...a: unknown[]) => deleteMock(...a),
}));

import { useTags } from "./useTags";

const TAG = { id: 1, name: "react", color: "#10b981", created_at: "x" };

describe("useTags", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    createMock.mockReset();
    updateMock.mockReset();
    deleteMock.mockReset();
  });

  it("loads tags on mount", async () => {
    fetchMock.mockResolvedValue([TAG]);

    const { result } = renderHook(() => useTags());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.tags).toEqual([TAG]);
    expect(result.current.error).toBeNull();
  });

  it("exposes an error on fetch failure", async () => {
    fetchMock.mockRejectedValue(new Error("boom"));

    const { result } = renderHook(() => useTags());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe("boom");
    expect(result.current.tags).toEqual([]);
  });

  it("create() refetches and returns the new tag", async () => {
    fetchMock.mockResolvedValueOnce([]).mockResolvedValueOnce([TAG]);
    createMock.mockResolvedValue(TAG);

    const { result } = renderHook(() => useTags());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let created;
    await act(async () => {
      created = await result.current.create({ name: "react" });
    });

    expect(createMock).toHaveBeenCalledWith({ name: "react" });
    expect(created).toEqual(TAG);
    await waitFor(() => expect(result.current.tags).toEqual([TAG]));
  });

  it("remove() calls deleteTag and refetches", async () => {
    fetchMock.mockResolvedValueOnce([TAG]).mockResolvedValueOnce([]);
    deleteMock.mockResolvedValue(undefined);

    const { result } = renderHook(() => useTags());
    await waitFor(() => expect(result.current.tags).toEqual([TAG]));

    await act(async () => {
      await result.current.remove(1);
    });

    expect(deleteMock).toHaveBeenCalledWith(1);
    await waitFor(() => expect(result.current.tags).toEqual([]));
  });

  it("rename() calls updateTag and refetches", async () => {
    const renamed = { ...TAG, name: "vue" };
    fetchMock.mockResolvedValueOnce([TAG]).mockResolvedValueOnce([renamed]);
    updateMock.mockResolvedValue(renamed);

    const { result } = renderHook(() => useTags());
    await waitFor(() => expect(result.current.tags).toEqual([TAG]));

    await act(async () => {
      await result.current.rename(1, "vue");
    });

    expect(updateMock).toHaveBeenCalledWith(1, { name: "vue" });
    await waitFor(() => expect(result.current.tags).toEqual([renamed]));
  });
});
