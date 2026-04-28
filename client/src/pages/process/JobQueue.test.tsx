import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { JobData } from "../../api/jobs";

const useJobsMock = vi.fn();

vi.mock("../../hooks/useJobs", () => ({
  useJobs: () => useJobsMock(),
}));

import { JobQueue } from "./JobQueue";

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

    render(<JobQueue />);

    expect(screen.getByTestId("job-queue-loading")).toBeInTheDocument();
  });

  it("shows an error banner when loading fails", () => {
    setHookState({ error: "boom" });

    render(<JobQueue />);

    expect(screen.getByText(/boom/i)).toBeInTheDocument();
  });

  it("shows an empty state when no jobs are queued", () => {
    setHookState({ jobs: [] });

    render(<JobQueue />);

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

    render(<JobQueue />);

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

    render(<JobQueue />);

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

    render(<JobQueue />);

    const button = screen.getByRole("button", { name: /add to queue/i });
    expect(button).toBeDisabled();
  });

  it("does not submit when only whitespace is entered", async () => {
    const state = setHookState({});

    render(<JobQueue />);

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

    render(<JobQueue />);

    await user.click(screen.getByRole("button", { name: /remove job/i }));

    expect(state.remove).toHaveBeenCalledWith(42);
  });

  it("does not show a remove button on running jobs", () => {
    setHookState({
      jobs: [makeJob({ id: 9, status: "running" })],
    });

    render(<JobQueue />);

    expect(screen.queryByRole("button", { name: /remove job/i })).not.toBeInTheDocument();
  });

  it("'Clear finished' button only appears when finished jobs exist", () => {
    setHookState({
      jobs: [makeJob({ id: 1, status: "pending" })],
    });
    const { rerender } = render(<JobQueue />);

    expect(screen.queryByRole("button", { name: /clear finished/i })).not.toBeInTheDocument();

    setHookState({
      jobs: [makeJob({ id: 2, status: "done", video_id: 99 })],
    });
    rerender(<JobQueue />);

    expect(screen.getByRole("button", { name: /clear finished/i })).toBeInTheDocument();
  });

  it("'Clear finished' calls clearFinished", async () => {
    const state = setHookState({
      jobs: [makeJob({ id: 5, status: "failed", error: "x" })],
    });
    const user = userEvent.setup();

    render(<JobQueue />);

    await user.click(screen.getByRole("button", { name: /clear finished/i }));

    expect(state.clearFinished).toHaveBeenCalled();
  });
});
