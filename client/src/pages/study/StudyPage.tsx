import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Loader2,
  RotateCcw,
  Sparkles,
  Trophy,
} from "lucide-react";
import { useStudy } from "../../hooks/useStudy";
import type { ReviewQuality, StudyCardData } from "../../api/study";

interface QualityButtonProps {
  quality: ReviewQuality;
  label: string;
  hint: string;
  color: string;
  onClick: () => void;
  disabled: boolean;
}

function QualityButton({
  label,
  hint,
  color,
  onClick,
  disabled,
}: QualityButtonProps): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        flex flex-col items-center justify-center
        flex-1 min-h-[72px]
        px-3 py-3
        rounded-lg border
        text-sm font-semibold
        transition-all
        active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-dark-bg
        ${color}
      `}
    >
      <span>{label}</span>
      <span className="text-[10px] font-normal opacity-80 mt-0.5">{hint}</span>
    </button>
  );
}

function formatInterval(days: number): string {
  if (days === 0) return "now";
  if (days === 1) return "1d";
  if (days < 30) return `${days}d`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${Math.round(days / 365)}y`;
}

function projectInterval(card: StudyCardData, quality: ReviewQuality): number {
  if (quality === "again") return 1;
  const ease = card.ease_factor;
  if (card.repetitions === 0) return 1;
  if (card.repetitions === 1) return 6;
  const base = Math.round(card.interval * ease);
  if (quality === "hard") return Math.max(1, Math.round(card.interval * 1.2));
  if (quality === "easy") return Math.max(1, Math.round(base * 1.3));
  return base;
}

interface StudyCardViewProps {
  card: StudyCardData;
  onReview: (quality: ReviewQuality) => Promise<void>;
}

function StudyCardView({ card, onReview }: StudyCardViewProps): React.JSX.Element {
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    setIsFlipped(false);
    setSubmitting(false);
  }, [card.id]);

  async function handleReview(quality: ReviewQuality): Promise<void> {
    setSubmitting(true);
    await onReview(quality);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-text-muted dark:text-dark-muted">
        <span className="inline-flex items-center gap-1.5 truncate">
          <BookOpen className="size-3.5 shrink-0" />
          <span className="truncate">{card.video_title}</span>
        </span>
        <span className="shrink-0">
          {card.repetitions === 0 ? "New" : `Rep ${card.repetitions}`} · ease {card.ease_factor.toFixed(2)}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setIsFlipped((f) => !f)}
        className="
          w-full min-h-[260px]
          rounded-xl border border-border dark:border-dark-border
          bg-white dark:bg-dark-card
          p-6 md:p-8
          shadow-sm
          transition-all
          hover:shadow-md hover:border-brand
          focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 dark:focus:ring-offset-dark-bg
          text-left
          flex flex-col
        "
        aria-label={isFlipped ? "Show question" : "Show answer"}
      >
        <span className="text-[11px] font-semibold text-brand uppercase tracking-wider">
          {isFlipped ? "Answer" : "Question"}
        </span>
        <p className="mt-3 text-base md:text-lg text-text-base dark:text-dark-text leading-relaxed whitespace-pre-wrap">
          {isFlipped ? card.answer : card.question}
        </p>
        {!isFlipped && (
          <span className="mt-auto pt-4 inline-flex items-center gap-1.5 text-xs text-text-muted dark:text-dark-muted">
            <RotateCcw className="size-3.5" />
            Tap to reveal answer
          </span>
        )}
      </button>

      {isFlipped ? (
        <div className="flex items-stretch gap-2">
          <QualityButton
            quality="again"
            label="Again"
            hint={formatInterval(projectInterval(card, "again"))}
            color="border-red-200 bg-red-50 text-red-700 hover:bg-red-100 focus:ring-red-300 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30"
            onClick={() => void handleReview("again")}
            disabled={submitting}
          />
          <QualityButton
            quality="hard"
            label="Hard"
            hint={formatInterval(projectInterval(card, "hard"))}
            color="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 focus:ring-amber-300 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300 dark:hover:bg-amber-900/30"
            onClick={() => void handleReview("hard")}
            disabled={submitting}
          />
          <QualityButton
            quality="good"
            label="Good"
            hint={formatInterval(projectInterval(card, "good"))}
            color="border-brand bg-brand-surface text-brand-dark hover:bg-brand/10 focus:ring-brand dark:border-brand/40 dark:bg-brand/10 dark:text-brand dark:hover:bg-brand/20"
            onClick={() => void handleReview("good")}
            disabled={submitting}
          />
          <QualityButton
            quality="easy"
            label="Easy"
            hint={formatInterval(projectInterval(card, "easy"))}
            color="border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 focus:ring-sky-300 dark:border-sky-900/40 dark:bg-sky-900/20 dark:text-sky-300 dark:hover:bg-sky-900/30"
            onClick={() => void handleReview("easy")}
            disabled={submitting}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsFlipped(true)}
          className="
            w-full min-h-[52px]
            rounded-lg
            bg-brand hover:bg-brand-dark
            text-white font-semibold text-sm
            transition-colors active:scale-[0.98]
            focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 dark:focus:ring-offset-dark-bg
          "
        >
          Show answer
        </button>
      )}
    </div>
  );
}

interface StatTileProps {
  label: string;
  value: number;
  accent?: boolean;
}

function StatTile({ label, value, accent }: StatTileProps): React.JSX.Element {
  return (
    <div
      className={`
        rounded-lg border px-3 py-3
        ${accent
          ? "border-brand bg-brand-surface dark:bg-brand/10"
          : "border-border dark:border-dark-border bg-white dark:bg-dark-card"}
      `}
    >
      <p className={`text-[10px] font-medium uppercase tracking-wide ${accent ? "text-brand-dark dark:text-brand" : "text-text-muted dark:text-dark-muted"}`}>
        {label}
      </p>
      <p className={`mt-1 text-xl font-bold ${accent ? "text-brand-dark dark:text-brand" : "text-text-base dark:text-dark-text"}`}>
        {value}
      </p>
    </div>
  );
}

export default function StudyPage(): React.JSX.Element {
  const { cards, stats, isLoading, error, currentIndex, reviewed, submitReview, restart } =
    useStudy();

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-text-base dark:text-dark-text mb-6">Study</h1>
        <div className="flex items-center justify-center gap-2 py-20 text-text-muted dark:text-dark-muted">
          <Loader2 className="size-5 animate-spin" />
          <span className="text-sm">Loading session…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-text-base dark:text-dark-text mb-6">Study</h1>
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="size-5 shrink-0" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const currentCard: StudyCardData | undefined = cards[currentIndex];
  const totalInSession = cards.length;
  const sessionDone = !currentCard && totalInSession > 0;
  const noCards = totalInSession === 0;

  return (
    <div className="max-w-2xl mx-auto pb-24 md:pb-0">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-base dark:text-dark-text">Study</h1>
          <p className="text-xs text-text-muted dark:text-dark-muted mt-1">
            Spaced repetition — SM-2 algorithm
          </p>
        </div>
        {currentCard && (
          <span className="text-sm font-medium text-text-muted dark:text-dark-muted">
            {currentIndex + 1} / {totalInSession}
          </span>
        )}
      </div>

      {stats && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-6">
          <StatTile label="Due now" value={stats.due_now} accent />
          <StatTile label="Today" value={stats.learned_today} />
          <StatTile label="New" value={stats.new_cards} />
          <StatTile label="Learning" value={stats.learning_cards} />
          <StatTile label="Mature" value={stats.mature_cards} />
          <StatTile label="Total" value={stats.total_cards} />
        </div>
      )}

      {noCards && (
        <div className="flex flex-col items-center gap-3 py-16 text-text-muted dark:text-dark-muted">
          <Sparkles className="size-8 text-brand opacity-70" />
          <p className="text-sm">No cards are due right now.</p>
          <p className="text-xs">Come back later or process a new video to add cards.</p>
          <Link
            to="/process"
            className="mt-2 text-sm text-brand hover:underline transition-colors"
          >
            Process a video
          </Link>
        </div>
      )}

      {sessionDone && (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <Trophy className="size-10 text-brand" />
          <div>
            <p className="text-lg font-semibold text-text-base dark:text-dark-text">
              Session complete
            </p>
            <p className="text-sm text-text-muted dark:text-dark-muted mt-1">
              You reviewed {reviewed} {reviewed === 1 ? "card" : "cards"}.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void restart()}
              className="
                inline-flex items-center gap-2
                px-4 py-2 rounded-lg
                bg-brand hover:bg-brand-dark
                text-white text-sm font-semibold
                transition-colors
                focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 dark:focus:ring-offset-dark-bg
              "
            >
              <CheckCircle2 className="size-4" />
              Check for more
            </button>
            <Link
              to="/history"
              className="
                inline-flex items-center gap-2
                px-4 py-2 rounded-lg
                border border-border dark:border-dark-border
                bg-white dark:bg-dark-card
                text-sm font-medium text-text-base dark:text-dark-text
                transition-colors hover:bg-brand-surface dark:hover:bg-dark-surface
              "
            >
              Back to history
            </Link>
          </div>
        </div>
      )}

      {currentCard && <StudyCardView card={currentCard} onReview={submitReview} />}
    </div>
  );
}
