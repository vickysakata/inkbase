import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { splitIntoChunks } from "@/lib/chunker";
import fs from "fs/promises";
import path from "path";

// POST /api/scan - 扫描指定来源目录，更新文档索引
export async function POST(request: Request) {
  const { sourceId } = await request.json();

  if (!sourceId) {
    return NextResponse.json(
      { error: "sourceId 不能为空" },
      { status: 400 }
    );
  }

  const source = await prisma.source.findUnique({ where: { id: sourceId } });
  if (!source) {
    return NextResponse.json(
      { error: "来源不存在" },
      { status: 404 }
    );
  }

  // 递归读取目录中所有 .md 文件
  const mdFiles = await findMarkdownFiles(source.path);

  let created = 0;
  let updated = 0;
  let unchanged = 0;

  for (const filePath of mdFiles) {
    const stat = await fs.stat(filePath);
    const fileModAt = stat.mtime;
    const title = path.basename(filePath, ".md");

    // 检查是否已存在
    const existing = await prisma.document.findUnique({
      where: { filePath },
    });

    if (existing && existing.fileModAt >= fileModAt) {
      unchanged++;
      continue;
    }

    const content = await fs.readFile(filePath, "utf-8");
    const chunks = splitIntoChunks(content, title);

    if (existing) {
      // 文件已更新，重新索引
      await prisma.documentChunk.deleteMany({
        where: { documentId: existing.id },
      });
      await prisma.document.update({
        where: { id: existing.id },
        data: {
          title,
          content,
          fileModAt,
          chunks: {
            create: chunks.map((c, idx) => ({
              content: c,
              chunkIdx: idx,
            })),
          },
        },
      });
      updated++;
    } else {
      // 新文件
      await prisma.document.create({
        data: {
          title,
          filePath,
          content,
          fileModAt,
          sourceId: source.id,
          chunks: {
            create: chunks.map((c, idx) => ({
              content: c,
              chunkIdx: idx,
            })),
          },
        },
      });
      created++;
    }
  }

  return NextResponse.json({
    message: "扫描完成",
    total: mdFiles.length,
    created,
    updated,
    unchanged,
  });
}

async function findMarkdownFiles(dirPath: string): Promise<string[]> {
  const results: string[] = [];

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        // 跳过隐藏目录
        if (!entry.name.startsWith(".")) {
          const nested = await findMarkdownFiles(fullPath);
          results.push(...nested);
        }
      } else if (entry.name.endsWith(".md")) {
        results.push(fullPath);
      }
    }
  } catch {
    // 目录不存在或无权限，跳过
  }

  return results;
}
