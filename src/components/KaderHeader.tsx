"use client";

import { useSession } from "@/store/session";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function KaderHeader({ title, back = false }: { title?: string; back?: boolean }) {
  const lang = useSession((s) => s.lang);
  const setLang = useSession((s) => s.setLang);
  const router = useRouter();
  return (
    <header className="sticky top-0 z-20 bg-white/85 backdrop-blur border-b" style={{ borderColor: "var(--color-line)" }}>
      <div className="max-w-md mx-auto flex items-center px-4 py-3 gap-2">
        {back ? (
          <button onClick={() => router.back()} className="p-1 -ml-1" aria-label="Back">
            <ChevronLeft className="w-5 h-5" />
          </button>
        ) : (
          <span className="text-base">🌿</span>
        )}
        <div className="flex-1">
          <h1 className="text-[15px] font-semibold leading-tight">{title ?? "PosyanduAI"}</h1>
          {!title && <p className="text-[11px] text-[var(--color-mute)]">bertenaga MiMo V2.5</p>}
        </div>
        <button
          onClick={() => setLang(lang === "id" ? "en" : "id")}
          className="text-[11px] font-semibold px-2 py-1 rounded-full border"
          style={{ borderColor: "var(--color-line)", color: "var(--color-posy-blue)" }}
        >
          {lang === "id" ? "EN" : "ID"}
        </button>
      </div>
    </header>
  );
}
