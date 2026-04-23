import client from "./client";

export type ReviewQuality = "again" | "hard" | "good" | "easy";

export interface StudyCardData {
  id: number;
  question: string;
  answer: string;
  video_id: number;
  video_title: string;
  folder_id: number | null;
  ease_factor: number;
  interval: number;
  repetitions: number;
  due_date: string;
  last_reviewed: string | null;
}

export interface ReviewResult {
  id: number;
  ease_factor: number;
  interval: number;
  repetitions: number;
  due_date: string;
  last_reviewed: string;
}

export interface StudyStatsData {
  total_cards: number;
  due_now: number;
  learned_today: number;
  new_cards: number;
  learning_cards: number;
  mature_cards: number;
}

export async function fetchDueCards(params?: {
  folder_id?: number;
  limit?: number;
}): Promise<StudyCardData[]> {
  const response = await client.get<StudyCardData[]>("/study/due", { params });
  return response.data;
}

export async function reviewCard(
  flashcardId: number,
  quality: ReviewQuality,
): Promise<ReviewResult> {
  const response = await client.post<ReviewResult>(`/study/review/${flashcardId}`, {
    quality,
  });
  return response.data;
}

export async function fetchStudyStats(): Promise<StudyStatsData> {
  const response = await client.get<StudyStatsData>("/study/stats");
  return response.data;
}
