import { useState } from "react";
import { Loader2, Play, RotateCcw, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { useBatchProcessor } from "../../hooks/useBatchProcessor";

function parseUrls(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function BatchProcessor(): React.JSX.Element {
  const [text, setText] = useState<string>("");
  const { result, isProcessing, error, process, reset } = useBatchProcessor();

  const urls = parseUrls(text);
  const canSubmit = urls.length > 0 && !isProcessing;

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    await process(urls);
  }

  function handleReset(): void {
    setText("");
    reset();
  }

  if (result) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-base dark:text-dark-text">
            <span className="font-semibold">{result.success_count}</span> succeeded,{" "}
            <span className="font-semibold">{result.error_count}</span> failed
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="
              inline-flex items-center gap-2 rounded-lg
              border border-border dark:border-dark-border
              bg-white dark:bg-dark-card
              px-3 py-2 text-sm font-medium text-text-base dark:text-dark-text
              transition-colors hover:bg-brand-surface dark:hover:bg-dark-surface
              focus:outline-none focus:ring-2 focus:ring-brand
              min-h-[44px]
            "
          >
            <RotateCcw className="size-4" />
            New batch
          </button>
        </div>

        <ul className="space-y-2">
          {result.results.map((item) => (
            <BatchResultRow key={item.youtube_url} item={item} />
          ))}
        </ul>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <div>
        <label
          htmlFor="batch-urls"
          className="block text-sm font-medium text-text-base dark:text-dark-text mb-1"
        >
          YouTube URLs (one per line)
        </label>
        <textarea
          id="batch-urls"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder={"https://www.youtube.com/watch?v=...\nhttps://youtu.be/..."}
          disabled={isProcessing}
          className="
            w-full rounded-lg border border-border dark:border-dark-border
            bg-white dark:bg-dark-card
            px-4 py-3 text-sm font-mono
            text-text-base dark:text-dark-text
            placeholder:text-text-muted dark:placeholder:text-dark-muted
            transition-colors
            focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand
            disabled:opacity-50
          "
        />
        <p className="mt-1 text-xs text-text-muted dark:text-dark-muted">
          {urls.length} URL{urls.length === 1 ? "" : "s"}
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 p-4 text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="size-5 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

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
        {isProcessing ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Processing {urls.length} video{urls.length === 1 ? "" : "s"}…
          </>
        ) : (
          <>
            <Play className="size-4" />
            Process {urls.length} URL{urls.length === 1 ? "" : "s"}
          </>
        )}
      </button>
    </form>
  );
}

interface BatchResultRowProps {
  item: { youtube_url: string; success: boolean; error: string | null };
}

function BatchResultRow({ item }: BatchResultRowProps): React.JSX.Element {
  const Icon = item.success ? CheckCircle2 : XCircle;
  const color = item.success ? "text-brand" : "text-red-600 dark:text-red-400";

  return (
    <li className="flex items-start gap-3 rounded-lg border border-border dark:border-dark-border bg-white dark:bg-dark-card p-3">
      <Icon className={`size-5 shrink-0 mt-0.5 ${color}`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text-base dark:text-dark-text truncate">
          {item.youtube_url}
        </p>
        {item.error && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">{item.error}</p>
        )}
      </div>
    </li>
  );
}
