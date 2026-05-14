import { requestUrl } from "obsidian";
import type { EmbeddingProvider } from "../types";

/**
 * 豆包（火山方舟）多模态 Embedding Provider
 * 使用 /embeddings/multimodal 接口
 */
export class DoubaoProvider implements EmbeddingProvider {
  constructor(
    private apiKey: string,
    private model: string
  ) {}

  async getEmbedding(text: string): Promise<number[]> {
    const url = "https://ark.cn-beijing.volces.com/api/v3/embeddings/multimodal";

    const response = await requestUrl({
      url,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        input: [{ type: "text", text }],
      }),
    });

    if (response.status !== 200) {
      throw new Error(
        `Doubao embedding error: ${response.status} - ${response.text}`
      );
    }

    return response.json.data.embedding;
  }

  async getEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    const results: number[][] = [];
    // 多模态接口每次只能处理一条，逐条请求
    for (const text of texts) {
      const embedding = await this.getEmbedding(text);
      results.push(embedding);
    }
    return results;
  }
}
