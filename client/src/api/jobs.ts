import client from "./client";

export type JobStatus = "pending" | "running" | "done" | "failed";

export interface JobData {
  id: number;
  youtube_url: string;
  status: JobStatus;
  error: string | null;
  video_id: number | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
}

export async function fetchJobs(status?: JobStatus): Promise<JobData[]> {
  const response = await client.get<JobData[]>("/jobs/", {
    params: status ? { status } : undefined,
  });
  return response.data;
}

export async function createJobs(youtubeUrls: string[]): Promise<JobData[]> {
  const response = await client.post<JobData[]>("/jobs/", { youtube_urls: youtubeUrls });
  return response.data;
}

export async function deleteJob(id: number): Promise<void> {
  await client.delete(`/jobs/${id}`);
}

export async function clearFinishedJobs(): Promise<number> {
  const response = await client.delete<{ deleted: number }>("/jobs/finished");
  return response.data.deleted;
}
