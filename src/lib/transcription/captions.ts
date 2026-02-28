import type { Utterance } from "@/lib/chunking/transcript-chunker";

export function buildWebVttFromUtterances(utterances: Utterance[]) {
  const lines: string[] = ["WEBVTT", ""];

  for (const utterance of utterances) {
    const start = formatWebVttTimestamp(utterance.startMs);
    const end = formatWebVttTimestamp(utterance.endMs);
    const text = utterance.speaker ? `${utterance.speaker}: ${utterance.text}` : utterance.text;

    lines.push(`${start} --> ${end}`);
    lines.push(normalizeCueText(text));
    lines.push("");
  }

  return lines.join("\n");
}

function formatWebVttTimestamp(milliseconds: number) {
  const clampedMs = Math.max(0, milliseconds);
  const hours = Math.floor(clampedMs / 3_600_000);
  const minutes = Math.floor((clampedMs % 3_600_000) / 60_000);
  const seconds = Math.floor((clampedMs % 60_000) / 1_000);
  const millis = clampedMs % 1_000;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}

function normalizeCueText(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");
}
