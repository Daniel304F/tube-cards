import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, FileText, Loader2, Search, Video, X } from "lucide-react";
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

interface SearchBarProps {
  autoFocus?: boolean;
  placeholder?: string;
  onNavigate?: () => void;
}

export function SearchBar({
  autoFocus = false,
  placeholder = "Search flashcards, summaries…",
  onNavigate,
}: SearchBarProps): React.JSX.Element {
  const { query, setQuery, results, isLoading, error } = useSearch();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent): void {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  function handleHitClick(hit: SearchHit): void {
    setIsOpen(false);
    onNavigate?.();
    navigate(`/search?q=${encodeURIComponent(query)}&focus=${hit.type}:${hit.id}`);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    if (query.trim().length < 2) return;
    setIsOpen(false);
    onNavigate?.();
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  const hasResults = results && results.hits.length > 0;
  const showDropdown = isOpen && query.trim().length >= 2;

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-muted dark:text-dark-muted pointer-events-none" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            autoFocus={autoFocus}
            placeholder={placeholder}
            className="
              w-full h-10 pl-9 pr-16
              rounded-lg
              bg-brand-surface dark:bg-dark-surface
              border border-border dark:border-dark-border
              text-sm text-text-base dark:text-dark-text
              placeholder:text-text-muted dark:placeholder:text-dark-muted
              transition-colors
              focus:outline-none focus:bg-white dark:focus:bg-dark-card focus:border-brand focus:ring-2 focus:ring-brand/20
            "
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="absolute right-12 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-base dark:text-dark-muted dark:hover:text-dark-text transition-colors"
            >
              <X className="size-4" />
            </button>
          )}
          <kbd className="
            absolute right-2 top-1/2 -translate-y-1/2
            hidden md:inline-flex items-center justify-center
            h-6 px-1.5
            rounded border border-border dark:border-dark-border
            bg-white dark:bg-dark-card
            text-[10px] font-medium text-text-muted dark:text-dark-muted
            pointer-events-none
          ">
            Ctrl K
          </kbd>
        </div>
      </form>

      {showDropdown && (
        <div className="
          absolute left-0 right-0 top-full mt-2 z-50
          rounded-lg border border-border dark:border-dark-border
          bg-white dark:bg-dark-card
          shadow-lg
          max-h-[70vh] overflow-y-auto
        ">
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-6 text-text-muted dark:text-dark-muted">
              <Loader2 className="size-4 animate-spin" />
              <span className="text-sm">Searching…</span>
            </div>
          )}

          {!isLoading && error && (
            <div className="px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</div>
          )}

          {!isLoading && !error && !hasResults && (
            <div className="px-4 py-6 text-center text-sm text-text-muted dark:text-dark-muted">
              No matches for <span className="font-medium">"{query}"</span>
            </div>
          )}

          {!isLoading && hasResults && (
            <ul className="py-1">
              {results.hits.map((hit) => {
                const Icon = HIT_ICON[hit.type];
                return (
                  <li key={`${hit.type}-${hit.id}`}>
                    <button
                      type="button"
                      onClick={() => handleHitClick(hit)}
                      className="
                        w-full flex items-start gap-3
                        px-4 py-2.5
                        text-left
                        transition-colors
                        hover:bg-brand-surface dark:hover:bg-dark-surface
                        focus:outline-none focus:bg-brand-surface dark:focus:bg-dark-surface
                      "
                    >
                      <Icon className="size-4 text-brand shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-text-muted dark:text-dark-muted">
                            {HIT_LABEL[hit.type]}
                          </span>
                          <span className="text-[11px] text-text-muted dark:text-dark-muted truncate">
                            {hit.video_title}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-text-base dark:text-dark-text truncate">
                          <Highlight text={hit.title} query={query} />
                        </p>
                        {hit.snippet && (
                          <p className="text-xs text-text-muted dark:text-dark-muted line-clamp-2 mt-0.5">
                            <Highlight text={hit.snippet} query={query} />
                          </p>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {!isLoading && hasResults && (
            <div className="border-t border-border dark:border-dark-border px-4 py-2 text-right">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onNavigate?.();
                  navigate(`/search?q=${encodeURIComponent(query.trim())}`);
                }}
                className="text-xs font-medium text-brand hover:underline"
              >
                See all results →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
