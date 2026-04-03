import { useParams, Link } from "react-router-dom";
import { ChevronLeft, BookOpen, FileText, Folder, AlertCircle } from "lucide-react";
import { useFolderContent } from "../../hooks/useFolderContent";
import { FlashcardCard } from "../../components/flashcard-card";

function FolderSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-4">
      <div className="h-6 w-48 rounded bg-border dark:bg-dark-surface animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border border-border dark:border-dark-border bg-white dark:bg-dark-card p-5 animate-pulse">
            <div className="h-4 w-3/4 rounded bg-border dark:bg-dark-surface mb-2" />
            <div className="h-3 w-1/2 rounded bg-border dark:bg-dark-surface" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FolderPage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();
  const folderId = Number(id);
  const { folder, flashcards, summaries, isLoading, error } = useFolderContent(folderId);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <FolderSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 p-4 text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="size-5 shrink-0" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const isEmpty = flashcards.length === 0 && summaries.length === 0;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/folders"
          className="
            p-2 min-w-[44px] min-h-[44px]
            flex items-center justify-center
            rounded-lg text-text-muted dark:text-dark-muted
            transition-colors hover:bg-brand-surface dark:hover:bg-dark-surface hover:text-text-base dark:hover:text-dark-text
          "
          aria-label="Back to folders"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <Folder className="size-5 text-brand" />
        <h1 className="text-2xl font-bold text-text-base dark:text-dark-text truncate">
          {folder?.name ?? "Folder"}
        </h1>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center gap-3 py-16 text-text-muted dark:text-dark-muted">
          <Folder className="size-8 opacity-40" />
          <p className="text-sm">This folder is empty.</p>
          <p className="text-xs">Move flashcards or summaries here from the History page.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {flashcards.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="size-5 text-brand" />
                <h2 className="text-lg font-semibold text-text-base dark:text-dark-text">
                  Flashcards ({flashcards.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {flashcards.map((fc, i) => (
                  <FlashcardCard
                    key={fc.id}
                    question={fc.question}
                    answer={fc.answer}
                    index={i}
                  />
                ))}
              </div>
            </section>
          )}

          {summaries.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="size-5 text-brand" />
                <h2 className="text-lg font-semibold text-text-base dark:text-dark-text">
                  Summaries ({summaries.length})
                </h2>
              </div>
              {summaries.map((summary) => (
                <div
                  key={summary.id}
                  className="rounded-lg border border-border dark:border-dark-border bg-white dark:bg-dark-card p-5 shadow-sm"
                >
                  <p className="text-sm text-text-base dark:text-dark-text whitespace-pre-wrap leading-relaxed">
                    {summary.content}
                  </p>
                </div>
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
