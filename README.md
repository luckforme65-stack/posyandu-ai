# PosyanduAI

> AI assistant for Indonesia's 1.5M Posyandu kaders, powered by Xiaomi MiMo (V2.5 Pro · VL · ASR · TTS).
>
> Submission to the **Xiaomi MiMo Orbit 100T Token Creator Program**.

## What it does

A mobile-first PWA the kader (community health volunteer) opens during a weighing session. Four MiMo models, one workflow:

1. **📷 Photo screen** — kader snaps the child + scale + height stick. **MiMo VL** reads the scale (kg), the height stick (cm), and flags visible warning signs (rash, swollen abdomen, severe wasting).
2. **🎙️ Voice complaint** — the mother describes her concerns in Bahasa, Javanese, Sundanese, or Madurese. **MiMo ASR** auto-detects the language and transcribes.
3. **🧠 Reasoning** — **MiMo Pro** combines the readings + complaint + age/sex against a digest of WHO Child Growth Standards and Kemenkes Buku KIA red flags. Outputs: growth status (normal / risk-of-stunting / stunted / wasted), 2–4 concrete next steps, and a triage tier (✅ home care / ⚠️ Puskesmas this week / 🚨 hospital today).
4. **🔊 Voice reply** — **MiMo TTS** speaks the result back in Bahasa with a warm, calm voice the mother can understand without reading.

Every consultation is saved to a kader's roster so they can track each child across visits.

> ⚠️ **Not a medical diagnosis.** PosyanduAI is decision-support for community health volunteers. Triage always escalates on uncertainty — false positives are cheap (a kader walks the family to the clinic), false negatives are not. Every screen carries the disclaimer "Bukan diagnosa medis."

## Why this matters

Indonesia runs ~300,000 Posyandu posts staffed by ~1.5M volunteer mothers. Most kaders have no medical training and the nearest pediatrician is often hours away. The country's stunting rate is still 21.5%. A kader carries a phone — that's the only piece of infrastructure we can rely on.

## Architecture

```
┌──────────────────────────────────────────────────────┐
│  Mobile PWA (Next.js 16 + Turbopack)                  │
│  5 routes: home · screen · complaint · result · roster│
└──────────────────┬───────────────────────────────────┘
                   ▼
┌──────────────────────────────────────────────────────┐
│  Next.js API routes (Vercel serverless)              │
│  /api/screen     → MiMo VL  (mimo-v2.5)              │
│  /api/transcribe → MiMo ASR (mimo-v2.5-asr)          │
│  /api/reason     → MiMo Pro (mimo-v2.5-pro)          │
│  /api/speak      → MiMo TTS (mimo-v2.5-tts)          │
└──────────────────┬───────────────────────────────────┘
                   ▼
┌──────────────────────────────────────────────────────┐
│  Xiaomi MiMo platform                                 │
│  token-plan-sgp.xiaomimimo.com (chat + multimodal)   │
│  api.xiaomimimo.com (TTS + ASR — Standard tier only) │
└──────────────────────────────────────────────────────┘
```

The app gracefully degrades when running on a Token Plan key (which doesn't expose `/v1/audio/*` routes): TTS becomes "kader reads aloud" and ASR becomes "kader types the complaint".

## Run locally

```bash
git clone https://github.com/luckforme65-stack/posyandu-ai.git
cd posyandu-ai
npm install
echo "MIMO_API_KEY=tp-..." > .env.local   # or a Standard PAYG key
npm run dev
# → http://localhost:3000
```

## Deploy

```bash
vercel link --yes
vercel env add MIMO_API_KEY production
vercel --prod
```

Disable Vercel team SSO so Orbit reviewers can hit the live demo without an auth wall.

## Token consumption forecast

| Feature | Model | Median tokens / call |
|---|---|---|
| VL photo screening | `mimo-v2.5` | 3,500 in + 600 out |
| ASR voice complaint | `mimo-v2.5-asr` | (audio) |
| Pro reasoning + growth ref | `mimo-v2.5-pro` | 4,500 in + 800 out |
| TTS voice reply | `mimo-v2.5-tts` | (audio) |
| **Per consultation** | — | **~9,400 LLM tokens** |

Pilot (30 posts × 50 sessions/day) → ~14M tokens/day → **~420M tokens / 30 days**. Scale-up (1,000 posts × 30 sessions/day) → ~280M tokens/day → **~8.5B tokens / month**.

## Tech stack

- Next.js 16 (Turbopack) + TypeScript + App Router
- Tailwind CSS v4 + Lucide React + Framer Motion
- Zustand for offline-first session state
- Direct fetch wrapper for MiMo (`src/lib/mimo.ts`) — auto tier-routing on `tp-` prefix

## License

MIT — same as `XiaomiMiMo/MiMo-Skills`. Use it, fork it, deploy it in your own kelurahan.

## Acknowledgements

- Xiaomi MiMo team for the V2.5 model family and the 100T Orbit program.
- Indonesia's 1.5 million Posyandu kaders. This is for you.
