import { useState, useCallback } from "react";
import axios from "axios";
import { processBatch, type BatchResult } from "../api/videos";

interface UseBatchProcessorReturn {
  result: BatchResult | null;
  isProcessing: boolean;
  error: string | null;
  process: (youtubeUrls: string[]) => Promise<void>;
  reset: () => void;
}

export function useBatchProcessor(): UseBatchProcessorReturn {
  const [result, setResult] = useState<BatchResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const process = useCallback(async (youtubeUrls: string[]): Promise<void> => {
    if (youtubeUrls.length === 0) return;
    setIsProcessing(true);
    setError(null);
    setResult(null);
    try {
      const data = await processBatch(youtubeUrls);
      setResult(data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        setError(typeof detail === "string" ? detail : "Batch processing failed.");
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const reset = useCallback((): void => {
    setResult(null);
    setError(null);
    setIsProcessing(false);
  }, []);

  return { result, isProcessing, error, process, reset };
}
