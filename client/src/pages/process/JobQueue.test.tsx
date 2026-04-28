import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { JobData } from "../../api/jobs";

const useJobsMock = vi.fn();

vi.mock("../../hooks/useJobs", () => ({
  useJobs: () => useJobsMock(),
}));

import { JobQueue } from "./JobQueue";

function renderInRouter(): ReturnType<typeof render> {
  return render(
    <MemoryRouter>
      <JobQueue />
    </MemoryRouter>,
  );
}

function makeJob(overrides: Partial<JobData> = {}): JobData {
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

interface HookState {
  jobs: JobData[];
  isLoading: boolean;
  error: string | null;
  enqueue: (urls: string[]) => Promise<void>;
  remove: (id: number) => Promise<void>;
  clearFinished: () => Promise<void>;
  refetch: () => Promise<void>;
}

function setHookState(partial: Partial<HookState>): HookState {
  const state: HookState = {
    jobs: [],
    isLoading: false,
    error: null,
    enqueue: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
    clearFinished: vi.fn().mockResolvedValue(undefined),
    refetch: vi.fn().mockResolvedValue(undefined),
    ...partial,
  };
  useJobsMock.mockReturnValue(state);
  return state;
}

describe("JobQueue", () => {
  beforeEach(() => {
    useJobsMock.mockReset();
  });

  it("shows a loading state on initial load", () => {
    setHookState({ isLoading: true });

    renderInRouter();

    expect(screen.getByTestId("job-queue-loading")).toBeInTheDocument();
  });

  it("shows an error banner when loading fails", () => {
    setHookState({ error: "boom" });

    renderInRouter();

    expect(screen.getByText(/boom/i)).toBeInTheDocument();
  });

  it("shows an empty state when no jobs are queued", () => {
    setHookState({ jobs: [] });

    renderInRouter();

    expect(screen.getByText(/no jobs/i)).toBeInTheDocument();
  });

  it("renders one row per job with a status badge", () => {
    setHookState({
      jobs: [
        makeJob({ id: 1, youtube_url: "https://youtu.be/a", status: "pending" }),
        makeJob({ id: 2, youtube_url: "https://youtu.be/b", status: "running" }),
        makeJob({ id: 3, youtube_url: "https://youtu.be/c", status: "done", video_id: 99 }),
        makeJob({ id: 4, youtube_url: "https://youtu.be/d", status: "failed", error: "nope" }),
      ],
    });

    renderInRouter();

    expect(screen.getByText("https://youtu.be/a")).toBeInTheDocument();
    expect(screen.getByText("https://youtu.be/b")).toBeInTheDocument();
    expect(screen.getByText("https://youtu.be/c")).toBeInTheDocument();
    expect(screen.getByText("https://youtu.be/d")).toBeInTheDocument();
    expect(screen.getByText(/pending/i)).toBeInTheDocument();
    expect(screen.getByText(/running/i)).toBeInTheDocument();
    expect(screen.getByText(/done/i)).toBeInTheDocument();
    expect(screen.getByText(/failed/i)).toBeInTheDocument();
    expect(screen.getByText(/nope/i)).toBeInTheDocument();
  });

  it("submits parsed URLs to enqueue and clears the textarea", async () => {
    const state = setHookState({});
    const user = userEvent.setup();

    renderInRouter();

    const textarea = screen.getByLabelText(/youtube urls/i) as HTMLTextAreaElement;
    await user.type(
      textarea,
      "https://youtu.be/a\nhttps://youtu.be/b\n   \n",
    );
    await user.click(screen.getByRole("button", { name: /add to queue/i }));

    expect(state.enqueue).toHaveBeenCalledWith([
      "https://youtu.be/a",
      "https://youtu.be/b",
    ]);
    expect(textarea.value).toBe("");
  });

  it("disables the submit button when textarea is empty", () => {
    setHookState({});

    renderInRouter();

    const button = screen.getByRole("button", { name: /add to queue/i });
    expect(button).toBeDisabled();
  });

  it("does not submit when only whitespace is entered", async () => {
    const state = setHookState({});

    renderInRouter();

    const textarea = screen.getByLabelText(/youtube urls/i);
    fireEvent.change(textarea, { target: { value: "   \n  \n" } });
    fireEvent.click(screen.getByRole("button", { name: /add to queue/i }));

    expect(state.enqueue).not.toHaveBeenCalled();
  });

  it("delete button on a pending job calls remove", async () => {
    const state = setHookState({
      jobs: [makeJob({ id: 42, status: "pending" })],
    });
    const user = userEvent.setup();

    renderInRouter();

    await user.click(screen.getByRole("button", { name: /remove job/i }));

    expect(state.remove).toHaveBeenCalledWith(42);
  });

  it("does not show a remove button on running jobs", () => {
    setHookState({
      jobs: [makeJob({ id: 9, status: "running" })],
    });

    renderInRouter();

    expect(screen.queryByRole("button", { name: /remove job/i })).not.toBeInTheDocument();
  });

  it("'Clear finished' button only appears when finished jobs exist", () => {
    setHookState({
      jobs: [makeJob({ id: 1, status: "pending" })],
    });
    const { rerender } = renderInRouter();

    expect(screen.queryByRole("button", { name: /clear finished/i })).not.toBeInTheDocument();

    setHookState({
      jobs: [makeJob({ id: 2, status: "done", video_id: 99 })],
    });
    rerender(
      <MemoryRouter>
        <JobQueue />
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: /clear finished/i })).toBeInTheDocument();
  });

  it("renders a Retry button on failed jobs", () => {
    setHookState({
      jobs: [makeJob({ id: 5, youtube_url: "https://youtu.be/x", status: "failed", error: "boom" })],
    });

    renderInRouter();

    expect(screen.getByRole("button", { name: /retry job/i })).toBeInTheDocument();
  });

  it("Retry button on a failed job re-enqueues the URL", async () => {
    const state = setHookState({
      jobs: [makeJob({ id: 5, youtube_url: "https://youtu.be/x", status: "failed", error: "boom" })],
    });
    const user = userEvent.setup();

    renderInRouter();
    await user.click(screen.getByRole("button", { name: /retry job/i }));

    expect(state.enqueue).toHaveBeenCalledWith(["https://youtu.be/x"]);
  });

  it("does not render a Retry button on non-failed jobs", () => {
    setHookState({
      jobs: [
        makeJob({ id: 1, status: "pending" }),
        makeJob({ id: 2, status: "running" }),
        makeJob({ id: 3, status: "done", video_id: 99 }),
      ],
    });

    renderInRouter();

    expect(screen.queryByRole("button", { name: /retry job/i })).not.toBeInTheDocument();
  });

  it("renders the URL of a done job as a link to /history?expand=<video_id>", () => {
    setHookState({
      jobs: [makeJob({ id: 7, youtube_url: "https://youtu.be/c", status: "done", video_id: 99 })],
    });

    renderInRouter();

    const link = screen.getByRole("link", { name: "https://youtu.be/c" });
    expect(link).toHaveAttribute("href", "/history?expand=99");
  });

  it("does not render a link for non-done jobs", () => {
    setHookState({
      jobs: [
        makeJob({ id: 1, youtube_url: "https://youtu.be/p", status: "pending" }),
        makeJob({ id: 2, youtube_url: "https://youtu.be/r", status: "running" }),
        makeJob({ id: 3, youtube_url: "https://youtu.be/f", status: "failed", error: "x" }),
      ],
    });

    renderInRouter();

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("'Clear finished' calls clearFinished", async () => {
    const state = setHookState({
      jobs: [makeJob({ id: 5, status: "failed", error: "x" })],
    });
    const user = userEvent.setup();

    renderInRouter();

    await user.click(screen.getByRole("button", { name: /clear finished/i }));

    expect(state.clearFinished).toHaveBeenCalled();
  });
});
