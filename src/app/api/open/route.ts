import { exec } from "child_process";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { filePath } = await req.json();
    if (!filePath) {
      return NextResponse.json({ error: "No filePath provided" }, { status: 400 });
    }
    
    // Use the `open` command (macOS) to open the file
    exec(`open "${filePath}"`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to open file:", error);
    return NextResponse.json({ error: "Failed to open file" }, { status: 500 });
  }
}
