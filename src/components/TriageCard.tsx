"use client";

import { CheckCircle2, AlertTriangle, Siren, Sparkles } from "lucide-react";
import type { ScreeningResult } from "@/store/session";

const TRIAGE_META = {
  home: {
    label: "Cukup di rumah",
    icon: CheckCircle2,
    classes: "bg-emerald-50 border-emerald-200 text-emerald-800",
  },
  puskesmas: {
    label: "Rujuk Puskesmas minggu ini",
    icon: AlertTriangle,
    classes: "bg-amber-50 border-amber-200 text-amber-900",
  },
  hospital: {
    label: "Rujuk RS hari ini",
    icon: Siren,
    classes: "bg-red-50 border-red-200 text-red-900",
  },
} as const;

const GROWTH_LABEL: Record<ScreeningResult["growth_status"], string> = {
  normal: "Normal",
  at_risk: "Risiko stunting",
  stunted: "Stunting",
  wasted: "Kurus (wasted)",
  unknown: "Belum bisa dipastikan",
};

export function TriageCard({ result }: { result: ScreeningResult }) {
  const meta = TRIAGE_META[result.triage];
  const Icon = meta.icon;
  return (
    <div className="space-y-3 fade-in">
      <div className={`rounded-2xl border px-4 py-3 ${meta.classes} flex items-start gap-3`}>
        <Icon className="w-6 h-6 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-wide opacity-80">Tindak lanjut</div>
          <div className="text-base font-bold leading-tight">{meta.label}</div>
          <div className="text-[13px] mt-1 leading-snug">{result.headline}</div>
        </div>
      </div>

      <div className="card">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-mute)] mb-1">
          Pertumbuhan
        </div>
        <div className="text-sm font-semibold">{GROWTH_LABEL[result.growth_status]}</div>
        <p className="text-[12px] text-[var(--color-mute)] leading-snug mt-1">{result.rationale_for_kader}</p>
      </div>

      <div className="card">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-mute)] mb-2">
          Langkah konkret
        </div>
        <ul className="space-y-2">
          {result.next_steps.map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-[13px] leading-snug">
              <Sparkles className="w-4 h-4 mt-0.5 text-[var(--color-posy-blue)] flex-shrink-0" />
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
