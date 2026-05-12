import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { splitIntoChunks } from "@/lib/chunker";
import { getEmbedding, getEmbeddings } from "@/lib/embedding";
import { cosineSimilarity } from "@/lib/similarity";
import { Prisma } from "@/generated/prisma/client";
import fs from "fs/promises";
import path from "path";

/**
 * POST /api/ideas - 保存点子/素材
 * 
 * 流程：
 * 1. 将内容保存为 .md 文件到指定来源路径
 * 2. 创建 Document + DocumentChunk 入库
 * 3. 为所有 chunk 生成 embedding 向量
 * 4. 用内容语义搜索 3 个关联点子返回
 */
export async function POST(request: Request) {
  const { title, content, sourceId } = await request.json();

  // 参数校验
  if (!title?.trim()) {
    return NextResponse.json({ error: "标题不能为空" }, { status: 400 });
  }
  if (!content?.trim()) {
    return NextResponse.json({ error: "内容不能为空" }, { status: 400 });
  }
  if (!sourceId) {
    return NextResponse.json({ error: "请选择保存来源" }, { status: 400 });
  }

  // 验证来源是否存在
  const source = await prisma.source.findUnique({ where: { id: sourceId } });
  if (!source) {
    return NextResponse.json({ error: "来源不存在" }, { status: 404 });
  }

  // 生成安全的文件名（去除特殊字符）
  const safeTitle = title.trim().replace(/[/\\:*?"<>|]/g, "_");
  const fileName = `${safeTitle}.md`;
  const filePath = path.join(source.path, fileName);

  // 检查文件是否已存在
  try {
    await fs.access(filePath);
    return NextResponse.json(
      { error: `文件已存在: ${fileName}，请换一个标题` },
      { status: 409 }
    );
  } catch {
    // 文件不存在，继续
  }

  // 确保目录存在
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  // 写入 Markdown 文件
  const markdownContent = `# ${title.trim()}\n\n${content.trim()}\n`;
  await fs.writeFile(filePath, markdownContent, "utf-8");

  // 获取文件信息
  const stat = await fs.stat(filePath);

  // 分块
  const chunks = splitIntoChunks(markdownContent);

  // 入库：创建 Document 和 DocumentChunk
  const document = await prisma.document.create({
    data: {
      title: safeTitle,
      filePath,
      content: markdownContent,
      fileModAt: stat.mtime,
      sourceId: source.id,
      chunks: {
        create: chunks.map((c, idx) => ({
          content: c,
          chunkIdx: idx,
        })),
      },
    },
    include: { chunks: true },
  });

  // 为所有 chunk 生成 embedding
  const chunkTexts = document.chunks.map((c) => c.content);
  const embeddings = await getEmbeddings(chunkTexts);

  for (let i = 0; i < document.chunks.length; i++) {
    await prisma.documentChunk.update({
      where: { id: document.chunks[i].id },
      data: { embedding: embeddings[i] },
    });
  }

  // 语义搜索关联点子：用完整内容摘要做搜索
  const searchText = `${title} ${content.slice(0, 300)}`;
  const queryEmbedding = await getEmbedding(searchText);

  // 获取所有已有 embedding 的 chunk（排除刚创建的文档）
  const allChunks = await prisma.documentChunk.findMany({
    where: {
      embedding: { not: Prisma.DbNull },
      documentId: { not: document.id },
    },
    include: {
      document: {
        include: { source: true },
      },
    },
  });

  // 计算相似度并排序
  const scored = allChunks
    .map((chunk) => ({
      chunk,
      score: cosineSimilarity(queryEmbedding, chunk.embedding as number[]),
    }))
    .sort((a, b) => b.score - a.score);

  // 去重：每文档取最高分的片段，最多 3 个
  const seen = new Set<string>();
  const relatedIdeas: Array<{
    documentId: string;
    title: string;
    filePath: string;
    snippet: string;
    score: number;
    sourceName: string;
  }> = [];

  for (const { chunk, score } of scored) {
    if (seen.has(chunk.documentId)) continue;
    seen.add(chunk.documentId);

    relatedIdeas.push({
      documentId: chunk.documentId,
      title: chunk.document.title,
      filePath: chunk.document.filePath,
      snippet: chunk.content.slice(0, 200),
      score,
      sourceName: chunk.document.source.name,
    });

    if (relatedIdeas.length >= 3) break;
  }

  return NextResponse.json({
    message: "点子保存成功",
    document: {
      id: document.id,
      title: document.title,
      filePath: document.filePath,
    },
    relatedIdeas,
  });
}
