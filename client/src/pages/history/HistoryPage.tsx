import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Clock, BookOpen, FileText, ChevronDown, ChevronRight, AlertCircle, Loader2, RotateCcw, Upload } from "lucide-react";
import { useHistory } from "../../hooks/useHistory";
import { useFolders } from "../../hooks/useFolders";
import { useTags } from "../../hooks/useTags";
import { FlashcardCard } from "../../components/flashcard-card";
import { FolderPicker } from "../../components/folder-picker";
import { TagPicker } from "../../components/tag-picker";
import { EditableText } from "../../components/editable-text";
import { exportToAnki, exportToNotion, exportToRemnote } from "../../api/exports";
import { updateFlashcard } from "../../api/flashcards";
import { updateSummary } from "../../api/summaries";
import { regenerateVideo } from "../../api/videos";
import { attachTag, detachTag, type TagData } from "../../api/tags";
import type { FlashcardData, SummaryData } from "../../api/videos";
import { triggerBlobDownload } from "../../lib/download";

const ANKI_FILENAME = "tubecards-export.apkg";
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

interface ExportButtonProps {
  label: string;
  isLoading: boolean;
  disabled: boolean;
  onClick: () => void;
}

function ExportButton({ label, isLoading, disabled, onClick }: ExportButtonProps): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
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
      {isLoading ? <Loader2 className="size-3 animate-spin" /> : <Upload className="size-3" />}
      {label}
    </button>
  );
}

function _detailFromError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const detail = err.response?.data?.detail;
    return typeof detail === "string" ? detail : fallback;
  }
  return fallback;
}

interface ExportButtonsProps {
  flashcardIds: number[];
  summaryIds: number[];
}

function ExportButtons({ flashcardIds, summaryIds }: ExportButtonsProps): React.JSX.Element {
  const [exporting, setExporting] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handlePushExport(target: "notion" | "remnote"): Promise<void> {
    setExporting(target);
    setMessage(null);
    try {
      const fn = target === "notion" ? exportToNotion : exportToRemnote;
      const result = await fn({ flashcard_ids: flashcardIds, summary_ids: summaryIds });
      setMessage(result.message);
    } catch (err: unknown) {
      setMessage(_detailFromError(err, `Export to ${target} failed.`));
    } finally {
      setExporting(null);
    }
  }

  async function handleAnkiExport(): Promise<void> {
    setExporting("anki");
    setMessage(null);
    try {
      const blob = await exportToAnki(flashcardIds);
      triggerBlobDownload(blob, ANKI_FILENAME);
      setMessage(`Downloaded ${flashcardIds.length} flashcard${flashcardIds.length === 1 ? "" : "s"} as ${ANKI_FILENAME}.`);
    } catch (err: unknown) {
      setMessage(_detailFromError(err, "Anki export failed."));
    } finally {
      setExporting(null);
    }
  }

  const isAny = exporting !== null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ExportButton
        label="Notion"
        isLoading={exporting === "notion"}
        disabled={isAny}
        onClick={() => void handlePushExport("notion")}
      />
      <ExportButton
        label="Remnote"
        isLoading={exporting === "remnote"}
        disabled={isAny}
        onClick={() => void handlePushExport("remnote")}
      />
      <ExportButton
        label="Anki"
        isLoading={exporting === "anki"}
        disabled={isAny || flashcardIds.length === 0}
        onClick={() => void handleAnkiExport()}
      />
      {message && (
        <span className="text-xs text-text-muted dark:text-dark-muted">{message}</span>
      )}
    </div>
  );
}

interface RegenerateButtonProps {
  videoId: number;
  onDone: () => Promise<void>;
}

function RegenerateButton({ videoId, onDone }: RegenerateButtonProps): React.JSX.Element {
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick(): Promise<void> {
    setIsRegenerating(true);
    setError(null);
    try {
      await regenerateVideo(videoId);
      await onDone();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        setError(typeof detail === "string" ? detail : "Regenerate failed.");
      } else {
        setError("Regenerate failed.");
      }
    } finally {
      setIsRegenerating(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={isRegenerating}
        title="Replace all flashcards & summary with a fresh LLM run"
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
        {isRegenerating ? <Loader2 className="size-3 animate-spin" /> : <RotateCcw className="size-3" />}
        Regenerate
      </button>
      {error && (
        <span className="text-xs text-red-600 dark:text-red-400">{error}</span>
      )}
    </div>
  );
}

interface VideoSectionProps {
  title: string;
  videoId: number;
  createdAt: string;
  defaultOpen?: boolean;
  flashcards: FlashcardData[];
  summaries: SummaryData[];
  folders: FolderData[];
  allTags: TagData[];
  onMoveFlashcard: (flashcardId: number, folderId: number | null) => void;
  onMoveSummary: (summaryId: number, folderId: number | null) => void;
  onAttachTag: (flashcardId: number, tagId: number) => void;
  onDetachTag: (flashcardId: number, tagId: number) => void;
  onCreateTag: (name: string) => Promise<TagData>;
  onEditFlashcard: (flashcardId: number, data: { question: string; answer: string }) => Promise<void>;
  onEditSummary: (summaryId: number, content: string) => Promise<void>;
  onRegenerated: () => Promise<void>;
}

function VideoSection({
  title,
  videoId,
  createdAt,
  defaultOpen = false,
  flashcards,
  summaries,
  folders,
  allTags,
  onMoveFlashcard,
  onMoveSummary,
  onAttachTag,
  onDetachTag,
  onCreateTag,
  onEditFlashcard,
  onEditSummary,
  onRegenerated,
}: VideoSectionProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState<boolean>(defaultOpen);
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
          {/* Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <RegenerateButton videoId={videoId} onDone={onRegenerated} />
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
                    <FlashcardCard
                      question={fc.question}
                      answer={fc.answer}
                      index={i}
                      onSave={(data) => onEditFlashcard(fc.id, data)}
                    />
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <TagPicker
                        allTags={allTags}
                        attachedTagIds={fc.tags.map((t) => t.id)}
                        onAttach={(tagId) => onAttachTag(fc.id, tagId)}
                        onDetach={(tagId) => onDetachTag(fc.id, tagId)}
                        onCreate={onCreateTag}
                      />
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
                <EditableText
                  value={summary.content}
                  onSave={(content) => onEditSummary(summary.id, content)}
                  label="summary"
                  textClassName="text-sm text-text-base dark:text-dark-text leading-relaxed"
                />
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function parseExpandParam(value: string | null): number | null {
  if (value === null) return null;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export default function HistoryPage(): React.JSX.Element {
  const { videos, isLoading, error, refetch } = useHistory();
  const { folders } = useFolders();
  const { tags, create: createTag } = useTags();
  const [searchParams] = useSearchParams();
  const expandedVideoId = parseExpandParam(searchParams.get("expand"));

  async function handleMoveFlashcard(flashcardId: number, folderId: number | null): Promise<void> {
    await updateFlashcard(flashcardId, { folder_id: folderId });
    await refetch();
  }

  async function handleMoveSummary(summaryId: number, folderId: number | null): Promise<void> {
    await updateSummary(summaryId, { folder_id: folderId });
    await refetch();
  }

  async function handleAttachTag(flashcardId: number, tagId: number): Promise<void> {
    await attachTag(flashcardId, tagId);
    await refetch();
  }

  async function handleDetachTag(flashcardId: number, tagId: number): Promise<void> {
    await detachTag(flashcardId, tagId);
    await refetch();
  }

  async function handleCreateTag(name: string): Promise<TagData> {
    return createTag({ name });
  }

  async function handleEditFlashcard(
    flashcardId: number,
    data: { question: string; answer: string },
  ): Promise<void> {
    await updateFlashcard(flashcardId, data);
    await refetch();
  }

  async function handleEditSummary(summaryId: number, content: string): Promise<void> {
    await updateSummary(summaryId, { content });
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
            videoId={video.id}
            createdAt={video.created_at}
            defaultOpen={video.id === expandedVideoId}
            flashcards={video.flashcards}
            summaries={video.summaries}
            folders={folders}
            allTags={tags}
            onMoveFlashcard={(fcId, folderId) => void handleMoveFlashcard(fcId, folderId)}
            onMoveSummary={(sumId, folderId) => void handleMoveSummary(sumId, folderId)}
            onAttachTag={(fcId, tagId) => void handleAttachTag(fcId, tagId)}
            onDetachTag={(fcId, tagId) => void handleDetachTag(fcId, tagId)}
            onCreateTag={handleCreateTag}
            onEditFlashcard={handleEditFlashcard}
            onEditSummary={handleEditSummary}
            onRegenerated={refetch}
          />
        ))}
      </div>
    </div>
  );
}
