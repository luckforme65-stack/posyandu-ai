import { NextRequest, NextResponse } from "next/server";
import { chatComplete } from "@/lib/mimo";
import { reasoningPrompt } from "@/lib/prompts";
import { evaluateGrowth } from "@/lib/growth";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ageMonths = Number(body.ageMonths) || 0;
    const sex = body.sex === "male" ? "male" : "female";
    const weightKg = typeof body.weightKg === "number" ? body.weightKg : null;
    const heightCm = typeof body.heightCm === "number" ? body.heightCm : null;
    const visibleSigns: string[] = Array.isArray(body.visibleSigns) ? body.visibleSigns : [];
    const motherComplaint: string = body.motherComplaint || "";
    const childName: string = body.childName || "";
    const lang: "id" | "en" = body.lang === "en" ? "en" : "id";

    const growthHints = evaluateGrowth({
      ageMonths,
      sex,
      weightKg: weightKg ?? undefined,
      heightCm: heightCm ?? undefined,
    });

    const prompt = reasoningPrompt({
      childName,
      ageMonths,
      sex,
      weightKg,
      heightCm,
      visibleSigns,
      motherComplaint,
      growthHints,
      lang,
    });

    const result = await chatComplete(
      [
        { role: "system", content: "You are PosyanduAI, a triage assistant. Always return strict JSON." },
        { role: "user", content: prompt },
      ],
      { model: "mimo-v2.5-pro", temperature: 0.3, maxTokens: 2400 }
    );

    let parsed: Record<string, unknown> = {};
    try {
      parsed = parseJsonLoose(result.content);
    } catch (e) {
      return NextResponse.json(
        { error: "Reasoning returned non-JSON.", raw: result.content.slice(0, 400), message: e instanceof Error ? e.message : String(e) },
        { status: 502 }
      );
    }

    const allowedTriage = new Set(["home", "puskesmas", "hospital"]);
    const allowedGrowth = new Set(["normal", "at_risk", "stunted", "wasted", "unknown"]);

    const triage = allowedTriage.has(String(parsed.triage)) ? parsed.triage : "puskesmas";
    const growthStatus = allowedGrowth.has(String(parsed.growth_status)) ? parsed.growth_status : "unknown";

    return NextResponse.json({
      growth_status: growthStatus,
      triage,
      headline: typeof parsed.headline === "string" ? parsed.headline : "Periksa kembali ke Puskesmas dalam minggu ini.",
      next_steps: Array.isArray(parsed.next_steps) ? parsed.next_steps.slice(0, 4) : [],
      voice_message: typeof parsed.voice_message === "string" ? parsed.voice_message : "",
      rationale_for_kader: typeof parsed.rationale_for_kader === "string" ? parsed.rationale_for_kader : "",
      hints: growthHints,
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
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start >= 0 && end > start) s = s.slice(start, end + 1);
  return JSON.parse(s);
}
