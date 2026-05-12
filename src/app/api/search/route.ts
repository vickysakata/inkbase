import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cosineSimilarity } from "@/lib/similarity";
import { getEmbedding } from "@/lib/embedding";
import { Prisma } from "@/generated/prisma/client";

export interface SearchResult {
  documentId: string;
  title: string;
  filePath: string;
  snippet: string;
  score: number;
  sourceName: string;
}

// POST /api/search - 语义搜索
export async function POST(request: Request) {
  const { query, sourceIds, limit = 10 } = await request.json();

  if (!query) {
    return NextResponse.json(
      { error: "搜索内容不能为空" },
      { status: 400 }
    );
  }

  // 获取查询文本的 embedding
  const queryEmbedding = await getEmbedding(query);

  // 构建过滤条件
  const whereClause: Prisma.DocumentChunkWhereInput = sourceIds?.length
    ? { document: { sourceId: { in: sourceIds } }, embedding: { not: Prisma.DbNull } }
    : { embedding: { not: Prisma.DbNull } };

  // 获取所有有 embedding 的 chunks
  const chunks = await prisma.documentChunk.findMany({
    where: whereClause,
    include: {
      document: {
        include: { source: true },
      },
    },
  });

  // 计算相似度并排序
  const scored = chunks
    .map((chunk) => ({
      chunk,
      score: cosineSimilarity(queryEmbedding, chunk.embedding as number[]),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  // 去重：同一文档取最高分的片段
  const seen = new Set<string>();
  const results: SearchResult[] = [];

  for (const { chunk, score } of scored) {
    if (seen.has(chunk.documentId)) continue;
    seen.add(chunk.documentId);

    results.push({
      documentId: chunk.documentId,
      title: chunk.document.title,
      filePath: chunk.document.filePath,
      snippet: chunk.content.slice(0, 200),
      score,
      sourceName: chunk.document.source.name,
    });
  }

  return NextResponse.json(results);
}
