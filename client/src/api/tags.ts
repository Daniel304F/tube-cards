import client from "./client";

export interface TagData {
  id: number;
  name: string;
  color: string;
  created_at: string;
}

export interface TagCreateInput {
  name: string;
  color?: string;
}

export interface TagUpdateInput {
  name?: string;
  color?: string;
}

export async function fetchTags(): Promise<TagData[]> {
  const response = await client.get<TagData[]>("/tags/");
  return response.data;
}

export async function createTag(data: TagCreateInput): Promise<TagData> {
  const payload: TagCreateInput = { name: data.name };
  if (data.color !== undefined) payload.color = data.color;
  const response = await client.post<TagData>("/tags/", payload);
  return response.data;
}

export async function updateTag(id: number, data: TagUpdateInput): Promise<TagData> {
  const response = await client.patch<TagData>(`/tags/${id}`, data);
  return response.data;
}

export async function deleteTag(id: number): Promise<void> {
  await client.delete(`/tags/${id}`);
}

export async function attachTag(flashcardId: number, tagId: number): Promise<void> {
  await client.post(`/flashcards/${flashcardId}/tags/${tagId}`);
}

export async function detachTag(flashcardId: number, tagId: number): Promise<void> {
  await client.delete(`/flashcards/${flashcardId}/tags/${tagId}`);
}
