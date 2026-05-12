import { generateAuthHeaders, getGatewayUrl } from "./gateway";

const EMBEDDING_PATH = "/v1/extra/embeddings";
const EMBEDDING_MODEL = "text-embedding-3-small";

/**
 * 获取单段文本的 embedding 向量
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const headers = generateAuthHeaders("POST", EMBEDDING_PATH);

  const response = await fetch(getGatewayUrl(EMBEDDING_PATH), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Embedding API 错误: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

/**
 * 批量获取多段文本的 embedding 向量
 */
export async function getEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const headers = generateAuthHeaders("POST", EMBEDDING_PATH);

  const response = await fetch(getGatewayUrl(EMBEDDING_PATH), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: texts,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Embedding API 错误: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.data.map((item: { embedding: number[] }) => item.embedding);
}
