export type Utterance = {
  speaker: string | null;
  startMs: number;
  endMs: number;
  text: string;
};

export type TranscriptChunk = {
  speaker: string | null;
  startMs: number;
  endMs: number;
  text: string;
};

const TARGET_CHARS = 820;

export function chunkUtterances(utterances: Utterance[]): TranscriptChunk[] {
  const cleaned = utterances.filter((item) => item.text.trim().length > 0);
  if (cleaned.length === 0) {
    return [];
  }

  const chunks: TranscriptChunk[] = [];
  let cursor = 0;

  while (cursor < cleaned.length) {
    const start = cleaned[cursor];
    let endIndex = cursor;
    let text = start.text;

    while (endIndex + 1 < cleaned.length && text.length < TARGET_CHARS) {
      endIndex += 1;
      text = `${text} ${cleaned[endIndex].text}`;
    }

    const end = cleaned[endIndex];
    chunks.push({
      speaker: start.speaker,
      startMs: start.startMs,
      endMs: end.endMs,
      text: text.trim()
    });

    // One-utterance overlap preserves context for semantic recall.
    cursor = Math.max(endIndex, cursor + 1);
  }

  return chunks;
}
