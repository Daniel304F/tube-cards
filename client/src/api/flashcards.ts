import client from "./client";
import type { FlashcardData } from "./videos";

export async function fetchFlashcards(params?: {
  video_id?: number;
  folder_id?: number;
}): Promise<FlashcardData[]> {
  const response = await client.get<FlashcardData[]>("/flashcards/", { params });
  return response.data;
}

export async function deleteFlashcard(id: number): Promise<void> {
  await client.delete(`/flashcards/${id}`);
}

export async function updateFlashcard(
  id: number,
  data: { question?: string; answer?: string; folder_id?: number | null },
): Promise<FlashcardData> {
  const response = await client.patch<FlashcardData>(`/flashcards/${id}`, data);
  return response.data;
}
