import { Pinecone } from "@pinecone-database/pinecone";

import { getEnv, requireEnvValue } from "@/lib/config";

const globalForPinecone = globalThis as unknown as { pinecone?: Pinecone };

function getClient() {
  if (globalForPinecone.pinecone) {
    return globalForPinecone.pinecone;
  }

  const client = new Pinecone({ apiKey: requireEnvValue("PINECONE_API_KEY") });
  globalForPinecone.pinecone = client;
  return client;
}

export function getNamespace(clerkUserId: string) {
  const client = getClient();
  return client.index(getEnv().PINECONE_INDEX_NAME).namespace(`user_${clerkUserId}`);
}
