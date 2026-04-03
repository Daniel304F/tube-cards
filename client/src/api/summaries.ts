import client from "./client";
import type { SummaryData } from "./videos";

export async function fetchSummaries(params?: {
  video_id?: number;
  folder_id?: number;
}): Promise<SummaryData[]> {
  const response = await client.get<SummaryData[]>("/summaries/", { params });
  return response.data;
}

export async function deleteSummary(id: number): Promise<void> {
  await client.delete(`/summaries/${id}`);
}

export async function updateSummary(
  id: number,
  data: { content?: string; folder_id?: number | null },
): Promise<SummaryData> {
  const response = await client.patch<SummaryData>(`/summaries/${id}`, data);
  return response.data;
}
