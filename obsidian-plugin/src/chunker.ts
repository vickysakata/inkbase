/**
 * 文本分块工具
 * 策略：优先按 ## 标题分块，无标题则按段落组合
 * 每个 chunk 自动附上文档标题，保证脱离上下文也能理解
 */

const MAX_CHUNK_SIZE = 500;
const MIN_CHUNK_SIZE = 100;
const MAX_SECTION_SIZE = 800;

export function splitIntoChunks(text: string, title?: string): string[] {
  const docTitle = title || extractTitle(text);
  const hasSections = /^#{2,3}\s+.+/m.test(text);

  let rawChunks: string[];

  if (hasSections) {
    rawChunks = splitBySections(text);
  } else {
    rawChunks = splitByParagraphs(text);
  }

  return rawChunks.map((chunk) => `[来源：${docTitle}]\n\n${chunk}`);
}

function splitBySections(text: string): string[] {
  const sections = text.split(/(?=^#{2,3}\s+.+$)/m);
  const chunks: string[] = [];

  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed) continue;

    if (!trimmed.match(/^#{2,3}\s+/) && trimmed.length < MIN_CHUNK_SIZE) {
      continue;
    }

    if (trimmed.length <= MAX_SECTION_SIZE) {
      chunks.push(trimmed);
    } else {
      const subChunks = splitByParagraphs(trimmed);
      chunks.push(...subChunks);
    }
  }

  return mergeSmallChunks(chunks);
}

function splitByParagraphs(text: string): string[] {
  const paragraphs = text.split(/\n{2,}/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) continue;

    if (currentChunk.length + trimmed.length + 2 <= MAX_CHUNK_SIZE) {
      currentChunk += (currentChunk ? "\n\n" : "") + trimmed;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }

      if (trimmed.length > MAX_CHUNK_SIZE) {
        const sentenceChunks = splitBySentences(trimmed);
        chunks.push(...sentenceChunks);
        currentChunk = "";
      } else {
        currentChunk = trimmed;
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return mergeSmallChunks(chunks);
}

function splitBySentences(text: string): string[] {
  const sentences = text.split(/(?<=[。！？.!?\n])/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length <= MAX_CHUNK_SIZE) {
      currentChunk += sentence;
    } else {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = sentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

function mergeSmallChunks(chunks: string[]): string[] {
  if (chunks.length <= 1) return chunks;

  const merged: string[] = [];

  for (const chunk of chunks) {
    if (
      merged.length > 0 &&
      chunk.length < MIN_CHUNK_SIZE &&
      merged[merged.length - 1].length + chunk.length + 2 <= MAX_SECTION_SIZE
    ) {
      merged[merged.length - 1] += "\n\n" + chunk;
    } else {
      merged.push(chunk);
    }
  }

  return merged;
}

function extractTitle(text: string): string {
  const match = text.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : "未命名文档";
}
