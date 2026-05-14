import { createHmac, randomBytes } from "crypto";
import { requestUrl } from "obsidian";
import type { EmbeddingProvider } from "../types";

const EMBEDDING_PATH = "/v1/extra/embeddings";

export class PieGatewayProvider implements EmbeddingProvider {
  constructor(
    private appId: string,
    private appSecret: string,
    private gatewayPath: string
  ) {}

  async getEmbedding(text: string): Promise<number[]> {
    const result = await this.callApi([text]);
    return result[0];
  }

  async getEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    // Batch in groups of 50 to avoid payload limits
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
    const headers = this.generateAuthHeaders();
    const url = `${this.gatewayPath}${EMBEDDING_PATH}`;

    const response = await requestUrl({
      url,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input,
      }),
    });

    if (response.status !== 200) {
      throw new Error(
        `Pie Gateway embedding error: ${response.status} - ${response.text}`
      );
    }

    const data = response.json;
    return data.data.map((item: { embedding: number[] }) => item.embedding);
  }

  private generateAuthHeaders(): Record<string, string> {
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = randomBytes(16).toString("hex");
    const signatureString = `POST\n${EMBEDDING_PATH}\n${timestamp}\n${nonce}\n${this.appId}`;
    const signature = createHmac("sha256", this.appSecret)
      .update(signatureString)
      .digest("hex");

    return {
      "X-App-Id": this.appId,
      "X-Timestamp": timestamp.toString(),
      "X-Nonce": nonce,
      Authorization: `HMAC-SHA256 ${signature}`,
    };
  }
}
