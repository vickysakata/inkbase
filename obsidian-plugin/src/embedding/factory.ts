import type { InkbaseSettings, EmbeddingProvider } from "../types";
import { PieGatewayProvider } from "./pie-gateway";
import { OpenAIProvider } from "./openai";
import { OllamaProvider } from "./ollama";
import { DoubaoProvider } from "./doubao";

export function createEmbeddingProvider(
  settings: InkbaseSettings
): EmbeddingProvider {
  switch (settings.provider) {
    case "doubao":
      return new DoubaoProvider(
        settings.doubaoApiKey,
        settings.doubaoModel
      );
    case "openai":
      return new OpenAIProvider(
        settings.openaiApiKey,
        settings.openaiBaseUrl,
        settings.openaiModel
      );
    case "pie-gateway":
      return new PieGatewayProvider(
        settings.pieAppId,
        settings.pieAppSecret,
        settings.pieGatewayPath
      );
    case "ollama":
      return new OllamaProvider(settings.ollamaEndpoint, settings.ollamaModel);
    case "custom":
      return new OpenAIProvider(
        settings.customApiKey,
        settings.customEndpoint,
        settings.customModel
      );
    default:
      // 默认使用豆包
      return new DoubaoProvider(
        settings.doubaoApiKey,
        settings.doubaoModel
      );
  }
}
