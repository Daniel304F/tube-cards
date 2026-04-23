import { useEffect, useState } from "react";
import axios from "axios";
import { searchAll, type SearchResultsData } from "../api/search";
import { useDebounce } from "./useDebounce";

const MIN_QUERY_LENGTH: number = 2;
const DEBOUNCE_MS: number = 250;

interface UseSearchResult {
  query: string;
  setQuery: (q: string) => void;
  results: SearchResultsData | null;
  isLoading: boolean;
  error: string | null;
}

export function useSearch(initialQuery: string = "", limit: number = 25): UseSearchResult {
  const [query, setQuery] = useState<string>(initialQuery);
  const [results, setResults] = useState<SearchResultsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const debounced = useDebounce(query, DEBOUNCE_MS);

  useEffect(() => {
    const trimmed = debounced.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    searchAll(trimmed, limit)
      .then((data) => {
        if (!cancelled) setResults(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (axios.isAxiosError(err)) {
          const detail = err.response?.data?.detail as string | undefined;
          setError(detail ?? "Search failed.");
        } else {
          setError("Search failed.");
        }
        setResults(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debounced, limit]);

  return { query, setQuery, results, isLoading, error };
}
