import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/sources - 获取所有已配置的文档来源
export async function GET() {
  const sources = await prisma.source.findMany({
    include: {
      _count: { select: { documents: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(sources);
}

// POST /api/sources - 新增文档来源目录
export async function POST(request: Request) {
  const { name, path } = await request.json();

  if (!name || !path) {
    return NextResponse.json(
      { error: "name 和 path 不能为空" },
      { status: 400 }
    );
  }

  const source = await prisma.source.create({
    data: { name, path },
  });

  return NextResponse.json(source, { status: 201 });
}
