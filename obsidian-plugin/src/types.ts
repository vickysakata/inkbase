export interface InkbaseSettings {
  provider: "pie-gateway" | "openai" | "ollama" | "custom";

  // Pie Gateway
  pieAppId: string;
  pieAppSecret: string;
  pieGatewayPath: string;

  // OpenAI compatible
  openaiApiKey: string;
  openaiBaseUrl: string;
  openaiModel: string;

  // Ollama
  ollamaEndpoint: string;
  ollamaModel: string;

  // Custom
  customEndpoint: string;
  customApiKey: string;
  customModel: string;

  // General
  ideasFolder: string;
  excludeFolders: string[];
  autoIndex: boolean;

  // Libraries (for filtering search results)
  libraries: Library[];
}

export interface Library {
  name: string;   // 显示名称，如 "素材库"、"点子库"
  folder: string; // 对应的文件夹路径，如 "素材"、"ideas"
}

export interface EmbeddingProvider {
  getEmbedding(text: string): Promise<number[]>;
  getEmbeddings(texts: string[]): Promise<number[][]>;
}

export interface StoredDocument {
  title: string;
  chunks: StoredChunk[];
  lastModified: number;
}

export interface StoredChunk {
  text: string;
  embedding: number[];
}

export interface SearchResult {
  filePath: string;
  title: string;
  chunk: string;
  score: number;
}
