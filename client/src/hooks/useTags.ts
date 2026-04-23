import { useCallback, useEffect, useState } from "react";

import {
  createTag,
  deleteTag,
  fetchTags,
  updateTag,
  type TagCreateInput,
  type TagData,
} from "../api/tags";

interface UseTagsReturn {
  tags: TagData[];
  isLoading: boolean;
  error: string | null;
  create: (data: TagCreateInput) => Promise<TagData>;
  rename: (id: number, name: string) => Promise<TagData>;
  remove: (id: number) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useTags(): UseTagsReturn {
  const [tags, setTags] = useState<TagData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchTags();
      setTags(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load tags";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const create = useCallback(
    async (data: TagCreateInput): Promise<TagData> => {
      const tag = await createTag(data);
      await load();
      return tag;
    },
    [load],
  );

  const rename = useCallback(
    async (id: number, name: string): Promise<TagData> => {
      const tag = await updateTag(id, { name });
      await load();
      return tag;
    },
    [load],
  );

  const remove = useCallback(
    async (id: number): Promise<void> => {
      await deleteTag(id);
      await load();
    },
    [load],
  );

  useEffect(() => {
    void load();
  }, [load]);

  return { tags, isLoading, error, create, rename, remove, refetch: load };
}
