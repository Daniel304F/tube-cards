import client from "./client";

export interface ConfigData {
  youtube_api_key: string;
  llm_provider: string;
  llm_model: string;
  llm_api_key: string;
  ollama_base_url: string;
  notion_api_key: string;
  remnote_api_key: string;
}

export type ConfigUpdateData = Partial<ConfigData>;

export async function fetchConfig(): Promise<ConfigData> {
  const response = await client.get<ConfigData>("/config/");
  return response.data;
}

export async function updateConfig(data: ConfigUpdateData): Promise<ConfigData> {
  const response = await client.put<ConfigData>("/config/", data);
  return response.data;
}
