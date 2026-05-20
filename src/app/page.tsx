"use client";

import Link from "next/link";
import { useSession } from "@/store/session";
import { KaderHeader } from "@/components/KaderHeader";
import { BottomNav } from "@/components/BottomNav";
import { DisclaimerBar } from "@/components/DisclaimerBar";
import { Stethoscope, Mic, Users, Activity, Lightbulb, ChevronRight } from "lucide-react";
import { dict } from "@/lib/i18n";

export default function HomePage() {
  const lang = useSession((s) => s.lang);
  const kader = useSession((s) => s.kaderName);
  const roster = useSession((s) => s.roster);
  const t = dict[lang];

  const todayCount = roster.filter((c) => c.lastVisitIso === "2026-05-20").length;
  const flagged = roster.filter((c) => c.lastTriage === "puskesmas" || c.lastTriage === "hospital").length;

  return (
    <main className="min-h-dvh pb-24" style={{ background: "var(--color-bg)" }}>
      <KaderHeader />

      <section className="max-w-md mx-auto px-4 pt-4 pb-2">
        <div className="card-elev">
          <p className="text-[12px] text-[var(--color-mute)]">
            {t.home.welcome}
          </p>
          <p className="text-lg font-bold leading-tight">{kader} 👋</p>
          <p className="text-[12px] text-[var(--color-mute)] mt-1 leading-snug">{t.tagline}</p>
        </div>
      </section>

      <section className="max-w-md mx-auto px-4 grid grid-cols-3 gap-2 pb-3">
        <Stat label={t.home.stats.today} value={todayCount} accent="var(--color-posy-blue)" />
        <Stat label={t.home.stats.thisWeek} value={roster.length} accent="var(--color-safe)" />
        <Stat label={t.home.stats.flagged} value={flagged} accent="var(--color-warn)" />
      </section>

      <section className="max-w-md mx-auto px-4 space-y-2 pb-3">
        <ActionTile
          href="/screen"
          icon={<Stethoscope className="w-5 h-5" />}
          title={t.home.startScreen}
          subtitle="Foto + data → MiMo VL + Pro"
          tone="primary"
        />
        <ActionTile
          href="/complaint"
          icon={<Mic className="w-5 h-5" />}
          title={t.home.voiceComplaint}
          subtitle="Suara ibu → MiMo ASR"
          tone="ghost"
        />
        <ActionTile
          href="/roster"
          icon={<Users className="w-5 h-5" />}
          title={t.home.roster}
          subtitle={`${roster.length} anak terdaftar`}
          tone="ghost"
        />
      </section>

      <section className="max-w-md mx-auto px-4 pb-4">
        <div className="card flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-[var(--color-warn)] flex-shrink-0 mt-0.5" />
          <div className="text-[12.5px] leading-snug">
            <div className="font-semibold mb-0.5">{t.home.tips}</div>
            <p className="text-[var(--color-mute)]">
              Pastikan timbangan diset 0 sebelum anak ditimbang. Foto sebaiknya tegak, jangan miring,
              agar MiMo VL dapat membaca skala dengan tepat.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-md mx-auto px-4 pb-3">
        <DisclaimerBar text={t.notDiagnosis} />
      </section>

      <section className="max-w-md mx-auto px-4 pb-4">
        <div className="card flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[var(--color-posy-blue-soft)] text-[var(--color-posy-blue)] flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-mute)]">
              Powered by
            </div>
            <div className="text-[13px] font-semibold leading-tight">
              Xiaomi MiMo V2.5 — Pro · VL · ASR · TTS
            </div>
          </div>
        </div>
      </section>

      <BottomNav />
    </main>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="card flex flex-col py-2.5 px-3">
      <span className="text-[10.5px] font-semibold uppercase tracking-wide text-[var(--color-mute)]">
        {label}
      </span>
      <span className="text-xl font-bold leading-tight" style={{ color: accent }}>{value}</span>
    </div>
  );
}

function ActionTile({
  href, icon, title, subtitle, tone,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  tone: "primary" | "ghost";
}) {
  const isPrimary = tone === "primary";
  return (
    <Link
      href={href}
      className={
        isPrimary
          ? "flex items-center gap-3 rounded-2xl px-4 py-3 text-white shadow-lg"
          : "flex items-center gap-3 rounded-2xl px-4 py-3 bg-white border"
      }
      style={
        isPrimary
          ? { background: "linear-gradient(120deg,#2D7DD2 0%,#4DA3F0 100%)" }
          : { borderColor: "var(--color-line)" }
      }
    >
      <div
        className={
          isPrimary
            ? "w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"
            : "w-10 h-10 rounded-xl bg-[var(--color-posy-blue-soft)] flex items-center justify-center text-[var(--color-posy-blue)]"
        }
      >
        {icon}
      </div>
      <div className="flex-1">
        <div className={isPrimary ? "text-[14.5px] font-bold" : "text-[14px] font-semibold"}>{title}</div>
        <div className={isPrimary ? "text-[11.5px] opacity-85" : "text-[11.5px] text-[var(--color-mute)]"}>
          {subtitle}
        </div>
      </div>
      <ChevronRight className={isPrimary ? "w-5 h-5 opacity-80" : "w-5 h-5 text-[var(--color-mute)]"} />
    </Link>
  );
}
