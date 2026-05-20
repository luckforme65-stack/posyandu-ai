"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/store/session";
import { KaderHeader } from "@/components/KaderHeader";
import { BottomNav } from "@/components/BottomNav";
import { DisclaimerBar } from "@/components/DisclaimerBar";
import { TriageCard } from "@/components/TriageCard";
import { Loader2, Volume2, Save, RotateCcw, Sparkles } from "lucide-react";
import { dict } from "@/lib/i18n";
import { ageInMonths } from "@/lib/utils";

export default function ResultPage() {
  const router = useRouter();
  const lang = useSession((s) => s.lang);
  const t = dict[lang];

  const childName = useSession((s) => s.childName);
  const childBirth = useSession((s) => s.childBirth);
  const childSex = useSession((s) => s.childSex);
  const weightKg = useSession((s) => s.weightKg);
  const heightCm = useSession((s) => s.heightCm);
  const visibleSigns = useSession((s) => s.visibleSigns);
  const complaint = useSession((s) => s.complaint);
  const result = useSession((s) => s.result);
  const audioUrl = useSession((s) => s.audioUrl);
  const setDraft = useSession((s) => s.setDraft);
  const resetDraft = useSession((s) => s.resetDraft);
  const saveCurrentToRoster = useSession((s) => s.saveCurrentToRoster);

  const [busy, setBusy] = useState(false);
  const [audioBusy, setAudioBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioMissing, setAudioMissing] = useState(false);
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    if (!childName || !childBirth) {
      router.replace("/screen");
      return;
    }
    void runReasoning();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runReasoning = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/reason", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childName,
          ageMonths: ageInMonths(childBirth),
          sex: childSex,
          weightKg,
          heightCm,
          visibleSigns,
          motherComplaint: complaint,
          lang,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Reasoning gagal");
      setDraft({ result: j });
      // Auto-fetch TTS in the background; ignore errors (we degrade)
      void fetchAudio(j.voice_message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyusun saran.");
    } finally {
      setBusy(false);
    }
  };

  const fetchAudio = async (text: string) => {
    setAudioBusy(true);
    setAudioMissing(false);
    try {
      const r = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (r.status === 503) {
        setAudioMissing(true);
        return;
      }
      if (!r.ok) {
        setAudioMissing(true);
        return;
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      setDraft({ audioUrl: url });
    } catch {
      setAudioMissing(true);
    } finally {
      setAudioBusy(false);
    }
  };

  const onSave = () => {
    saveCurrentToRoster();
    router.push("/roster");
  };

  const onNext = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    resetDraft();
    router.push("/screen");
  };

  return (
    <main className="min-h-dvh pb-24" style={{ background: "var(--color-bg)" }}>
      <KaderHeader title={t.result.title} back />

      <section className="max-w-md mx-auto px-4 pt-3 space-y-3">
        <div className="card">
          <div className="text-[11.5px] font-semibold uppercase tracking-wide text-[var(--color-mute)]">
            Anak
          </div>
          <div className="font-bold text-[15px]">{childName || "-"}</div>
          <div className="text-[12px] text-[var(--color-mute)]">
            {childBirth} · {childBirth ? `${ageInMonths(childBirth)} bln` : ""} · {childSex === "male" ? t.screen.male : t.screen.female}
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2">
            <Mini label="Berat" value={weightKg ? `${weightKg} kg` : "—"} />
            <Mini label="Tinggi" value={heightCm ? `${heightCm} cm` : "—"} />
            <Mini label="Tanda" value={visibleSigns.length > 0 ? `${visibleSigns.length} item` : "—"} />
          </div>
        </div>

        {busy && (
          <div className="card flex items-center gap-3 text-[13px]">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--color-posy-blue)]" />
            <span>{t.result.generating}</span>
          </div>
        )}

        {error && (
          <div className="card text-[13px] text-[var(--color-alert)]">
            {error}
            <button onClick={runReasoning} className="ml-2 underline">Coba lagi</button>
          </div>
        )}

        {result && (
          <>
            <TriageCard result={result} />

            <div className="card">
              <div className="flex items-center justify-between mb-1">
                <div className="text-[11.5px] font-semibold uppercase tracking-wide text-[var(--color-mute)]">
                  {t.result.audioLabel}
                </div>
                {audioBusy && <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--color-mute)]" />}
              </div>
              <p className="text-[13.5px] leading-snug mb-2 italic">&ldquo;{result.voice_message}&rdquo;</p>
              {audioUrl ? (
                <audio src={audioUrl} controls className="w-full" />
              ) : audioMissing ? (
                <div className="text-[12px] flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 border border-amber-200 text-amber-900">
                  <Volume2 className="w-4 h-4 mt-0.5" />
                  <span>
                    Suara TTS tidak tersedia di paket Token Plan. Bisa dibacakan langsung oleh kader, atau aktifkan kunci Standar untuk MiMo TTS.
                  </span>
                </div>
              ) : null}
            </div>

            <div className="card flex items-start gap-2 text-[12.5px] leading-snug">
              <Sparkles className="w-4 h-4 mt-0.5 text-[var(--color-posy-blue)] flex-shrink-0" />
              <div>
                <div className="font-semibold mb-0.5">Catatan untuk kader</div>
                <p className="text-[var(--color-mute)]">{result.rationale_for_kader}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button onClick={onSave} className="btn btn-primary">
                <Save className="w-4 h-4" /> {t.result.saveLog}
              </button>
              <button onClick={onNext} className="btn btn-ghost">
                <RotateCcw className="w-4 h-4" /> {t.result.newChild}
              </button>
            </div>
          </>
        )}

        <DisclaimerBar text={t.notDiagnosis} />
      </section>

      <BottomNav />
    </main>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[var(--color-posy-blue-soft)] px-2.5 py-2">
      <div className="text-[10.5px] font-semibold uppercase tracking-wide text-[var(--color-posy-blue)]">{label}</div>
      <div className="text-[13px] font-bold leading-tight">{value}</div>
    </div>
  );
}
