import { beforeEach, describe, expect, it, vi } from "vitest";

const getMock = vi.fn();
const postMock = vi.fn();
const deleteMock = vi.fn();

vi.mock("./client", () => ({
  default: {
    get: (...args: unknown[]) => getMock(...args),
    post: (...args: unknown[]) => postMock(...args),
    delete: (...args: unknown[]) => deleteMock(...args),
  },
}));

import { fetchJobs, createJobs, deleteJob, clearFinishedJobs } from "./jobs";

beforeEach(() => {
  getMock.mockReset();
  postMock.mockReset();
  deleteMock.mockReset();
});

describe("fetchJobs", () => {
  it("calls /jobs/ without params by default", async () => {
    getMock.mockResolvedValueOnce({ data: [] });

    await fetchJobs();

    expect(getMock).toHaveBeenCalledWith("/jobs/", { params: undefined });
  });

  it("forwards status filter as query param", async () => {
    getMock.mockResolvedValueOnce({ data: [] });

    await fetchJobs("pending");

    expect(getMock).toHaveBeenCalledWith("/jobs/", { params: { status: "pending" } });
  });
});

describe("createJobs", () => {
  it("posts the URLs", async () => {
    postMock.mockResolvedValueOnce({ data: [] });

    await createJobs(["https://youtu.be/a"]);

    expect(postMock).toHaveBeenCalledWith("/jobs/", {
      youtube_urls: ["https://youtu.be/a"],
    });
  });
});

describe("deleteJob", () => {
  it("hits the right URL", async () => {
    deleteMock.mockResolvedValueOnce({});

    await deleteJob(7);

    expect(deleteMock).toHaveBeenCalledWith("/jobs/7");
  });
});

describe("clearFinishedJobs", () => {
  it("returns the deleted count", async () => {
    deleteMock.mockResolvedValueOnce({ data: { deleted: 3 } });

    const n = await clearFinishedJobs();

    expect(n).toBe(3);
    expect(deleteMock).toHaveBeenCalledWith("/jobs/finished");
  });
});
