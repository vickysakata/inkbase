import { requestUrl } from "obsidian";
import type { EmbeddingProvider } from "../types";

export class OllamaProvider implements EmbeddingProvider {
  constructor(
    private endpoint: string,
    private model: string
  ) {}

  async getEmbedding(text: string): Promise<number[]> {
    const url = `${this.endpoint}/api/embeddings`;

    const response = await requestUrl({
      url,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        prompt: text,
      }),
    });

    if (response.status !== 200) {
      throw new Error(
        `Ollama embedding error: ${response.status} - ${response.text}`
      );
    }

    return response.json.embedding;
  }

  async getEmbeddings(texts: string[]): Promise<number[][]> {
    // Ollama doesn't support batch embedding, call one by one
    const results: number[][] = [];
    for (const text of texts) {
      const embedding = await this.getEmbedding(text);
      results.push(embedding);
    }
    return results;
  }
}
