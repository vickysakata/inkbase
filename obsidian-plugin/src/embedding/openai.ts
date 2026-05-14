import { requestUrl } from "obsidian";
import type { EmbeddingProvider } from "../types";

export class OpenAIProvider implements EmbeddingProvider {
  constructor(
    private apiKey: string,
    private baseUrl: string,
    private model: string
  ) {}

  async getEmbedding(text: string): Promise<number[]> {
    const result = await this.callApi([text]);
    return result[0];
  }

  async getEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    const batchSize = 50;
    const results: number[][] = [];
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchResults = await this.callApi(batch);
      results.push(...batchResults);
    }
    return results;
  }

  private async callApi(input: string[]): Promise<number[][]> {
    // If baseUrl already ends with a versioned path (like /v3 or /v1), append /embeddings directly
    const url = this.baseUrl.match(/\/v\d+\/?$/)
      ? `${this.baseUrl.replace(/\/$/, "")}/embeddings`
      : `${this.baseUrl}/v1/embeddings`;

    const response = await requestUrl({
      url,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        input,
      }),
    });

    if (response.status !== 200) {
      throw new Error(
        `OpenAI embedding error: ${response.status} - ${response.text}`
      );
    }

    const data = response.json;
    return data.data.map((item: { embedding: number[] }) => item.embedding);
  }
}
