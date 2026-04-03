import { useState } from "react";
import { RotateCcw } from "lucide-react";

interface FlashcardCardProps {
  question: string;
  answer: string;
  index: number;
}

export function FlashcardCard({ question, answer, index }: FlashcardCardProps): React.JSX.Element {
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  return (
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
        relative
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
        <p className="text-sm text-text-base dark:text-dark-text leading-relaxed">
          {isFlipped ? answer : question}
        </p>
      </div>
    </button>
  );
}
