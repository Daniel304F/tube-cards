import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  fetchDueCards,
  fetchStudyStats,
  reviewCard,
  type ReviewQuality,
  type StudyCardData,
  type StudyStatsData,
} from "../api/study";

interface UseStudyResult {
  cards: StudyCardData[];
  stats: StudyStatsData | null;
  isLoading: boolean;
  error: string | null;
  currentIndex: number;
  reviewed: number;
  submitReview: (quality: ReviewQuality) => Promise<void>;
  restart: () => Promise<void>;
}

export function useStudy(folderId?: number): UseStudyResult {
  const [cards, setCards] = useState<StudyCardData[]>([]);
  const [stats, setStats] = useState<StudyStatsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [reviewed, setReviewed] = useState<number>(0);

  const load = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const [due, statsData] = await Promise.all([
        fetchDueCards({ folder_id: folderId }),
        fetchStudyStats(),
      ]);
      setCards(due);
      setStats(statsData);
      setCurrentIndex(0);
      setReviewed(0);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail as string | undefined;
        setError(detail ?? "Failed to load study session.");
      } else {
        setError("Failed to load study session.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [folderId]);

  useEffect(() => {
    void load();
  }, [load]);

  const submitReview = useCallback(
    async (quality: ReviewQuality): Promise<void> => {
      const card = cards[currentIndex];
      if (!card) return;
      try {
        await reviewCard(card.id, quality);
        setCurrentIndex((i) => i + 1);
        setReviewed((r) => r + 1);
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          const detail = err.response?.data?.detail as string | undefined;
          setError(detail ?? "Failed to save review.");
        } else {
          setError("Failed to save review.");
        }
      }
    },
    [cards, currentIndex],
  );

  return {
    cards,
    stats,
    isLoading,
    error,
    currentIndex,
    reviewed,
    submitReview,
    restart: load,
  };
}
