"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/store/session";
import { KaderHeader } from "@/components/KaderHeader";
import { BottomNav } from "@/components/BottomNav";
import { DisclaimerBar } from "@/components/DisclaimerBar";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { ArrowRight, SkipForward, Edit3 } from "lucide-react";
import { dict } from "@/lib/i18n";

export default function ComplaintPage() {
  const router = useRouter();
  const lang = useSession((s) => s.lang);
  const t = dict[lang];
  const complaint = useSession((s) => s.complaint);
  const setDraft = useSession((s) => s.setDraft);
  const [editing, setEditing] = useState(false);

  const goResult = () => router.push("/result");

  return (
    <main className="min-h-dvh pb-24" style={{ background: "var(--color-bg)" }}>
      <KaderHeader title={t.complaint.title} back />

      <section className="max-w-md mx-auto px-4 pt-3 space-y-4">
        <div className="card">
          <p className="text-[13px] leading-snug text-[var(--color-mute)]">
            {t.complaint.hint}
          </p>
          <p className="text-[12px] text-[var(--color-posy-blue)] mt-1">
            🌐 Mendukung Bahasa, Jawa, Sunda, Madura — MiMo ASR auto-detect.
          </p>
        </div>

        <div className="card flex flex-col items-center py-7">
          <VoiceRecorder onResult={(text) => setDraft({ complaint: text })} />
        </div>

        {(complaint || editing) && (
          <div className="card space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-[11.5px] font-semibold uppercase tracking-wide text-[var(--color-mute)]">
                {t.complaint.transcript}
              </div>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="text-[11.5px] font-semibold text-[var(--color-posy-blue)] inline-flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
              )}
            </div>
            {editing ? (
              <textarea
                value={complaint}
                onChange={(e) => setDraft({ complaint: e.target.value })}
                className="w-full rounded-xl border p-2.5 text-[13.5px] leading-snug bg-white min-h-[100px]"
                style={{ borderColor: "var(--color-line)" }}
              />
            ) : (
              <p className="text-[13.5px] leading-snug whitespace-pre-wrap">{complaint}</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => { setDraft({ complaint: "" }); goResult(); }}
            className="btn btn-ghost"
          >
            <SkipForward className="w-4 h-4" /> {t.complaint.skip}
          </button>
          <button onClick={goResult} className="btn btn-primary">
            {t.screen.next} <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <DisclaimerBar text={t.notDiagnosis} />
      </section>

      <BottomNav />
    </main>
  );
}
