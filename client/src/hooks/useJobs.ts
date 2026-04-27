import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchJobs,
  createJobs as apiCreateJobs,
  deleteJob as apiDeleteJob,
  clearFinishedJobs,
  type JobData,
} from "../api/jobs";

const POLL_INTERVAL_MS = 3000;

interface UseJobsReturn {
  jobs: JobData[];
  isLoading: boolean;
  error: string | null;
  enqueue: (urls: string[]) => Promise<void>;
  remove: (id: number) => Promise<void>;
  clearFinished: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useJobs(): UseJobsReturn {
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const isFirstLoad = useRef<boolean>(true);

  const load = useCallback(async (): Promise<void> => {
    if (isFirstLoad.current) setIsLoading(true);
    setError(null);
    try {
      const data = await fetchJobs();
      setJobs(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load jobs";
      setError(message);
    } finally {
      setIsLoading(false);
      isFirstLoad.current = false;
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = setInterval(() => void load(), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  const enqueue = useCallback(async (urls: string[]): Promise<void> => {
    if (urls.length === 0) return;
    await apiCreateJobs(urls);
    await load();
  }, [load]);

  const remove = useCallback(async (id: number): Promise<void> => {
    await apiDeleteJob(id);
    await load();
  }, [load]);

  const clearFinished = useCallback(async (): Promise<void> => {
    await clearFinishedJobs();
    await load();
  }, [load]);

  return { jobs, isLoading, error, enqueue, remove, clearFinished, refetch: load };
}
