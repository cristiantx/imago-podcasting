import { del, put } from "@vercel/blob";

import { requireEnvValue } from "@/lib/config";

export async function storeEpisodeWebVtt(input: {
  podcastId: string;
  episodeId: string;
  content: string;
}) {
  const key = `podcasts/${input.podcastId}/episodes/${input.episodeId}.vtt`;

  return put(key, input.content, {
    access: "public",
    addRandomSuffix: true,
    token: requireEnvValue("BLOB_READ_WRITE_TOKEN"),
    contentType: "text/vtt; charset=utf-8"
  });
}

export async function deleteTranscriptFromBlob(url: string) {
  await del(url, { token: requireEnvValue("BLOB_READ_WRITE_TOKEN") });
}
