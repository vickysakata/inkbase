import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEmbeddings } from "@/lib/embedding";
import { Prisma } from "@/generated/prisma/client";

// POST /api/index - 为未生成 embedding 的文档分块生成向量
export async function POST(request: Request) {
  const { sourceId } = await request.json();

  // 查找未生成 embedding 的 chunks（SQL NULL = 从未赋值）
  const whereClause: Prisma.DocumentChunkWhereInput = sourceId
    ? { embedding: { equals: Prisma.DbNull }, document: { sourceId } }
    : { embedding: { equals: Prisma.DbNull } };

  const chunks = await prisma.documentChunk.findMany({
    where: whereClause,
    select: { id: true, content: true },
    take: 50, // 每次最多处理 50 个，避免超时
  });

  if (chunks.length === 0) {
    return NextResponse.json({ message: "所有文档已索引完毕", processed: 0 });
  }

  // 批量获取 embedding
  const texts = chunks.map((c) => c.content);
  const embeddings = await getEmbeddings(texts);

  // 更新数据库
  for (let i = 0; i < chunks.length; i++) {
    await prisma.documentChunk.update({
      where: { id: chunks[i].id },
      data: { embedding: embeddings[i] },
    });
  }

  // 检查剩余未处理数量
  const remaining = await prisma.documentChunk.count({
    where: whereClause,
  });

  return NextResponse.json({
    message: "索引生成中",
    processed: chunks.length,
    remaining,
  });
}
