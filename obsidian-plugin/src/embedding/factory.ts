import type { InkbaseSettings, EmbeddingProvider } from "../types";
import { PieGatewayProvider } from "./pie-gateway";
import { OpenAIProvider } from "./openai";
import { OllamaProvider } from "./ollama";

export function createEmbeddingProvider(
  settings: InkbaseSettings
): EmbeddingProvider {
  switch (settings.provider) {
    case "pie-gateway":
      return new PieGatewayProvider(
        settings.pieAppId,
        settings.pieAppSecret,
        settings.pieGatewayPath
      );
    case "openai":
      return new OpenAIProvider(
        settings.openaiApiKey,
        settings.openaiBaseUrl,
        settings.openaiModel
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
      return new PieGatewayProvider(
        settings.pieAppId,
        settings.pieAppSecret,
        settings.pieGatewayPath
      );
  }
}
