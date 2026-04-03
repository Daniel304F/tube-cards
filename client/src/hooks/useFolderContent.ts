import { useState, useEffect, useCallback } from "react";
import { fetchFolderById, type FolderData } from "../api/folders";
import { fetchFlashcards } from "../api/flashcards";
import { fetchSummaries } from "../api/summaries";
import type { FlashcardData, SummaryData } from "../api/videos";

interface UseFolderContentReturn {
  folder: FolderData | null;
  flashcards: FlashcardData[];
  summaries: SummaryData[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useFolderContent(folderId: number): UseFolderContentReturn {
  const [folder, setFolder] = useState<FolderData | null>(null);
  const [flashcards, setFlashcards] = useState<FlashcardData[]>([]);
  const [summaries, setSummaries] = useState<SummaryData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const [folderData, fcs, sums] = await Promise.all([
        fetchFolderById(folderId),
        fetchFlashcards({ folder_id: folderId }),
        fetchSummaries({ folder_id: folderId }),
      ]);
      setFolder(folderData);
      setFlashcards(fcs);
      setSummaries(sums);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load folder";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [folderId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { folder, flashcards, summaries, isLoading, error, refetch: load };
}
