import { useState } from "react";
import { RotateCcw, Pencil, Check, X, Loader2 } from "lucide-react";

interface FlashcardSaveInput {
  question: string;
  answer: string;
}

interface FlashcardCardProps {
  question: string;
  answer: string;
  index: number;
  onSave?: (data: FlashcardSaveInput) => Promise<void> | void;
}

export function FlashcardCard({
  question,
  answer,
  index,
  onSave,
}: FlashcardCardProps): React.JSX.Element {
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [draftQ, setDraftQ] = useState<string>(question);
  const [draftA, setDraftA] = useState<string>(answer);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  function enterEdit(): void {
    setDraftQ(question);
    setDraftA(answer);
    setIsEditing(true);
  }

  function cancelEdit(): void {
    setDraftQ(question);
    setDraftA(answer);
    setIsEditing(false);
  }

  async function handleSave(): Promise<void> {
    if (!onSave) return;
    const q = draftQ.trim();
    const a = draftA.trim();
    if (q.length === 0 || a.length === 0) return;
    if (q === question.trim() && a === answer.trim()) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      await onSave({ question: q, answer: a });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  }

  if (isEditing) {
    return (
      <div className="
        w-full
        rounded-lg border border-brand
        bg-white dark:bg-dark-card
        p-5
        shadow-sm
        space-y-3
      ">
        <div className="flex items-center gap-3">
          <span className="
            inline-flex items-center justify-center
            size-6 rounded-full
            bg-brand-surface dark:bg-dark-surface text-brand
            text-xs font-semibold
            shrink-0
          ">
            {index + 1}
          </span>
          <span className="text-xs font-medium text-brand uppercase tracking-wide">
            Editing
          </span>
        </div>

        <div>
          <label className="block text-xs font-medium text-text-muted dark:text-dark-muted uppercase tracking-wide mb-1">
            Question
          </label>
          <textarea
            aria-label="Question"
            value={draftQ}
            onChange={(e) => setDraftQ(e.target.value)}
            rows={2}
            className="
              w-full
              rounded border border-border dark:border-dark-border
              bg-white dark:bg-dark-bg
              px-2 py-1.5
              text-sm text-text-base dark:text-dark-text
              focus:outline-none focus:ring-2 focus:ring-brand
              resize-y min-h-[56px]
            "
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-text-muted dark:text-dark-muted uppercase tracking-wide mb-1">
            Answer
          </label>
          <textarea
            aria-label="Answer"
            value={draftA}
            onChange={(e) => setDraftA(e.target.value)}
            rows={3}
            className="
              w-full
              rounded border border-border dark:border-dark-border
              bg-white dark:bg-dark-bg
              px-2 py-1.5
              text-sm text-text-base dark:text-dark-text
              focus:outline-none focus:ring-2 focus:ring-brand
              resize-y min-h-[72px]
            "
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={cancelEdit}
            disabled={isSaving}
            aria-label="Cancel"
            className="
              inline-flex items-center gap-1
              rounded-md border border-border dark:border-dark-border
              bg-white dark:bg-dark-card
              px-3 py-1.5
              text-xs font-medium text-text-muted dark:text-dark-muted
              transition-colors
              hover:text-text-base dark:hover:text-dark-text
              disabled:opacity-50
              min-h-[36px]
            "
          >
            <X className="size-3" />
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving}
            aria-label="Save"
            className="
              inline-flex items-center gap-1
              rounded-md
              bg-brand
              px-3 py-1.5
              text-xs font-medium text-white
              transition-colors
              hover:bg-brand-dark
              disabled:opacity-50
              min-h-[36px]
            "
          >
            {isSaving ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setIsFlipped((prev) => !prev)}
        className="
          w-full text-left
          rounded-lg border border-border dark:border-dark-border
          bg-white dark:bg-dark-card
          p-5
          shadow-sm
          transition-all duration-200
          hover:shadow-md hover:border-brand
          focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 dark:focus:ring-offset-dark-bg
          min-h-[120px]
          cursor-pointer
          block
        "
        aria-label={isFlipped ? "Show question" : "Show answer"}
      >
        <div className="flex items-start justify-between gap-3">
          <span className="
            inline-flex items-center justify-center
            size-6 rounded-full
            bg-brand-surface dark:bg-dark-surface text-brand
            text-xs font-semibold
            shrink-0
          ">
            {index + 1}
          </span>
          <RotateCcw className="size-4 text-text-muted dark:text-dark-muted shrink-0 mt-0.5" />
        </div>

        <div className="mt-3">
          <p className="text-xs font-medium text-text-muted dark:text-dark-muted uppercase tracking-wide mb-1">
            {isFlipped ? "Answer" : "Question"}
          </p>
          <p className="text-sm text-text-base dark:text-dark-text leading-relaxed whitespace-pre-wrap">
            {isFlipped ? answer : question}
          </p>
        </div>
      </button>

      {onSave && (
        <button
          type="button"
          aria-label="Edit flashcard"
          onClick={(e) => {
            e.stopPropagation();
            enterEdit();
          }}
          className="
            absolute top-2 right-10
            inline-flex items-center justify-center
            size-8 rounded-md
            bg-white/80 dark:bg-dark-card/80
            text-text-muted dark:text-dark-muted
            transition-colors
            hover:text-brand hover:bg-brand-surface dark:hover:bg-dark-surface
            focus:outline-none focus:ring-2 focus:ring-brand
          "
        >
          <Pencil className="size-3.5" />
        </button>
      )}
    </div>
  );
}
