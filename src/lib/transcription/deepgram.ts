import { requireEnvValue } from "@/lib/config";
import type { Utterance } from "@/lib/chunking/transcript-chunker";

type DeepgramResponse = {
  results?: {
    utterances?: Array<{
      start: number;
      end: number;
      transcript: string;
      speaker?: number;
    }>;
  };
};

export async function transcribeFromUrl(audioUrl: string): Promise<Utterance[]> {
  const endpoint =
    "https://api.deepgram.com/v1/listen?model=nova-2&diarize=true&utterances=true&punctuate=true&smart_format=true&language=en";

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Token ${requireEnvValue("DEEPGRAM_API_KEY")}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ url: audioUrl })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Deepgram failed: ${response.status} ${body}`);
  }

  const payload = (await response.json()) as DeepgramResponse;
  const utterances = payload.results?.utterances ?? [];

  return utterances.map((item) => ({
    speaker: typeof item.speaker === "number" ? `Speaker ${item.speaker}` : null,
    startMs: Math.round(item.start * 1000),
    endMs: Math.round(item.end * 1000),
    text: item.transcript
  }));
}
