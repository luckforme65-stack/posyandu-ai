"use client";

import { useRef } from "react";
import { Camera, X } from "lucide-react";

export function PhotoUploader({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Resize client-side to <=1024px and re-encode as JPEG q=0.85.
    // MiMo VL caps useful detail well below 2048px and Token Plan key is sensitive to payload size.
    const dataUrl = await fileToResizedDataUrl(file, 1024, 0.85);
    onChange(dataUrl);
    e.target.value = "";
  };

  if (value) {
    return (
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={value} alt="captured" className="rounded-2xl w-full object-cover max-h-80" />
        <button
          onClick={() => onChange(null)}
          className="absolute top-2 right-2 bg-black/55 text-white rounded-full p-1.5"
          aria-label="Remove"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => inputRef.current?.click()}
      className="w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 py-10 text-[var(--color-posy-blue)] bg-[var(--color-posy-blue-soft)]"
      style={{ borderColor: "var(--color-posy-blue)" }}
    >
      <Camera className="w-7 h-7" />
      <span className="text-sm font-semibold">Ambil foto / pilih dari galeri</span>
      <span className="text-[11px] text-[var(--color-mute)]">Sertakan timbangan & alat ukur jika ada</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onPick}
      />
    </button>
  );
}

async function fileToResizedDataUrl(file: File, maxDim: number, quality: number): Promise<string> {
  const buf = await file.arrayBuffer();
  const blob = new Blob([buf], { type: file.type });
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no canvas ctx");
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}
