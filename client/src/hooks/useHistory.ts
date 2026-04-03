import { useState, useEffect, useCallback } from "react";
import { fetchVideos, type VideoData } from "../api/videos";
import { fetchFlashcards } from "../api/flashcards";
import { fetchSummaries } from "../api/summaries";
import type { FlashcardData, SummaryData } from "../api/videos";

interface VideoWithContent extends VideoData {
  flashcards: FlashcardData[];
  summaries: SummaryData[];
}

interface UseHistoryReturn {
  videos: VideoWithContent[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useHistory(): UseHistoryReturn {
  const [videos, setVideos] = useState<VideoWithContent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const [allVideos, allFlashcards, allSummaries] = await Promise.all([
        fetchVideos(),
        fetchFlashcards(),
        fetchSummaries(),
      ]);

      const enriched: VideoWithContent[] = allVideos.map((video) => ({
        ...video,
        flashcards: allFlashcards.filter((fc) => fc.video_id === video.id),
        summaries: allSummaries.filter((s) => s.video_id === video.id),
      }));

      enriched.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

      setVideos(enriched);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load history";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { videos, isLoading, error, refetch: load };
}
