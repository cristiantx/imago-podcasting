import OpenAI from "openai";

import { requireEnvValue } from "@/lib/config";

const globalForOpenAi = globalThis as unknown as { openai?: OpenAI };

function getOpenAiClient() {
  if (globalForOpenAi.openai) {
    return globalForOpenAi.openai;
  }

  const client = new OpenAI({ apiKey: requireEnvValue("OPENAI_API_KEY") });
  globalForOpenAi.openai = client;
  return client;
}

export async function embedTextBatch(input: string[]) {
  const openai = getOpenAiClient();
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input
  });

  return response.data.map((entry) => entry.embedding);
}
