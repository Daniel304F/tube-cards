import { beforeEach, describe, expect, it, vi } from "vitest";

const getMock = vi.fn();
const postMock = vi.fn();
const patchMock = vi.fn();
const deleteMock = vi.fn();

vi.mock("./client", () => ({
  default: {
    get: (...args: unknown[]) => getMock(...args),
    post: (...args: unknown[]) => postMock(...args),
    patch: (...args: unknown[]) => patchMock(...args),
    delete: (...args: unknown[]) => deleteMock(...args),
  },
}));

import {
  attachTag,
  createTag,
  deleteTag,
  detachTag,
  fetchTags,
  updateTag,
} from "./tags";

describe("tags api", () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
    patchMock.mockReset();
    deleteMock.mockReset();
  });

  it("fetchTags calls /tags/", async () => {
    getMock.mockResolvedValueOnce({ data: [] });

    await fetchTags();

    expect(getMock).toHaveBeenCalledWith("/tags/");
  });

  it("fetchTags returns the payload", async () => {
    const payload = [
      { id: 1, name: "react", color: "#10b981", created_at: "2024-01-01T00:00:00" },
    ];
    getMock.mockResolvedValueOnce({ data: payload });

    const result = await fetchTags();

    expect(result).toEqual(payload);
  });

  it("createTag posts to /tags/ with name and color", async () => {
    postMock.mockResolvedValueOnce({
      data: { id: 1, name: "react", color: "#000000", created_at: "x" },
    });

    await createTag({ name: "react", color: "#000000" });

    expect(postMock).toHaveBeenCalledWith("/tags/", { name: "react", color: "#000000" });
  });

  it("createTag sends name only if color is omitted", async () => {
    postMock.mockResolvedValueOnce({
      data: { id: 1, name: "react", color: "#10b981", created_at: "x" },
    });

    await createTag({ name: "react" });

    expect(postMock).toHaveBeenCalledWith("/tags/", { name: "react" });
  });

  it("updateTag patches /tags/:id", async () => {
    patchMock.mockResolvedValueOnce({
      data: { id: 1, name: "updated", color: "#ffffff", created_at: "x" },
    });

    await updateTag(1, { name: "updated" });

    expect(patchMock).toHaveBeenCalledWith("/tags/1", { name: "updated" });
  });

  it("deleteTag deletes /tags/:id", async () => {
    deleteMock.mockResolvedValueOnce({});

    await deleteTag(3);

    expect(deleteMock).toHaveBeenCalledWith("/tags/3");
  });

  it("attachTag posts to /flashcards/:id/tags/:tagId", async () => {
    postMock.mockResolvedValueOnce({});

    await attachTag(5, 9);

    expect(postMock).toHaveBeenCalledWith("/flashcards/5/tags/9");
  });

  it("detachTag deletes /flashcards/:id/tags/:tagId", async () => {
    deleteMock.mockResolvedValueOnce({});

    await detachTag(5, 9);

    expect(deleteMock).toHaveBeenCalledWith("/flashcards/5/tags/9");
  });
});
