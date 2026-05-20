"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, Loader2 } from "lucide-react";

export function VoiceRecorder({
  onResult,
}: {
  onResult: (transcript: string) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      if (mediaRef.current && mediaRef.current.state !== "inactive") {
        mediaRef.current.stop();
      }
    };
  }, []);

  const start = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        await sendForTranscription(new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" }), mr.mimeType || "audio/webm");
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
      setSeconds(0);
      tickRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tidak bisa akses mikrofon");
    }
  };

  const stop = () => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    setRecording(false);
    mediaRef.current?.stop();
  };

  const sendForTranscription = async (blob: Blob, mime: string) => {
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", blob, `recording.${mime.split("/")[1]?.split(";")[0] || "webm"}`);
      const r = await fetch("/api/transcribe", { method: "POST", body: fd });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "ASR gagal");
      onResult(j.text || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyalin suara");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {!recording && !busy && (
        <button
          onClick={start}
          className="w-20 h-20 rounded-full bg-[var(--color-posy-blue)] text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        >
          <Mic className="w-9 h-9" />
        </button>
      )}
      {recording && (
        <button
          onClick={stop}
          className="w-20 h-20 rounded-full bg-[var(--color-alert)] text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        >
          <Square className="w-9 h-9" />
        </button>
      )}
      {busy && (
        <div className="w-20 h-20 rounded-full bg-[var(--color-posy-blue-soft)] text-[var(--color-posy-blue)] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      )}
      <div className="text-[12px] text-[var(--color-mute)] h-4">
        {recording ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="pulse-dot" /> merekam… {seconds}s
          </span>
        ) : busy ? (
          "menyalin dengan MiMo ASR…"
        ) : (
          "tekan untuk mulai merekam"
        )}
      </div>
      {error && <div className="text-[12px] text-[var(--color-alert)]">{error}</div>}
    </div>
  );
}
