import { del, put } from "@vercel/blob";

import { requireEnvValue } from "@/lib/config";

export async function downloadAndStoreAudio(input: { podcastId: string; episodeId: string; sourceUrl: string }) {
  const response = await fetch(input.sourceUrl);

  if (!response.ok) {
    throw new Error(`Failed to download audio (${response.status})`);
  }

  const contentType = response.headers.get("content-type") ?? "audio/mpeg";
  const extension = contentType.includes("mpeg") ? "mp3" : "audio";
  const key = `podcasts/${input.podcastId}/episodes/${input.episodeId}.${extension}`;

  const audioBlob = await response.blob();
  const stored = await put(key, audioBlob, {
    access: "public",
    addRandomSuffix: true,
    token: requireEnvValue("BLOB_READ_WRITE_TOKEN"),
    contentType
  });

  return stored;
}

export async function deleteAudioFromBlob(url: string) {
  await del(url, { token: requireEnvValue("BLOB_READ_WRITE_TOKEN") });
}
