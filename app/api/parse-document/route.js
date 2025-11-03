import fs from "fs";
import { NextResponse } from "next/server";
import pdf from "pdf-parse";
import mammoth from "mammoth";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const contentType = file.type || "application/octet-stream";

    // Read file into buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (contentType === "application/pdf") {
      // parse PDF
      const data = await pdf(buffer);
      const text = data.text || "";
      return NextResponse.json({ text });
    }

    // DOCX
    if (
      contentType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      // fallbacks
      file.name?.toLowerCase().endsWith(".docx")
    ) {
      try {
        const result = await mammoth.extractRawText({ buffer });
        const text = result.value || "";
        return NextResponse.json({ text });
      } catch (err) {
        console.error("Mammoth parse error:", err);
        return NextResponse.json({ error: "Failed to parse DOCX" }, { status: 500 });
      }
    }

    // fallback: plain text
    const text = buffer.toString("utf-8");
    return NextResponse.json({ text });
  } catch (error) {
    console.error("Parse document error:", error);
    return NextResponse.json({ error: "Failed to parse document" }, { status: 500 });
  }
}
