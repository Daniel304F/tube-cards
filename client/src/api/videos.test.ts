import { beforeEach, describe, expect, it, vi } from "vitest";

const postMock = vi.fn();

vi.mock("./client", () => ({
  default: { post: (...args: unknown[]) => postMock(...args) },
}));

import { processBatch, processPlaylist, regenerateVideo } from "./videos";

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

describe("regenerateVideo", () => {
  beforeEach(() => {
    postMock.mockReset();
  });

  it("posts to /videos/<id>/regenerate", async () => {
    postMock.mockResolvedValueOnce({
      data: {
        video: {
          id: 7,
          youtube_url: "https://youtu.be/x",
          title: "T",
          transcript: "t",
          processed_at: null,
          created_at: "",
        },
        flashcards: [],
        summary: { id: 1, content: "s", video_id: 7, folder_id: null, created_at: "", updated_at: "" },
      },
    });

    await regenerateVideo(7);

    expect(postMock).toHaveBeenCalledWith("/videos/7/regenerate");
  });

  it("returns the new VideoProcessResult", async () => {
    const payload = {
      video: {
        id: 7,
        youtube_url: "https://youtu.be/x",
        title: "T",
        transcript: "t",
        processed_at: null,
        created_at: "",
      },
      flashcards: [],
      summary: { id: 9, content: "fresh", video_id: 7, folder_id: null, created_at: "", updated_at: "" },
    };
    postMock.mockResolvedValueOnce({ data: payload });

    const result = await regenerateVideo(7);

    expect(result).toEqual(payload);
  });
});

describe("processPlaylist", () => {
  beforeEach(() => {
    postMock.mockReset();
  });

  it("calls /videos/process-playlist with the playlist url", async () => {
    postMock.mockResolvedValueOnce({
      data: { results: [], success_count: 0, error_count: 0 },
    });

    await processPlaylist("https://youtube.com/playlist?list=PLx");

    expect(postMock).toHaveBeenCalledWith("/videos/process-playlist", {
      playlist_url: "https://youtube.com/playlist?list=PLx",
    });
  });

  it("returns the server payload", async () => {
    const payload = {
      results: [
        { youtube_url: "https://www.youtube.com/watch?v=aaa", success: true, result: null, error: null },
      ],
      success_count: 1,
      error_count: 0,
    };
    postMock.mockResolvedValueOnce({ data: payload });

    const result = await processPlaylist("https://youtube.com/playlist?list=PLx");

    expect(result).toEqual(payload);
  });
});
