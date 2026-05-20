"use client";

import { ShieldAlert } from "lucide-react";

export function DisclaimerBar({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-[12px] leading-snug text-amber-900">
      <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <span>{text}</span>
    </div>
  );
}
