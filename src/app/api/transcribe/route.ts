import { NextRequest, NextResponse } from "next/server";
import { transcribe } from "@/lib/mimo";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const fd = await req.formData();
    const file = fd.get("file");
    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }
    const buf = await file.arrayBuffer();
    const mime = file.type || "audio/webm";
    const result = await transcribe(buf, mime);
    if (!result) {
      return NextResponse.json(
        {
          error:
            "ASR is not available on the Token Plan tier. Please type the mother's complaint instead, or enable a Standard MiMo key.",
          tier: "token-plan",
        },
        { status: 503 }
      );
    }
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal error" },
      { status: 500 }
    );
  }
}
