import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/documents/[id] - 获取文档详情
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const document = await prisma.document.findUnique({
    where: { id },
    include: { source: true },
  });

  if (!document) {
    return NextResponse.json(
      { error: "文档不存在" },
      { status: 404 }
    );
  }

  return NextResponse.json(document);
}
