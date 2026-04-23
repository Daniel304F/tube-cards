import client from "./client";

export type SearchHitType = "flashcard" | "summary" | "video";

export interface SearchHit {
  type: SearchHitType;
  id: number;
  title: string;
  snippet: string;
  video_id: number;
  video_title: string;
  folder_id: number | null;
  created_at: string;
}

export interface SearchResultsData {
  query: string;
  total: number;
  hits: SearchHit[];
}

export async function searchAll(
  query: string,
  limit: number = 25,
): Promise<SearchResultsData> {
  const response = await client.get<SearchResultsData>("/search/", {
    params: { q: query, limit },
  });
  return response.data;
}
