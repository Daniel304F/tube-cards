import { useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  BookOpen,
  FileText,
  Loader2,
  Search as SearchIcon,
  Video,
} from "lucide-react";
import { useSearch } from "../../hooks/useSearch";
import type { SearchHit, SearchHitType } from "../../api/search";
import { Highlight } from "../../lib/highlight";

const HIT_ICON: Record<SearchHitType, typeof BookOpen> = {
  flashcard: BookOpen,
  summary: FileText,
  video: Video,
};

const HIT_LABEL: Record<SearchHitType, string> = {
  flashcard: "Flashcard",
  summary: "Summary",
  video: "Video",
};

interface HitRowProps {
  hit: SearchHit;
  query: string;
  focused: boolean;
}

function HitRow({ hit, query, focused }: HitRowProps): React.JSX.Element {
  const Icon = HIT_ICON[hit.type];
  const date = new Date(hit.created_at).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <article
      data-focused={focused}
      className={`
        rounded-lg border p-4
        bg-white dark:bg-dark-card
        transition-all
        ${focused
          ? "border-brand shadow-md ring-2 ring-brand/30"
          : "border-border dark:border-dark-border hover:border-brand hover:shadow-sm"}
      `}
    >
      <header className="flex items-center gap-2 mb-2">
        <Icon className="size-4 text-brand shrink-0" />
        <span className="text-[10px] uppercase tracking-wider font-semibold text-text-muted dark:text-dark-muted">
          {HIT_LABEL[hit.type]}
        </span>
        <span className="text-[11px] text-text-muted dark:text-dark-muted truncate">
          · {hit.video_title}
        </span>
        <span className="ml-auto text-[11px] text-text-muted dark:text-dark-muted shrink-0">
          {date}
        </span>
      </header>

      <h3 className="text-sm font-semibold text-text-base dark:text-dark-text mb-1">
        <Highlight text={hit.title} query={query} />
      </h3>

      {hit.snippet && (
        <p className="text-sm text-text-muted dark:text-dark-muted leading-relaxed whitespace-pre-wrap">
          <Highlight text={hit.snippet} query={query} />
        </p>
      )}
    </article>
  );
}

export default function SearchPage(): React.JSX.Element {
  const [params, setParams] = useSearchParams();
  const initialQuery = params.get("q") ?? "";
  const focusToken = params.get("focus");

  const { query, setQuery, results, isLoading, error } = useSearch(initialQuery, 100);

  useEffect(() => {
    const current = params.get("q") ?? "";
    if (query !== current) {
      const next = new URLSearchParams(params);
      if (query.trim()) {
        next.set("q", query);
      } else {
        next.delete("q");
      }
      next.delete("focus");
      setParams(next, { replace: true });
    }
  }, [query, params, setParams]);

  useEffect(() => {
    if (!focusToken) return;
    const el = document.querySelector(`[data-hit-id="${focusToken}"]`);
    if (el instanceof HTMLElement) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [focusToken, results]);

  const grouped = useMemo(() => {
    const map: Record<SearchHitType, SearchHit[]> = { flashcard: [], summary: [], video: [] };
    if (!results) return map;
    for (const hit of results.hits) map[hit.type].push(hit);
    return map;
  }, [results]);

  const hasResults = results && results.hits.length > 0;
  const hasQuery = query.trim().length >= 2;

  return (
    <div className="max-w-3xl mx-auto pb-24 md:pb-0">
      <h1 className="text-2xl font-bold text-text-base dark:text-dark-text mb-5">Search</h1>

      <div className="relative mb-6">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-text-muted dark:text-dark-muted pointer-events-none" />
        <input
          type="search"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search flashcards, summaries, videos…"
          className="
            w-full h-12 pl-11 pr-4
            rounded-lg
            bg-white dark:bg-dark-card
            border border-border dark:border-dark-border
            text-base text-text-base dark:text-dark-text
            placeholder:text-text-muted dark:placeholder:text-dark-muted
            transition-colors
            focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20
          "
        />
      </div>

      {!hasQuery && (
        <div className="flex flex-col items-center gap-3 py-16 text-text-muted dark:text-dark-muted">
          <SearchIcon className="size-8 opacity-40" />
          <p className="text-sm">Type at least 2 characters to search.</p>
        </div>
      )}

      {hasQuery && isLoading && (
        <div className="flex items-center justify-center gap-2 py-10 text-text-muted dark:text-dark-muted">
          <Loader2 className="size-4 animate-spin" />
          <span className="text-sm">Searching…</span>
        </div>
      )}

      {hasQuery && error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-900/40 dark:text-red-300">
          <AlertCircle className="size-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {hasQuery && !isLoading && !error && !hasResults && (
        <div className="flex flex-col items-center gap-3 py-16 text-text-muted dark:text-dark-muted">
          <SearchIcon className="size-8 opacity-40" />
          <p className="text-sm">
            No matches for <span className="font-medium">"{query}"</span>
          </p>
          <Link to="/history" className="text-sm text-brand hover:underline transition-colors">
            Browse history instead
          </Link>
        </div>
      )}

      {hasQuery && hasResults && (
        <div className="space-y-6">
          <p className="text-xs text-text-muted dark:text-dark-muted">
            {results.total} {results.total === 1 ? "result" : "results"}
          </p>

          {(["flashcard", "summary", "video"] as SearchHitType[]).map((type) => {
            const hits = grouped[type];
            if (hits.length === 0) return null;
            const Icon = HIT_ICON[type];
            return (
              <section key={type}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="size-4 text-brand" />
                  <h2 className="text-sm font-medium text-text-base dark:text-dark-text">
                    {HIT_LABEL[type]}s ({hits.length})
                  </h2>
                </div>
                <div className="space-y-3">
                  {hits.map((hit) => (
                    <div key={`${hit.type}-${hit.id}`} data-hit-id={`${hit.type}:${hit.id}`}>
                      <HitRow
                        hit={hit}
                        query={query}
                        focused={focusToken === `${hit.type}:${hit.id}`}
                      />
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
