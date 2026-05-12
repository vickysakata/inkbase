/**
 * 文本分块工具
 * 策略：优先按 ## 标题分块，无标题则按段落组合
 * 每个 chunk 自动附上文档标题，保证脱离上下文也能理解
 */

const MAX_CHUNK_SIZE = 500; // 每块最大字符数
const MIN_CHUNK_SIZE = 100; // 太短的块合并到上一块
const MAX_SECTION_SIZE = 800; // section 超过此长度则二次拆分

/**
 * 将 Markdown 文本智能分块
 * @param text - 完整文档内容
 * @param title - 文档标题（可选，会附加到每个 chunk 开头）
 */
export function splitIntoChunks(text: string, title?: string): string[] {
  const docTitle = title || extractTitle(text);

  // 检测是否有 ## 标题结构
  const hasSections = /^#{2,3}\s+.+/m.test(text);

  let rawChunks: string[];

  if (hasSections) {
    rawChunks = splitBySections(text);
  } else {
    rawChunks = splitByParagraphs(text);
  }

  // 为每个 chunk 添加文档标题上下文
  const withContext = rawChunks.map((chunk) => {
    // 如果 chunk 已经以文档标题开头，不重复添加
    if (chunk.startsWith(`# ${docTitle}`) || chunk.startsWith(`## `)) {
      return `[来源：${docTitle}]\n\n${chunk}`;
    }
    return `[来源：${docTitle}]\n\n${chunk}`;
  });

  return withContext;
}

/**
 * 按 ## 标题分块
 * 每个 section（标题 + 其下内容）作为一个 chunk
 */
function splitBySections(text: string): string[] {
  // 按 ##（二级/三级标题）分割
  const sections = text.split(/(?=^#{2,3}\s+.+$)/m);
  const chunks: string[] = [];

  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed) continue;

    // 如果是文档顶部的 # 标题 + 开头段落（在第一个 ## 之前的内容）
    if (!trimmed.match(/^#{2,3}\s+/) && trimmed.length < MIN_CHUNK_SIZE) {
      // 太短的顶部内容，合并到下一个 section
      continue;
    }

    if (trimmed.length <= MAX_SECTION_SIZE) {
      chunks.push(trimmed);
    } else {
      // section 过长，按段落二次拆分
      const subChunks = splitByParagraphs(trimmed);
      chunks.push(...subChunks);
    }
  }

  // 合并过短的块
  return mergeSmallChunks(chunks);
}

/**
 * 按段落组合分块（无标题结构时使用）
 * 相邻段落凑到合理长度后切一块
 */
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

      // 单段落超长，按句子拆分
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

/**
 * 按句子拆分超长段落
 */
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

/**
 * 合并过短的块到前一块
 */
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

/**
 * 从 Markdown 内容中提取文档标题（# 一级标题）
 */
function extractTitle(text: string): string {
  const match = text.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : "未命名文档";
}
