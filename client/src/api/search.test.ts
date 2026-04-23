import { beforeEach, describe, expect, it, vi } from "vitest";

const getMock = vi.fn();

vi.mock("./client", () => ({
  default: { get: (...args: unknown[]) => getMock(...args) },
}));

import { searchAll } from "./search";

describe("searchAll", () => {
  beforeEach(() => {
    getMock.mockReset();
  });

  it("calls /search/ with the query param", async () => {
    getMock.mockResolvedValueOnce({ data: { query: "react", total: 0, hits: [] } });

    await searchAll("react");

    expect(getMock).toHaveBeenCalledWith("/search/", {
      params: { q: "react", limit: 25 },
    });
  });

  it("forwards a custom limit", async () => {
    getMock.mockResolvedValueOnce({ data: { query: "x", total: 0, hits: [] } });

    await searchAll("x", 50);

    expect(getMock).toHaveBeenCalledWith("/search/", {
      params: { q: "x", limit: 50 },
    });
  });

  it("returns the server payload", async () => {
    const payload = {
      query: "react",
      total: 1,
      hits: [
        {
          type: "flashcard" as const,
          id: 1,
          title: "React hooks",
          snippet: "…react…",
          video_id: 7,
          video_title: "Intro",
          folder_id: null,
          created_at: "2024-01-01T00:00:00",
        },
      ],
    };
    getMock.mockResolvedValueOnce({ data: payload });

    const result = await searchAll("react");

    expect(result).toEqual(payload);
  });
});
