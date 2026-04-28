import { beforeEach, describe, expect, it, vi } from "vitest";

const postMock = vi.fn();

vi.mock("./client", () => ({
  default: { post: (...args: unknown[]) => postMock(...args) },
}));

import { exportToAnki } from "./exports";

describe("exportToAnki", () => {
  beforeEach(() => {
    postMock.mockReset();
  });

  it("posts to /export/anki with the flashcard ids and requests a blob response", async () => {
    const blob = new Blob(["fake apkg bytes"], { type: "application/octet-stream" });
    postMock.mockResolvedValueOnce({ data: blob });

    await exportToAnki([1, 2, 3]);

    expect(postMock).toHaveBeenCalledWith(
      "/export/anki",
      { flashcard_ids: [1, 2, 3], summary_ids: [] },
      { responseType: "blob" },
    );
  });

  it("returns the response payload as a Blob", async () => {
    const blob = new Blob(["x"], { type: "application/octet-stream" });
    postMock.mockResolvedValueOnce({ data: blob });

    const result = await exportToAnki([7]);

    expect(result).toBe(blob);
  });
});
