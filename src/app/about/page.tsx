"use client";

import { KaderHeader } from "@/components/KaderHeader";
import { BottomNav } from "@/components/BottomNav";
import { DisclaimerBar } from "@/components/DisclaimerBar";
import { Stethoscope, Eye, Mic, Volume2, Code2, ExternalLink, Heart } from "lucide-react";
import { useSession } from "@/store/session";
import { dict } from "@/lib/i18n";

export default function AboutPage() {
  const lang = useSession((s) => s.lang);
  const t = dict[lang];
  return (
    <main className="min-h-dvh pb-24" style={{ background: "var(--color-bg)" }}>
      <KaderHeader title="Tentang PosyanduAI" back />

      <section className="max-w-md mx-auto px-4 pt-3 space-y-3">
        <div className="card-elev">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-posy-blue)]">
            Misi
          </div>
          <h2 className="text-[16.5px] font-bold leading-tight mt-0.5">
            Membantu 1,5 juta kader Posyandu di Indonesia.
          </h2>
          <p className="text-[12.5px] text-[var(--color-mute)] mt-1.5 leading-snug">
            300 ribu Posyandu, banyak di pelosok, sebagian besar tanpa akses dokter. PosyanduAI
            membantu kader menafsirkan timbangan, memahami keluhan ibu dalam bahasa daerah,
            dan membuat keputusan rujukan yang aman.
          </p>
        </div>

        <ModelCard icon={<Stethoscope />} name="MiMo V2.5 Pro" role="Reasoning + triase + langkah konkret" />
        <ModelCard icon={<Eye />} name="MiMo V2.5 (VL)" role="Membaca timbangan, alat ukur, tanda fisik" />
        <ModelCard icon={<Mic />} name="MiMo V2.5 ASR" role="Menyalin keluhan ibu (Bahasa, Jawa, Sunda)" />
        <ModelCard icon={<Volume2 />} name="MiMo V2.5 TTS" role="Penjelasan suara untuk ibu" />

        <div className="card">
          <div className="text-[11.5px] font-semibold uppercase tracking-wide text-[var(--color-mute)] mb-1">
            Open source
          </div>
          <p className="text-[13px] leading-snug">
            MIT-licensed. Kode lengkap di GitHub, deploy di Vercel.
          </p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <a
              href="https://github.com/luckforme65-stack/posyandu-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost"
            >
              <Code2 className="w-4 h-4" /> Repo
            </a>
            <a
              href="https://100t.xiaomimimo.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              <ExternalLink className="w-4 h-4" /> MiMo Orbit
            </a>
          </div>
        </div>

        <div className="card flex items-start gap-2 text-[12.5px] leading-snug">
          <Heart className="w-4 h-4 mt-0.5 text-pink-500 flex-shrink-0" />
          <div>
            <div className="font-semibold">Untuk para Ibu Kader</div>
            <p className="text-[var(--color-mute)]">
              Tugas Anda mulia. Semoga PosyanduAI sedikit meringankan langkah Anda di Posyandu hari ini.
            </p>
          </div>
        </div>

        <DisclaimerBar text={t.notDiagnosis} />
      </section>

      <BottomNav />
    </main>
  );
}

function ModelCard({ icon, name, role }: { icon: React.ReactNode; name: string; role: string }) {
  return (
    <div className="card flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-[var(--color-posy-blue-soft)] text-[var(--color-posy-blue)] flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1">
        <div className="font-semibold text-[14px] leading-tight">{name}</div>
        <div className="text-[12px] text-[var(--color-mute)] leading-snug">{role}</div>
      </div>
    </div>
  );
}
