import { useState } from "react";
import { Loader2, Play, RotateCcw, AlertCircle, MonitorPlay, BookOpen, FileText } from "lucide-react";
import { useVideoProcessor } from "../../hooks/useVideoProcessor";
import { FlashcardCard } from "../../components/flashcard-card";

const YOUTUBE_URL_REGEX = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}/;

export default function ProcessPage(): React.JSX.Element {
  const [url, setUrl] = useState<string>("");
  const { result, isProcessing, error, process, reset } = useVideoProcessor();

  const isValidUrl = YOUTUBE_URL_REGEX.test(url);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!isValidUrl) return;
    await process(url);
  }

  function handleReset(): void {
    setUrl("");
    reset();
  }

  if (result) {
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header with video info */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-medium text-text-muted dark:text-dark-muted uppercase tracking-wide mb-1">
              Processed Video
            </p>
            <h1 className="text-xl md:text-2xl font-bold text-text-base dark:text-dark-text truncate">
              {result.video.title}
            </h1>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="
              inline-flex items-center gap-2
              rounded-lg border border-border dark:border-dark-border bg-white dark:bg-dark-card
              px-3 py-2
              text-sm font-medium text-text-base dark:text-dark-text
              transition-colors
              hover:bg-brand-surface dark:hover:bg-dark-surface
              focus:outline-none focus:ring-2 focus:ring-brand
              shrink-0
              min-h-[44px]
            "
          >
            <RotateCcw className="size-4" />
            New
          </button>
        </div>

        {/* Flashcards */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="size-5 text-brand" />
            <h2 className="text-lg font-semibold text-text-base dark:text-dark-text">
              Flashcards ({result.flashcards.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {result.flashcards.map((fc, i) => (
              <FlashcardCard
                key={fc.id}
                question={fc.question}
                answer={fc.answer}
                index={i}
              />
            ))}
          </div>
        </section>

        {/* Summary */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="size-5 text-brand" />
            <h2 className="text-lg font-semibold text-text-base dark:text-dark-text">Summary</h2>
          </div>
          <div className="rounded-lg border border-border dark:border-dark-border bg-white dark:bg-dark-card p-5 shadow-sm">
            <div className="prose prose-sm max-w-none text-text-base dark:text-dark-text whitespace-pre-wrap leading-relaxed">
              {result.summary.content}
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-brand-surface dark:bg-dark-surface mb-4">
          <MonitorPlay className="size-8 text-brand" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-text-base dark:text-dark-text mb-2">
          Process a Video
        </h1>
        <p className="text-sm text-text-muted dark:text-dark-muted">
          Paste a YouTube URL and we'll generate flashcards and a summary from the transcript.
        </p>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div>
          <label htmlFor="youtube-url" className="block text-sm font-medium text-text-base dark:text-dark-text mb-1">
            YouTube URL
          </label>
          <input
            id="youtube-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            disabled={isProcessing}
            className="
              w-full rounded-lg border border-border dark:border-dark-border bg-white dark:bg-dark-card
              px-4 py-3
              text-sm text-text-base dark:text-dark-text
              placeholder:text-text-muted dark:placeholder:text-dark-muted
              transition-colors
              focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand
              disabled:opacity-50
            "
          />
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
            rounded-lg bg-brand
            px-4 py-3
            text-sm font-medium text-white
            transition-colors
            hover:bg-brand-dark
            focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 dark:focus:ring-offset-dark-bg
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          {isProcessing ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Processing… this may take a moment
            </>
          ) : (
            <>
              <Play className="size-4" />
              Generate Flashcards & Summary
            </>
          )}
        </button>
      </form>
    </div>
  );
}
