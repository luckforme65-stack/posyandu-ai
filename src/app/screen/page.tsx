"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/store/session";
import { KaderHeader } from "@/components/KaderHeader";
import { BottomNav } from "@/components/BottomNav";
import { DisclaimerBar } from "@/components/DisclaimerBar";
import { PhotoUploader } from "@/components/PhotoUploader";
import { Loader2, Sparkles, ArrowRight } from "lucide-react";
import { dict } from "@/lib/i18n";
import { ageInMonths } from "@/lib/utils";

export default function ScreenPage() {
  const router = useRouter();
  const lang = useSession((s) => s.lang);
  const t = dict[lang];

  const draft = useSession((s) => ({
    childName: s.childName,
    childBirth: s.childBirth,
    childSex: s.childSex,
    weightKg: s.weightKg,
    heightCm: s.heightCm,
    photoDataUrl: s.photoDataUrl,
  }));
  const setDraft = useSession((s) => s.setDraft);

  const [step, setStep] = useState<"photo" | "data" | "thinking">("photo");
  const [busy, setBusy] = useState(false);
  const [vlMessage, setVlMessage] = useState<string | null>(null);

  const onPhoto = (dataUrl: string | null) => setDraft({ photoDataUrl: dataUrl });

  const callVL = async () => {
    if (!draft.photoDataUrl) return;
    setBusy(true);
    setVlMessage(null);
    try {
      const r = await fetch("/api/screen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: draft.photoDataUrl }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "VL gagal");
      // Auto-fill what we can
      setDraft({
        weightKg: j.scale_kg ?? null,
        heightCm: j.height_cm ?? null,
      });
      setVlMessage(j.kader_hint || "Foto berhasil dianalisa.");
      // Persist visible signs into store via separate setter
      useSession.getState().setDraft({
        // visibleSigns lives in store; we set via setDraft generic
      });
      // We can't pass arrays via the strict patch typing easily, set directly:
      const visibleSigns: string[] = Array.isArray(j.visible_warning_signs) ? j.visible_warning_signs : [];
      useSession.setState({ visibleSigns });
      setStep("data");
    } catch (e) {
      setVlMessage(e instanceof Error ? e.message : "Tidak bisa membaca foto.");
    } finally {
      setBusy(false);
    }
  };

  const goNext = async () => {
    if (!draft.childName || !draft.childBirth) {
      alert("Mohon isi nama dan tanggal lahir anak.");
      return;
    }
    setStep("thinking");
    router.push("/complaint");
  };

  return (
    <main className="min-h-dvh pb-24" style={{ background: "var(--color-bg)" }}>
      <KaderHeader title={t.screen.title} back />

      <section className="max-w-md mx-auto px-4 pt-3 space-y-3">
        <div className="flex items-center gap-2 text-[11.5px] font-semibold text-[var(--color-mute)]">
          <Pill active={step === "photo"}>1 · {t.screen.step1}</Pill>
          <Pill active={step === "data"}>2 · {t.screen.step2}</Pill>
        </div>

        {step === "photo" && (
          <>
            <PhotoUploader value={draft.photoDataUrl} onChange={onPhoto} />
            {vlMessage && (
              <div className="card flex items-start gap-2 text-[12.5px] leading-snug">
                <Sparkles className="w-4 h-4 mt-0.5 text-[var(--color-posy-blue)] flex-shrink-0" />
                <span>{vlMessage}</span>
              </div>
            )}
            <button
              disabled={!draft.photoDataUrl || busy}
              onClick={callVL}
              className="btn btn-primary w-full disabled:opacity-50"
            >
              {busy ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t.screen.analyzing}
                </>
              ) : (
                <>
                  Baca foto dengan MiMo VL <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            <DisclaimerBar text={t.notDiagnosis} />
          </>
        )}

        {step === "data" && (
          <div className="space-y-3">
            <Field label={t.screen.childName} value={draft.childName} onChange={(v) => setDraft({ childName: v })} placeholder="Mis. Anaya R." />
            <Field label={t.screen.birth} value={draft.childBirth} onChange={(v) => setDraft({ childBirth: v })} placeholder="YYYY-MM-DD" type="date" />
            <RadioPair
              label={t.screen.sex}
              value={draft.childSex}
              onChange={(v) => setDraft({ childSex: v as "male" | "female" })}
              options={[{ value: "female", label: t.screen.female }, { value: "male", label: t.screen.male }]}
            />
            <div className="grid grid-cols-2 gap-2">
              <NumField label="Berat (kg)" value={draft.weightKg} onChange={(v) => setDraft({ weightKg: v })} step={0.1} />
              <NumField label="Tinggi (cm)" value={draft.heightCm} onChange={(v) => setDraft({ heightCm: v })} step={0.5} />
            </div>
            {draft.childBirth && (
              <p className="text-[11.5px] text-[var(--color-mute)]">
                Usia: {ageInMonths(draft.childBirth)} bulan
              </p>
            )}
            {vlMessage && (
              <div className="card text-[12.5px] leading-snug">{vlMessage}</div>
            )}
            <button onClick={goNext} className="btn btn-primary w-full">
              Lanjut ke keluhan ibu <ArrowRight className="w-4 h-4" />
            </button>
            <DisclaimerBar text={t.notDiagnosis} />
          </div>
        )}
      </section>

      <BottomNav />
    </main>
  );
}

function Pill({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <span
      className="px-2.5 py-1 rounded-full"
      style={{
        background: active ? "var(--color-posy-blue)" : "var(--color-posy-blue-soft)",
        color: active ? "white" : "var(--color-posy-blue)",
      }}
    >
      {children}
    </span>
  );
}

function Field({
  label, value, onChange, placeholder, type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <div className="text-[11.5px] font-semibold text-[var(--color-mute)] mb-1">{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border px-3 py-2.5 text-[14px] bg-white"
        style={{ borderColor: "var(--color-line)" }}
      />
    </label>
  );
}

function NumField({
  label, value, onChange, step,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  step: number;
}) {
  return (
    <label className="block">
      <div className="text-[11.5px] font-semibold text-[var(--color-mute)] mb-1">{label}</div>
      <input
        type="number"
        step={step}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : parseFloat(e.target.value))}
        className="w-full rounded-xl border px-3 py-2.5 text-[14px] bg-white"
        style={{ borderColor: "var(--color-line)" }}
      />
    </label>
  );
}

function RadioPair({
  label, value, onChange, options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <div className="text-[11.5px] font-semibold text-[var(--color-mute)] mb-1">{label}</div>
      <div className="grid grid-cols-2 gap-2">
        {options.map((o) => {
          const active = value === o.value;
          return (
            <button
              key={o.value}
              onClick={() => onChange(o.value)}
              className="rounded-xl px-3 py-2.5 text-[14px] font-semibold border"
              style={{
                background: active ? "var(--color-posy-blue)" : "white",
                color: active ? "white" : "var(--color-ink)",
                borderColor: active ? "var(--color-posy-blue)" : "var(--color-line)",
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
