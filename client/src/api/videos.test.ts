import { beforeEach, describe, expect, it, vi } from "vitest";

const postMock = vi.fn();

vi.mock("./client", () => ({
  default: { post: (...args: unknown[]) => postMock(...args) },
}));

import { processBatch } from "./videos";

describe("processBatch", () => {
  beforeEach(() => {
    postMock.mockReset();
  });

  it("calls /videos/process-batch with the urls", async () => {
    postMock.mockResolvedValueOnce({
      data: { results: [], success_count: 0, error_count: 0 },
    });

    await processBatch(["https://youtu.be/a", "https://youtu.be/b"]);

    expect(postMock).toHaveBeenCalledWith("/videos/process-batch", {
      youtube_urls: ["https://youtu.be/a", "https://youtu.be/b"],
    });
  });

  it("returns the server payload", async () => {
    const payload = {
      results: [
        { youtube_url: "https://youtu.be/a", success: true, result: null, error: null },
        { youtube_url: "https://youtu.be/b", success: false, result: null, error: "boom" },
      ],
      success_count: 1,
      error_count: 1,
    };
    postMock.mockResolvedValueOnce({ data: payload });

    const result = await processBatch(["https://youtu.be/a", "https://youtu.be/b"]);

    expect(result).toEqual(payload);
  });
});
