import client from "./client";

export interface FolderData {
  id: number;
  name: string;
  parent_id: number | null;
  created_at: string;
}

export async function fetchFolders(): Promise<FolderData[]> {
  const response = await client.get<FolderData[]>("/folders/");
  return response.data;
}

export async function fetchFolderById(id: number): Promise<FolderData> {
  const response = await client.get<FolderData>(`/folders/${id}`);
  return response.data;
}

export async function createFolder(name: string, parentId?: number): Promise<FolderData> {
  const response = await client.post<FolderData>("/folders/", {
    name,
    parent_id: parentId ?? null,
  });
  return response.data;
}

export async function updateFolder(
  id: number,
  data: { name?: string; parent_id?: number | null },
): Promise<FolderData> {
  const response = await client.patch<FolderData>(`/folders/${id}`, data);
  return response.data;
}

export async function deleteFolder(id: number): Promise<void> {
  await client.delete(`/folders/${id}`);
}
