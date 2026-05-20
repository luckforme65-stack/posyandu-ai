import { NextRequest, NextResponse } from "next/server";
import { visionAnalyze } from "@/lib/mimo";
import { VL_SCREENING_PROMPT } from "@/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const image: string | undefined = body.image;
    if (!image || !image.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "Image must be a data URL (data:image/...)." },
        { status: 400 }
      );
    }

    const result = await visionAnalyze(VL_SCREENING_PROMPT, [image], {
      temperature: 0.2,
      maxTokens: 900,
    });

    let parsed: Record<string, unknown> = {};
    try {
      parsed = parseJsonLoose(result.content);
    } catch (e) {
      // VL sometimes wraps JSON in fences or adds an extra word.
      return NextResponse.json(
        {
          error: "VL returned non-JSON.",
          raw: result.content.slice(0, 400),
          message: e instanceof Error ? e.message : String(e),
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      scale_kg: typeof parsed.scale_kg === "number" ? parsed.scale_kg : null,
      height_cm: typeof parsed.height_cm === "number" ? parsed.height_cm : null,
      child_visible: !!parsed.child_visible,
      estimated_age_band: parsed.estimated_age_band ?? "unknown",
      visible_warning_signs: Array.isArray(parsed.visible_warning_signs) ? parsed.visible_warning_signs : [],
      photo_quality: parsed.photo_quality ?? "good",
      kader_hint: typeof parsed.kader_hint === "string" ? parsed.kader_hint : "",
      usage: result.usage,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal error" },
      { status: 500 }
    );
  }
}

function parseJsonLoose(raw: string): Record<string, unknown> {
  let s = raw.trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```[a-zA-Z]*\n?/, "").replace(/```\s*$/, "").trim();
  }
  // Some models prepend a sentence — find the first `{` and the last `}`.
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start >= 0 && end > start) s = s.slice(start, end + 1);
  return JSON.parse(s);
}
