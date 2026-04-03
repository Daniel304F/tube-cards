import { useState } from "react";
import { Clock, BookOpen, FileText, ChevronDown, ChevronRight, AlertCircle, Loader2, Upload } from "lucide-react";
import { useHistory } from "../../hooks/useHistory";
import { useFolders } from "../../hooks/useFolders";
import { FlashcardCard } from "../../components/flashcard-card";
import { FolderPicker } from "../../components/folder-picker";
import { exportToNotion, exportToRemnote } from "../../api/exports";
import { updateFlashcard } from "../../api/flashcards";
import { updateSummary } from "../../api/summaries";
import type { FlashcardData, SummaryData } from "../../api/videos";
import type { FolderData } from "../../api/folders";
import axios from "axios";

function HistorySkeleton(): React.JSX.Element {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-lg border border-border dark:border-dark-border bg-white dark:bg-dark-card p-5 animate-pulse">
          <div className="h-5 w-48 rounded bg-border dark:bg-dark-border mb-2" />
          <div className="h-4 w-32 rounded bg-border dark:bg-dark-border" />
        </div>
      ))}
    </div>
  );
}

interface ExportButtonsProps {
  flashcardIds: number[];
  summaryIds: number[];
}

function ExportButtons({ flashcardIds, summaryIds }: ExportButtonsProps): React.JSX.Element {
  const [exporting, setExporting] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleExport(target: "notion" | "remnote"): Promise<void> {
    setExporting(target);
    setMessage(null);
    try {
      const fn = target === "notion" ? exportToNotion : exportToRemnote;
      const result = await fn({ flashcard_ids: flashcardIds, summary_ids: summaryIds });
      setMessage(result.message);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        setMessage(typeof detail === "string" ? detail : `Export to ${target} failed.`);
      } else {
        setMessage(`Export to ${target} failed.`);
      }
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => void handleExport("notion")}
        disabled={exporting !== null}
        className="
          inline-flex items-center gap-1.5
          rounded-md border border-border dark:border-dark-border bg-white dark:bg-dark-card
          px-3 py-1.5
          text-xs font-medium text-text-base dark:text-dark-text
          transition-colors hover:bg-brand-surface dark:hover:bg-dark-surface
          disabled:opacity-50
          min-h-[36px]
        "
      >
        {exporting === "notion" ? <Loader2 className="size-3 animate-spin" /> : <Upload className="size-3" />}
        Notion
      </button>
      <button
        type="button"
        onClick={() => void handleExport("remnote")}
        disabled={exporting !== null}
        className="
          inline-flex items-center gap-1.5
          rounded-md border border-border dark:border-dark-border bg-white dark:bg-dark-card
          px-3 py-1.5
          text-xs font-medium text-text-base dark:text-dark-text
          transition-colors hover:bg-brand-surface dark:hover:bg-dark-surface
          disabled:opacity-50
          min-h-[36px]
        "
      >
        {exporting === "remnote" ? <Loader2 className="size-3 animate-spin" /> : <Upload className="size-3" />}
        Remnote
      </button>
      {message && (
        <span className="text-xs text-text-muted dark:text-dark-muted">{message}</span>
      )}
    </div>
  );
}

interface VideoSectionProps {
  title: string;
  createdAt: string;
  flashcards: FlashcardData[];
  summaries: SummaryData[];
  folders: FolderData[];
  onMoveFlashcard: (flashcardId: number, folderId: number | null) => void;
  onMoveSummary: (summaryId: number, folderId: number | null) => void;
}

function VideoSection({
  title,
  createdAt,
  flashcards,
  summaries,
  folders,
  onMoveFlashcard,
  onMoveSummary,
}: VideoSectionProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const date = new Date(createdAt).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div className="rounded-lg border border-border dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="
          w-full flex items-center justify-between
          px-5 py-4
          text-left
          transition-colors hover:bg-brand-surface dark:hover:bg-dark-surface
          focus:outline-none focus:ring-2 focus:ring-brand focus:ring-inset
          min-h-[44px]
        "
      >
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-text-base dark:text-dark-text truncate">{title}</h3>
          <p className="text-xs text-text-muted dark:text-dark-muted mt-0.5">
            {date} · {flashcards.length} cards · {summaries.length} {summaries.length === 1 ? "summary" : "summaries"}
          </p>
        </div>
        {isOpen ? (
          <ChevronDown className="size-5 text-text-muted dark:text-dark-muted shrink-0" />
        ) : (
          <ChevronRight className="size-5 text-text-muted dark:text-dark-muted shrink-0" />
        )}
      </button>

      {isOpen && (
        <div className="border-t border-border dark:border-dark-border px-5 py-4 space-y-6">
          {/* Export buttons */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-muted dark:text-dark-muted uppercase tracking-wide">
              Export
            </span>
            <ExportButtons
              flashcardIds={flashcards.map((fc) => fc.id)}
              summaryIds={summaries.map((s) => s.id)}
            />
          </div>

          {flashcards.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="size-4 text-brand" />
                <h4 className="text-sm font-medium text-text-base dark:text-dark-text">
                  Flashcards ({flashcards.length})
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {flashcards.map((fc, i) => (
                  <div key={fc.id} className="space-y-1.5">
                    <FlashcardCard question={fc.question} answer={fc.answer} index={i} />
                    <div className="flex justify-end">
                      <FolderPicker
                        folders={folders}
                        currentFolderId={fc.folder_id}
                        onSelect={(folderId) => onMoveFlashcard(fc.id, folderId)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {summaries.map((summary) => (
            <section key={summary.id}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-brand" />
                  <h4 className="text-sm font-medium text-text-base dark:text-dark-text">Summary</h4>
                </div>
                <FolderPicker
                  folders={folders}
                  currentFolderId={summary.folder_id}
                  onSelect={(folderId) => onMoveSummary(summary.id, folderId)}
                />
              </div>
              <div className="rounded-lg border border-border dark:border-dark-border bg-brand-surface dark:bg-dark-surface p-4">
                <p className="text-sm text-text-base dark:text-dark-text whitespace-pre-wrap leading-relaxed">
                  {summary.content}
                </p>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HistoryPage(): React.JSX.Element {
  const { videos, isLoading, error, refetch } = useHistory();
  const { folders } = useFolders();

  async function handleMoveFlashcard(flashcardId: number, folderId: number | null): Promise<void> {
    await updateFlashcard(flashcardId, { folder_id: folderId });
    await refetch();
  }

  async function handleMoveSummary(summaryId: number, folderId: number | null): Promise<void> {
    await updateSummary(summaryId, { folder_id: folderId });
    await refetch();
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-text-base dark:text-dark-text mb-6">History</h1>
        <HistorySkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-text-base dark:text-dark-text mb-6">History</h1>
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="size-5 shrink-0" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-text-base dark:text-dark-text mb-6">History</h1>
        <div className="flex flex-col items-center gap-3 py-16 text-text-muted dark:text-dark-muted">
          <Clock className="size-8 opacity-40" />
          <p className="text-sm">No processed videos yet.</p>
          <a href="/process" className="text-sm text-brand hover:underline transition-colors">
            Process your first video
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-text-base dark:text-dark-text mb-6">History</h1>
      <div className="space-y-3">
        {videos.map((video) => (
          <VideoSection
            key={video.id}
            title={video.title}
            createdAt={video.created_at}
            flashcards={video.flashcards}
            summaries={video.summaries}
            folders={folders}
            onMoveFlashcard={(fcId, folderId) => void handleMoveFlashcard(fcId, folderId)}
            onMoveSummary={(sumId, folderId) => void handleMoveSummary(sumId, folderId)}
          />
        ))}
      </div>
    </div>
  );
}
