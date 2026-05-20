import { NextRequest, NextResponse } from "next/server";
import { speak } from "@/lib/mimo";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text: string = body.text || "";
    if (!text.trim()) {
      return NextResponse.json({ error: "Empty text" }, { status: 400 });
    }
    const audio = await speak(text);
    if (!audio) {
      return NextResponse.json(
        {
          error:
            "TTS is not available on the Token Plan tier. The kader can read the message aloud instead.",
          tier: "token-plan",
        },
        { status: 503 }
      );
    }
    return new NextResponse(new Uint8Array(audio), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal error" },
      { status: 500 }
    );
  }
}
