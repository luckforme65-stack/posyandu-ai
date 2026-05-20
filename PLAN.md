# PosyanduAI — AI assistant for Indonesia's Posyandu kaders

> 4 MiMo models, one workflow. From a community health post to a confident kader, in under 60 seconds.

## The problem

Indonesia runs ~300,000 **Posyandu** (community health posts) staffed by ~1.5M kaders — volunteer mothers and grandmothers who weigh, measure, and counsel kids under five. Most have no medical training. The nearest pediatrician is often hours away, and the WHO growth chart booklet is in clinical Indonesian most rural kaders can't fully decode. The result: stunting goes undetected (Indonesia's stunting rate is still 21.5% as of 2025), red-flag rashes are dismissed as "normal", and feeding advice is folklore.

A kader carries a phone. That's the only piece of infrastructure we can rely on.

## What PosyanduAI does

A mobile-first PWA the kader opens during a weighing session. One flow, four AI surfaces, all in the same conversation:

1. **📷 Photo screen.** Snap the child + the weighing scale + the height stick. **MiMo VL** reads the scale (kg), reads the height stick (cm), spots visible warning signs (rash, swollen abdomen, jaundice, severe wasting).
2. **🎙️ Voice complaint.** The mother says what's worrying her in Bahasa, Javanese, Sundanese, or Madurese. **MiMo ASR** transcribes the dialect (`language: 'auto'`).
3. **🧠 Reasoning.** **MiMo Pro** combines the photo readings + the complaint + the child's age/sex (kader inputs) and reasons against an indexed corpus of WHO growth standards, Kemenkes Buku KIA red flags, and IDAI immunization guidelines. Outputs: growth status (normal / risk-of-stunting / stunted / wasted), 2–3 concrete next steps, and a triage tier (✅ home care / ⚠️ Puskesmas this week / 🚨 hospital today).
4. **🔊 Voice reply.** **MiMo TTS** speaks the result back in Bahasa with a warm, calm female voice the mother can understand without reading.

Every consultation is logged offline-first (IndexedDB) and syncs to a kader's roster page so they can track each child across visits.

## Why this is a strong Orbit submission

- **All 4 V2.5 models in one product** — most submissions touch chat only.
- **Real-world deployment narrative** — 300k Posyandu posts × 1.5M kaders is a believable user count, with token-consumption math that pencils out (see below).
- **Geographic alignment with Xiaomi's brand** — Indonesia is Xiaomi's #2 smartphone market. A flagship Bahasa product fits Xiaomi's "tech for emerging markets" positioning.
- **Open-source MIT** — directly mirrors `XiaomiMiMo/MiMo-Skills` license posture.
- **Consumes our `mimo-forge` SDK** — closes the loop on Xiaomi's ecosystem multiplier criterion.
- **Built with MiMo-via-MiMo** — built on Hermes Agent + Claude Code + Cursor, all routed through Reyn's 9router → MiMo backend.

## NOT a diagnosis. By design.

PosyanduAI is a **decision-support tool for community health volunteers**, not a doctor. Every output card carries the disclaimer "Bukan diagnosa medis. Konsultasikan dengan tenaga kesehatan untuk keputusan klinis." Triage routing always errs on the side of escalating to Puskesmas/RS — false positives are cheap (a kader walks the family to the clinic), false negatives are not.

## Architecture

```
┌──────────────────────────────────────────────────────┐
│  Mobile PWA (Next.js 16 + Turbopack, App Router)     │
│  ─ kader ID + offline IndexedDB queue                │
│  ─ 5 routes: home, screen, complaint, result, roster │
└──────────────────┬───────────────────────────────────┘
                   │  fetch /api/*
                   ▼
┌──────────────────────────────────────────────────────┐
│  Next.js API routes (Vercel serverless, ID region)   │
│  ─ /api/screen        VL → growth indicators          │
│  ─ /api/transcribe    ASR → text                      │
│  ─ /api/reason        Pro → triage + next steps       │
│  ─ /api/speak         TTS → audio bytes               │
│  ─ /api/roster        Postgres (Vercel KV) optional   │
└──────────────────┬───────────────────────────────────┘
                   │  HTTPS Bearer tp-...
                   ▼
┌──────────────────────────────────────────────────────┐
│  Xiaomi MiMo platform                                 │
│  ─ token-plan-sgp.xiaomimimo.com (chat + multimodal) │
│  ─ api.xiaomimimo.com (TTS + ASR)                     │
└──────────────────────────────────────────────────────┘
```

Two MiMo base URLs because Token Plan keys don't expose `/v1/audio/*`. SDK already handles tier detection from the `tp-` prefix; the API route picks the right base per call.

## Token-consumption forecast

Realistic numbers, broken down per feature, per session:

| Feature | Model | Median tokens / call |
|---|---|---|
| VL photo screening (resized to 1024px) | `mimo-v2.5` (multimodal) | 3,500 in + 600 out |
| ASR voice complaint (avg 18s clip) | `mimo-v2.5-asr` | 0 LLM (audio) |
| Pro reasoning + WHO context | `mimo-v2.5-pro` | 4,500 in + 800 out (incl. ~150 reasoning) |
| TTS reply (avg 95 chars) | `mimo-v2.5-tts` | 0 LLM (audio) |
| **Per consultation (LLM total)** | — | **~9,400 tokens** |

Pilot scope (30-day window, conservative):
- 30 kader posts × 50 sessions/day × 9.4k tokens ≈ **14M tokens/day**
- 30-day total ≈ **420M tokens**
- Plus audio minutes: ~25 ASR-min and ~40 TTS-char-thousand per post per day

Scale-up scope (post-Orbit, if funded):
- 1,000 posts × 30 sessions/day × 9.4k tokens ≈ **280M tokens/day**
- 30-day at scale ≈ **8.5B tokens / month**

These are the kinds of numbers a Posyandu deployment plausibly consumes. They're far below the trillion-scale, which is the right honest position — Orbit reviewers downscore inflated forecasts.

## File structure

```
posyandu-ai/
├── PLAN.md                ← this file
├── README.md              ← public face, pitch + setup
├── LICENSE                ← MIT
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── public/
│   ├── manifest.json      ← installable PWA
│   └── icon-192.png
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx                    ← landing / kader login
│   │   ├── screen/page.tsx             ← photo capture flow
│   │   ├── complaint/page.tsx          ← voice complaint flow
│   │   ├── result/page.tsx             ← reasoning + audio reply
│   │   ├── roster/page.tsx             ← child history per kader
│   │   ├── about/page.tsx              ← project, models, MIT
│   │   └── api/
│   │       ├── screen/route.ts         ← VL
│   │       ├── transcribe/route.ts     ← ASR (Standard tier required)
│   │       ├── reason/route.ts         ← Pro reasoning
│   │       └── speak/route.ts          ← TTS (Standard tier required)
│   ├── components/
│   │   ├── BottomNav.tsx
│   │   ├── KaderHeader.tsx
│   │   ├── PhotoUploader.tsx
│   │   ├── VoiceRecorder.tsx
│   │   ├── TriageCard.tsx
│   │   ├── GrowthBadge.tsx
│   │   └── DisclaimerBar.tsx
│   ├── lib/
│   │   ├── mimo.ts                     ← MiMoForge factory + tier router
│   │   ├── prompts.ts                  ← system prompts (VL + Pro + TTS)
│   │   ├── growth.ts                   ← WHO Z-score helper (offline)
│   │   ├── i18n.ts                     ← EN / ID dictionary
│   │   └── utils.ts                    ← cn()
│   ├── store/
│   │   └── session.ts                  ← Zustand: current child + queue
│   └── data/
│       └── mock-roster.ts              ← demo seed
```

## Build sequence

1. ✅ `create-next-app` scaffold (done)
2. ✅ install deps
3. PWA manifest + theme tokens (warm white + Posyandu blue)
4. lib/mimo.ts wrapper with tier-routing (`tp-` → SGP for chat/VL, fall back to direct API for ASR/TTS — degrade gracefully if Standard key missing)
5. lib/prompts.ts — VL screening prompt, Pro reasoning prompt with WHO + Buku KIA context, TTS warm voice instructions
6. components: photo upload, voice record, triage card
7. pages: landing → screen → complaint → result → roster
8. API routes
9. Visual QA via CloakBrowser → screenshots to Reyn → iterate
10. README + LICENSE
11. Push to GitHub (luckforme65-stack)
12. Vercel deploy + verify URL
13. Update Orbit submission with repo + live URL

## Pitfalls noted

- TTS routes return 404 on Token Plan SGP — `/api/speak` must use Standard base. If a Standard key isn't available we degrade to a "read it yourself" text card with a 503 audio response, never crash.
- Reasoning models (Pro) emit `reasoning_content` before `content` — must set `max_tokens >= 2000` and parse SSE deltas defensively.
- VL only accepts `data:image/...` URLs — never pass external `https://` URLs.
- Mother-tongue ASR: pass `language: 'auto'`, NOT `'id'`, for Javanese/Sundanese code-switch.
- Vercel team SSO MUST be off for the live demo Orbit reviewers will hit.
- Don't claim diagnosis. Every screen carries "Bukan diagnosa medis". Triage always escalates on uncertainty.
