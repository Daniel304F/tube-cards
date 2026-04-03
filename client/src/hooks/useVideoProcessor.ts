import { useState, useCallback } from "react";
import { processVideo, type VideoProcessResult } from "../api/videos";
import axios from "axios";

interface UseVideoProcessorReturn {
  result: VideoProcessResult | null;
  isProcessing: boolean;
  error: string | null;
  process: (youtubeUrl: string) => Promise<void>;
  reset: () => void;
}

export function useVideoProcessor(): UseVideoProcessorReturn {
  const [result, setResult] = useState<VideoProcessResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const process = useCallback(async (youtubeUrl: string): Promise<void> => {
    setIsProcessing(true);
    setError(null);
    setResult(null);
    try {
      const data = await processVideo(youtubeUrl);
      setResult(data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        setError(typeof detail === "string" ? detail : "Processing failed. Please try again.");
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
