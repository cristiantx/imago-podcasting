import { requireEnvValue } from "@/lib/config";

type GatewayEmbeddingResponse = {
  data?: Array<{
    embedding: number[];
  }>;
  error?: {
    message?: string;
  };
};

const AI_GATEWAY_BASE_URL = "https://ai-gateway.vercel.sh/v1";
const AI_GATEWAY_EMBEDDING_MODEL = "openai/text-embedding-3-small";

export async function embedTextBatch(input: string[]) {
  if (input.length === 0) {
    return [];
  }

  const response = await fetch(`${AI_GATEWAY_BASE_URL}/embeddings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${requireEnvValue("AI_GATEWAY_API_KEY")}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: AI_GATEWAY_EMBEDDING_MODEL,
      input
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`AI Gateway embeddings failed: ${response.status} ${body}`);
  }

  const payload = (await response.json()) as GatewayEmbeddingResponse;

  if (!payload.data || payload.data.length !== input.length) {
    throw new Error(payload.error?.message ?? "AI Gateway returned an invalid embedding payload");
  }

  return payload.data.map((entry) => entry.embedding);
}
