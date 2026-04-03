import { useState, useEffect, useCallback } from "react";
import { fetchFolders, createFolder, deleteFolder, type FolderData } from "../api/folders";

interface UseFoldersReturn {
  folders: FolderData[];
  isLoading: boolean;
  error: string | null;
  create: (name: string) => Promise<void>;
  remove: (id: number) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useFolders(): UseFoldersReturn {
  const [folders, setFolders] = useState<FolderData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchFolders();
      setFolders(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load folders";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const create = useCallback(async (name: string): Promise<void> => {
    try {
      await createFolder(name);
      await load();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create folder";
      setError(message);
    }
  }, [load]);

  const remove = useCallback(async (id: number): Promise<void> => {
    try {
      await deleteFolder(id);
      await load();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete folder";
      setError(message);
    }
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  return { folders, isLoading, error, create, remove, refetch: load };
}
