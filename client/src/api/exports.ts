import client from "./client";

interface ExportRequest {
  flashcard_ids: number[];
  summary_ids: number[];
}

interface ExportResponse {
  exported_flashcards: number;
  exported_summaries: number;
  message: string;
}

export async function exportToNotion(data: ExportRequest): Promise<ExportResponse> {
  const response = await client.post<ExportResponse>("/export/notion", data);
  return response.data;
}

export async function exportToRemnote(data: ExportRequest): Promise<ExportResponse> {
  const response = await client.post<ExportResponse>("/export/remnote", data);
  return response.data;
}

export async function exportToAnki(flashcardIds: number[]): Promise<Blob> {
  const response = await client.post<Blob>(
    "/export/anki",
    { flashcard_ids: flashcardIds, summary_ids: [] },
    { responseType: "blob" },
  );
  return response.data;
}

export async function exportToMarkdown(
  flashcardIds: number[],
  summaryIds: number[],
): Promise<Blob> {
  const response = await client.post<Blob>(
    "/export/markdown",
    { flashcard_ids: flashcardIds, summary_ids: summaryIds },
    { responseType: "blob" },
  );
  return response.data;
}
