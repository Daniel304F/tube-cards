import { useState, useEffect, useCallback } from "react";
import {
  fetchConfig,
  updateConfig,
  type ConfigData,
  type ConfigUpdateData,
} from "../api/config";

interface UseConfigReturn {
  config: ConfigData | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  saveSuccess: boolean;
  save: (data: ConfigUpdateData) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useConfig(): UseConfigReturn {
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const load = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchConfig();
      setConfig(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load config";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const save = useCallback(async (data: ConfigUpdateData): Promise<void> => {
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);
    try {
      const updated = await updateConfig(data);
      setConfig(updated);
      setSaveSuccess(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to save config";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { config, isLoading, isSaving, error, saveSuccess, save, refetch: load };
}
