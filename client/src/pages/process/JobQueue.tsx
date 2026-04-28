import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  Trash2,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useJobs } from "../../hooks/useJobs";
import type { JobData, JobStatus } from "../../api/jobs";

const FINISHED: ReadonlyArray<JobStatus> = ["done", "failed"];

function parseUrls(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function JobQueue(): React.JSX.Element {
  const { jobs, isLoading, error, enqueue, remove, clearFinished } = useJobs();
  const [text, setText] = useState<string>("");

  const urls = parseUrls(text);
  const canSubmit = urls.length > 0;
  const hasFinished = jobs.some((j) => FINISHED.includes(j.status));

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!canSubmit) return;
    await enqueue(urls);
    setText("");
  }

  return (
    <div className="space-y-6">
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
        <div>
          <label
            htmlFor="job-queue-urls"
            className="block text-sm font-medium text-text-base dark:text-dark-text mb-1"
          >
            YouTube URLs (one per line)
          </label>
          <textarea
            id="job-queue-urls"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder={"https://www.youtube.com/watch?v=...\nhttps://youtu.be/..."}
            className="
              w-full rounded-lg border border-border dark:border-dark-border
              bg-white dark:bg-dark-card
              px-4 py-3 text-sm font-mono
              text-text-base dark:text-dark-text
              placeholder:text-text-muted dark:placeholder:text-dark-muted
              transition-colors
              focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand
            "
          />
          <p className="mt-1 text-xs text-text-muted dark:text-dark-muted">
            {urls.length} URL{urls.length === 1 ? "" : "s"} ready · jobs run in the background
          </p>
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="
            w-full inline-flex items-center justify-center gap-2
            rounded-lg bg-brand px-4 py-3
            text-sm font-medium text-white
            transition-colors hover:bg-brand-dark
            focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 dark:focus:ring-offset-dark-bg
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          <Plus className="size-4" />
          Add to queue
        </button>
      </form>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-base dark:text-dark-text uppercase tracking-wide">
            Queue
            {jobs.length > 0 && (
              <span className="ml-2 text-text-muted dark:text-dark-muted font-normal normal-case">
                ({jobs.length})
              </span>
            )}
          </h2>
          {hasFinished && (
            <button
              type="button"
              onClick={() => void clearFinished()}
              className="
                inline-flex items-center gap-1
                rounded-md border border-border dark:border-dark-border
                bg-white dark:bg-dark-card
                px-2.5 py-1.5
                text-xs font-medium text-text-muted dark:text-dark-muted
                transition-colors
                hover:text-text-base dark:hover:text-dark-text hover:border-brand
                focus:outline-none focus:ring-2 focus:ring-brand
              "
            >
              <Trash2 className="size-3.5" />
              Clear finished
            </button>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 p-3 text-sm text-red-700 dark:text-red-400">
            <AlertCircle className="size-5 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {isLoading ? (
          <div data-testid="job-queue-loading" className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-14 rounded-lg border border-border dark:border-dark-border bg-brand-surface dark:bg-dark-surface animate-pulse"
              />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border dark:border-dark-border bg-white dark:bg-dark-card px-4 py-8 text-center text-sm text-text-muted dark:text-dark-muted">
            No jobs in the queue. Paste YouTube URLs above to enqueue them.
          </p>
        ) : (
          <ul className="space-y-2">
            {jobs.map((job) => (
              <JobRow key={job.id} job={job} onRemove={remove} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

interface JobRowProps {
  job: JobData;
  onRemove: (id: number) => Promise<void>;
}

function JobRow({ job, onRemove }: JobRowProps): React.JSX.Element {
  const canRemove = job.status === "pending" || job.status === "failed" || job.status === "done";

  return (
    <li
      className="
        flex items-start gap-3
        rounded-lg border border-border dark:border-dark-border
        bg-white dark:bg-dark-card
        p-3
      "
    >
      <StatusBadge status={job.status} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text-base dark:text-dark-text truncate">
          {job.youtube_url}
        </p>
        {job.error && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400 break-words">
            {job.error}
          </p>
        )}
      </div>
      {canRemove && (
        <button
          type="button"
          aria-label="Remove job"
          onClick={() => void onRemove(job.id)}
          className="
            inline-flex items-center justify-center
            size-9 rounded-md
            text-text-muted dark:text-dark-muted
            transition-colors
            hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950
            focus:outline-none focus:ring-2 focus:ring-brand
            shrink-0
          "
        >
          <Trash2 className="size-4" />
        </button>
      )}
    </li>
  );
}

const STATUS_META: Record<JobStatus, { label: string; icon: LucideIcon; className: string }> = {
  pending: {
    label: "Pending",
    icon: Clock,
    className: "bg-brand-surface text-text-muted dark:bg-dark-surface dark:text-dark-muted",
  },
  running: {
    label: "Running",
    icon: Loader2,
    className: "bg-blue-50 text-accent dark:bg-blue-950 dark:text-blue-300",
  },
  done: {
    label: "Done",
    icon: CheckCircle2,
    className: "bg-brand-surface text-brand dark:bg-dark-surface dark:text-brand",
  },
  failed: {
    label: "Failed",
    icon: XCircle,
    className: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400",
  },
};

interface StatusBadgeProps {
  status: JobStatus;
}

function StatusBadge({ status }: StatusBadgeProps): React.JSX.Element {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  const animate = status === "running" ? "animate-spin" : "";
  return (
    <span
      className={`
        inline-flex items-center gap-1
        rounded-md px-2 py-1
        text-xs font-medium
        shrink-0
        ${meta.className}
      `}
    >
      <Icon className={`size-3 ${animate}`} />
      {meta.label}
    </span>
  );
}
