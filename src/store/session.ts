import { create } from "zustand";

export interface ChildRecord {
  id: string;
  name: string;
  birthIso: string;
  sex: "male" | "female";
  lastVisitIso: string;
  lastWeightKg?: number;
  lastHeightCm?: number;
  lastTriage?: "home" | "puskesmas" | "hospital";
  lastGrowth?: "normal" | "at_risk" | "stunted" | "wasted" | "unknown";
}

export interface ScreeningResult {
  growth_status: "normal" | "at_risk" | "stunted" | "wasted" | "unknown";
  triage: "home" | "puskesmas" | "hospital";
  headline: string;
  next_steps: string[];
  voice_message: string;
  rationale_for_kader: string;
}

interface SessionState {
  lang: "id" | "en";
  setLang: (l: "id" | "en") => void;

  kaderName: string;
  setKaderName: (n: string) => void;

  // Active child draft
  childName: string;
  childBirth: string;
  childSex: "male" | "female";
  weightKg: number | null;
  heightCm: number | null;
  photoDataUrl: string | null;
  visibleSigns: string[];
  complaint: string;
  result: ScreeningResult | null;
  audioUrl: string | null;

  setDraft: (patch: Partial<{
    childName: string;
    childBirth: string;
    childSex: "male" | "female";
    weightKg: number | null;
    heightCm: number | null;
    photoDataUrl: string | null;
    visibleSigns: string[];
    complaint: string;
    result: ScreeningResult | null;
    audioUrl: string | null;
  }>) => void;
  resetDraft: () => void;

  // Roster
  roster: ChildRecord[];
  saveCurrentToRoster: () => void;
}

const initialDraft = {
  childName: "",
  childBirth: "",
  childSex: "female" as const,
  weightKg: null,
  heightCm: null,
  photoDataUrl: null,
  visibleSigns: [],
  complaint: "",
  result: null,
  audioUrl: null,
};

const seedRoster: ChildRecord[] = [
  { id: "c1", name: "Anaya R.", birthIso: "2024-02-14", sex: "female", lastVisitIso: "2026-05-13", lastWeightKg: 8.7, lastHeightCm: 76, lastTriage: "home", lastGrowth: "normal" },
  { id: "c2", name: "Bagas S.", birthIso: "2023-08-04", sex: "male", lastVisitIso: "2026-05-15", lastWeightKg: 9.2, lastHeightCm: 79, lastTriage: "puskesmas", lastGrowth: "at_risk" },
  { id: "c3", name: "Citra P.", birthIso: "2025-11-30", sex: "female", lastVisitIso: "2026-05-18", lastWeightKg: 5.4, lastHeightCm: 58, lastTriage: "home", lastGrowth: "normal" },
];

export const useSession = create<SessionState>((set, get) => ({
  lang: "id",
  setLang: (l) => set({ lang: l }),

  kaderName: "Bu Sari",
  setKaderName: (n) => set({ kaderName: n }),

  ...initialDraft,
  setDraft: (patch) => set((s) => ({ ...s, ...patch })),
  resetDraft: () => set({ ...initialDraft }),

  roster: seedRoster,
  saveCurrentToRoster: () => {
    const s = get();
    if (!s.childName) return;
    const id = `c${Date.now()}`;
    const rec: ChildRecord = {
      id,
      name: s.childName,
      birthIso: s.childBirth,
      sex: s.childSex,
      lastVisitIso: new Date().toISOString().slice(0, 10),
      lastWeightKg: s.weightKg ?? undefined,
      lastHeightCm: s.heightCm ?? undefined,
      lastTriage: s.result?.triage,
      lastGrowth: s.result?.growth_status,
    };
    set({ roster: [rec, ...s.roster] });
  },
}));
