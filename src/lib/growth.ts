/**
 * Lightweight, OFFLINE growth-chart helper.
 *
 * Uses WHO Child Growth Standards thresholds, simplified for triage hints.
 * NOT a clinical Z-score calculator — it groups age-month bands and gives a
 * rough "below-2SD" boolean per metric. Always defer to MiMo Pro for the
 * narrative + the actual recommendation; this just gives Pro a starting hint.
 */

export interface GrowthInput {
  ageMonths: number;
  sex: "male" | "female";
  weightKg?: number;
  heightCm?: number;
}

export interface GrowthHints {
  weightForAge: "low" | "ok" | "high" | "unknown";
  heightForAge: "low" | "ok" | "unknown";
  bmiForAge: "low" | "ok" | "high" | "unknown";
  notes: string[];
}

// Median weight (kg) and -2SD weight (kg) by age month for under-5s, simplified.
// Boys / Girls. Source: WHO 2006 standards (rounded).
const WEIGHT_REF: Record<"male" | "female", { median: number; sdMinus2: number }[]> = {
  male: [
    { median: 3.3,  sdMinus2: 2.5 },  // 0
    { median: 4.5,  sdMinus2: 3.4 },
    { median: 5.6,  sdMinus2: 4.4 },
    { median: 6.4,  sdMinus2: 5.0 },
    { median: 7.0,  sdMinus2: 5.6 },
    { median: 7.5,  sdMinus2: 6.0 },
    { median: 7.9,  sdMinus2: 6.4 },
    { median: 8.3,  sdMinus2: 6.7 },
    { median: 8.6,  sdMinus2: 6.9 },
    { median: 8.9,  sdMinus2: 7.1 },
    { median: 9.2,  sdMinus2: 7.4 },
    { median: 9.4,  sdMinus2: 7.6 },
    { median: 9.6,  sdMinus2: 7.7 },  // 12
    { median: 10.3, sdMinus2: 8.3 },  // 18
    { median: 10.9, sdMinus2: 8.8 },  // 24
    { median: 12.7, sdMinus2: 10.0 }, // 36
    { median: 14.3, sdMinus2: 11.0 }, // 48
    { median: 16.3, sdMinus2: 12.4 }, // 60
  ],
  female: [
    { median: 3.2,  sdMinus2: 2.4 },
    { median: 4.2,  sdMinus2: 3.2 },
    { median: 5.1,  sdMinus2: 3.9 },
    { median: 5.8,  sdMinus2: 4.5 },
    { median: 6.4,  sdMinus2: 5.0 },
    { median: 6.9,  sdMinus2: 5.4 },
    { median: 7.3,  sdMinus2: 5.7 },
    { median: 7.6,  sdMinus2: 6.0 },
    { median: 7.9,  sdMinus2: 6.3 },
    { median: 8.2,  sdMinus2: 6.5 },
    { median: 8.5,  sdMinus2: 6.7 },
    { median: 8.7,  sdMinus2: 6.9 },
    { median: 8.9,  sdMinus2: 7.0 },
    { median: 9.6,  sdMinus2: 7.6 },
    { median: 10.2, sdMinus2: 8.1 },
    { median: 12.2, sdMinus2: 9.6 },
    { median: 13.9, sdMinus2: 10.7 },
    { median: 15.8, sdMinus2: 12.1 },
  ],
};

const BAND_MONTHS = [0,1,2,3,4,5,6,7,8,9,10,11,12,18,24,36,48,60];

function pickBand(ageMonths: number): number {
  let idx = 0;
  for (let i = 0; i < BAND_MONTHS.length; i++) {
    if (BAND_MONTHS[i] <= ageMonths) idx = i;
  }
  return idx;
}

export function evaluateGrowth(input: GrowthInput): GrowthHints {
  const out: GrowthHints = {
    weightForAge: "unknown",
    heightForAge: "unknown",
    bmiForAge: "unknown",
    notes: [],
  };

  if (input.ageMonths < 0 || input.ageMonths > 60) {
    out.notes.push("Age out of WHO under-5 standard band; deferring to clinician.");
    return out;
  }

  const band = pickBand(input.ageMonths);

  if (typeof input.weightKg === "number" && input.weightKg > 0) {
    const ref = WEIGHT_REF[input.sex][band];
    if (input.weightKg < ref.sdMinus2) {
      out.weightForAge = "low";
      out.notes.push(`Weight ${input.weightKg}kg is below WHO -2SD (${ref.sdMinus2}kg) for ${input.ageMonths}mo.`);
    } else if (input.weightKg > ref.median * 1.20) {
      out.weightForAge = "high";
    } else {
      out.weightForAge = "ok";
    }
  }

  if (typeof input.heightCm === "number" && input.heightCm > 0) {
    // Height-for-age threshold (very rough): under 5th percentile uses approximation
    // 50th = 50 + ageMonths*0.85 cm (boys) (placeholder for triage hint only)
    const median = input.sex === "male" ? 50 + input.ageMonths * 0.85 : 49 + input.ageMonths * 0.83;
    const sdMinus2 = median * 0.92;
    if (input.heightCm < sdMinus2) {
      out.heightForAge = "low";
      out.notes.push(`Height ${input.heightCm}cm below approx -2SD (${sdMinus2.toFixed(1)}cm) — likely stunting.`);
    } else {
      out.heightForAge = "ok";
    }
  }

  if (input.weightKg && input.heightCm) {
    const m = input.heightCm / 100;
    const bmi = input.weightKg / (m * m);
    if (bmi < 13) {
      out.bmiForAge = "low";
      out.notes.push(`BMI ${bmi.toFixed(1)} suggests wasting.`);
    } else if (bmi > 19) {
      out.bmiForAge = "high";
    } else {
      out.bmiForAge = "ok";
    }
  }

  return out;
}
