import client from "./client";
import type { TagData } from "./tags";

export interface VideoData {
  id: number;
  youtube_url: string;
  title: string;
  transcript: string;
  processed_at: string | null;
  created_at: string;
}

export interface FlashcardData {
  id: number;
  question: string;
  answer: string;
  video_id: number;
  folder_id: number | null;
  created_at: string;
  updated_at: string;
  tags: TagData[];
}

export interface SummaryData {
  id: number;
  content: string;
  video_id: number;
  folder_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface VideoProcessResult {
  video: VideoData;
  flashcards: FlashcardData[];
  summary: SummaryData;
}

export async function processVideo(youtubeUrl: string): Promise<VideoProcessResult> {
  const response = await client.post<VideoProcessResult>("/videos/process", {
    youtube_url: youtubeUrl,
  });
  return response.data;
}

export interface BatchItemResult {
  youtube_url: string;
  success: boolean;
  result: VideoProcessResult | null;
  error: string | null;
}

export interface BatchResult {
  results: BatchItemResult[];
  success_count: number;
  error_count: number;
}

export async function processBatch(youtubeUrls: string[]): Promise<BatchResult> {
  const response = await client.post<BatchResult>("/videos/process-batch", {
    youtube_urls: youtubeUrls,
  });
  return response.data;
}

export async function fetchVideos(): Promise<VideoData[]> {
  const response = await client.get<VideoData[]>("/videos/");
  return response.data;
}

export async function fetchVideoById(id: number): Promise<VideoData> {
  const response = await client.get<VideoData>(`/videos/${id}`);
  return response.data;
}
