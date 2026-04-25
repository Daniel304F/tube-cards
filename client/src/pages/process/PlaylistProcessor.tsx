import { useState } from "react";
import { Loader2, Play, RotateCcw, AlertCircle, CheckCircle2, XCircle, ListVideo } from "lucide-react";
import axios from "axios";
import { processPlaylist, type BatchResult } from "../../api/videos";

const PLAYLIST_URL_REGEX = /youtube\.com\/.*[?&]list=/;

export function PlaylistProcessor(): React.JSX.Element {
  const [url, setUrl] = useState<string>("");
  const [result, setResult] = useState<BatchResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isValidUrl = PLAYLIST_URL_REGEX.test(url);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!isValidUrl) return;
    setIsProcessing(true);
    setError(null);
    setResult(null);
    try {
      const data = await processPlaylist(url);
      setResult(data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        setError(typeof detail === "string" ? detail : "Playlist processing failed.");
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setIsProcessing(false);
    }
  }

  function handleReset(): void {
    setUrl("");
    setResult(null);
    setError(null);
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
            New playlist
          </button>
        </div>

        <ul className="space-y-2">
          {result.results.map((item) => {
            const Icon = item.success ? CheckCircle2 : XCircle;
            const color = item.success ? "text-brand" : "text-red-600 dark:text-red-400";
            return (
              <li
                key={item.youtube_url}
                className="flex items-start gap-3 rounded-lg border border-border dark:border-dark-border bg-white dark:bg-dark-card p-3"
              >
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
          })}
        </ul>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <div>
        <label
          htmlFor="playlist-url"
          className="block text-sm font-medium text-text-base dark:text-dark-text mb-1"
        >
          YouTube playlist URL
        </label>
        <div className="relative">
          <ListVideo className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-muted dark:text-dark-muted" />
          <input
            id="playlist-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/playlist?list=..."
            disabled={isProcessing}
            className="
              w-full rounded-lg border border-border dark:border-dark-border
              bg-white dark:bg-dark-card
              pl-10 pr-4 py-3 text-sm
              text-text-base dark:text-dark-text
              placeholder:text-text-muted dark:placeholder:text-dark-muted
              transition-colors
              focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand
              disabled:opacity-50
            "
          />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 p-4 text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="size-5 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!isValidUrl || isProcessing}
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
            Reading playlist & processing…
          </>
        ) : (
          <>
            <Play className="size-4" />
            Process playlist
          </>
        )}
      </button>
    </form>
  );
}
