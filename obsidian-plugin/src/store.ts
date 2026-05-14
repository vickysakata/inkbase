import type InkbasePlugin from "./main";
import type { StoredDocument, SearchResult } from "./types";

const STORE_FILE = "inkbase-index.json";

interface StoreData {
  version: number;
  documents: Record<string, StoredDocument>;
}

export class VectorStore {
  private data: StoreData = { version: 1, documents: {} };
  private plugin: InkbasePlugin;

  constructor(plugin: InkbasePlugin) {
    this.plugin = plugin;
  }

  async load(): Promise<void> {
    try {
      const adapter = this.plugin.app.vault.adapter;
      const path = this.getStorePath();
      if (await adapter.exists(path)) {
        const raw = await adapter.read(path);
        this.data = JSON.parse(raw);
      }
    } catch (err) {
      console.error("[Inkbase] Failed to load store:", err);
      this.data = { version: 1, documents: {} };
    }
  }

  async save(): Promise<void> {
    try {
      const adapter = this.plugin.app.vault.adapter;
      const path = this.getStorePath();
      const dir = path.substring(0, path.lastIndexOf("/"));
      if (!(await adapter.exists(dir))) {
        await adapter.mkdir(dir);
      }
      await adapter.write(path, JSON.stringify(this.data));
    } catch (err) {
      console.error("[Inkbase] Failed to save store:", err);
    }
  }

  private getStorePath(): string {
    return `${this.plugin.manifest.dir}/${STORE_FILE}`;
  }

  getDocument(filePath: string): StoredDocument | undefined {
    return this.data.documents[filePath];
  }

  setDocument(filePath: string, doc: StoredDocument): void {
    this.data.documents[filePath] = doc;
  }

  removeDocument(filePath: string): void {
    delete this.data.documents[filePath];
  }

  getDocumentCount(): number {
    return Object.keys(this.data.documents).length;
  }

  getChunkCount(): number {
    return Object.values(this.data.documents).reduce(
      (sum, doc) => sum + doc.chunks.length,
      0
    );
  }

  search(queryEmbedding: number[], limit: number, folderFilter?: string): SearchResult[] {
    const results: SearchResult[] = [];

    for (const [filePath, doc] of Object.entries(this.data.documents)) {
      // Filter by folder if specified
      if (folderFilter && !filePath.startsWith(folderFilter + "/") && filePath !== folderFilter) {
        continue;
      }

      for (const chunk of doc.chunks) {
        if (!chunk.embedding || chunk.embedding.length === 0) continue;
        const score = cosineSimilarity(queryEmbedding, chunk.embedding);
        results.push({
          filePath,
          title: doc.title,
          chunk: chunk.text,
          score,
        });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}
