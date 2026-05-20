"use client";

import { useSession, type ChildRecord } from "@/store/session";
import { KaderHeader } from "@/components/KaderHeader";
import { BottomNav } from "@/components/BottomNav";
import { DisclaimerBar } from "@/components/DisclaimerBar";
import { dict } from "@/lib/i18n";
import { ageInMonths } from "@/lib/utils";

const triageColor: Record<NonNullable<ChildRecord["lastTriage"]>, string> = {
  home: "chip-safe",
  puskesmas: "chip-warn",
  hospital: "chip-alert",
};

const growthLabel: Record<NonNullable<ChildRecord["lastGrowth"]>, string> = {
  normal: "Normal",
  at_risk: "Risiko",
  stunted: "Stunting",
  wasted: "Wasted",
  unknown: "—",
};

export default function RosterPage() {
  const lang = useSession((s) => s.lang);
  const t = dict[lang];
  const roster = useSession((s) => s.roster);

  return (
    <main className="min-h-dvh pb-24" style={{ background: "var(--color-bg)" }}>
      <KaderHeader title={t.home.roster} back />

      <section className="max-w-md mx-auto px-4 pt-3 space-y-2">
        {roster.length === 0 ? (
          <div className="card text-[13px] text-[var(--color-mute)] text-center py-8">
            Belum ada anak terdaftar.
          </div>
        ) : (
          roster.map((c) => (
            <div key={c.id} className="card flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--color-posy-blue-soft)] text-[var(--color-posy-blue)] flex items-center justify-center font-bold">
                {c.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[14px] leading-tight truncate">{c.name}</div>
                <div className="text-[11.5px] text-[var(--color-mute)]">
                  {ageInMonths(c.birthIso)} bln · {c.sex === "male" ? "L" : "P"} · {c.lastVisitIso}
                </div>
                <div className="text-[11.5px] text-[var(--color-mute)] mt-0.5">
                  {c.lastWeightKg ? `${c.lastWeightKg} kg` : "—"} · {c.lastHeightCm ? `${c.lastHeightCm} cm` : "—"} · {c.lastGrowth ? growthLabel[c.lastGrowth] : "—"}
                </div>
              </div>
              {c.lastTriage && (
                <span className={`chip ${triageColor[c.lastTriage]}`}>
                  {c.lastTriage === "home" ? "rumah" : c.lastTriage === "puskesmas" ? "Puskesmas" : "RS"}
                </span>
              )}
            </div>
          ))
        )}

        <div className="pt-2">
          <DisclaimerBar text={t.notDiagnosis} />
        </div>
      </section>

      <BottomNav />
    </main>
  );
}
