import type { InkbaseSettings, EmbeddingProvider } from "../types";
import { PieGatewayProvider } from "./pie-gateway";
import { OpenAIProvider } from "./openai";
import { OllamaProvider } from "./ollama";

export function createEmbeddingProvider(
  settings: InkbaseSettings
): EmbeddingProvider {
  switch (settings.provider) {
    case "deepseek":
      return new OpenAIProvider(
        settings.deepseekApiKey,
        "https://api.deepseek.com",
        "embedding-3"
      );
    case "doubao":
      return new OpenAIProvider(
        settings.doubaoApiKey,
        "https://ark.cn-beijing.volces.com/api/v3",
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
      return new OpenAIProvider(
        settings.deepseekApiKey,
        "https://api.deepseek.com",
        "embedding-3"
      );
  }
}
