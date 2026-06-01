// Synthetic hourly profiles for an 8760-hour simulation. PV shape comes from
// the sun (clear-sky-ish), scaled so each month matches the PVGIS monthly
// total. Load shapes are BDEW-H0-informed daily curves plus EV (evening) and
// heat-pump (winter-weighted) components. MVP approximation — documented; a
// measured/standard 15-min dataset is a later refinement.
import type { DemandComponents } from "@/lib/economics/consumption";
import { sunPosition } from "@/lib/solar/sun-position";

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; // non-leap 2025
export const HOURS_PER_YEAR = 8760;

function normalize(arr: number[]): number[] {
  const s = arr.reduce((a, b) => a + b, 0) || 1;
  return arr.map((x) => x / s);
}

// Relative within-day shapes (each sums to 1 over 24h).
const BASE_DAY = normalize([
  0.6, 0.5, 0.5, 0.5, 0.5, 0.7, 1.0, 1.3, 1.2, 1.0, 1.0, 1.1, 1.2, 1.0, 0.9, 1.0, 1.2, 1.6, 1.8,
  1.7, 1.5, 1.2, 0.9, 0.7,
]);
const EV_DAY = normalize([
  0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.3, 0.3, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.3, 0.6, 1.2, 1.8,
  1.8, 1.5, 1.0, 0.6, 0.3,
]);
const HP_DAY = normalize([
  1.0, 1.0, 1.0, 1.0, 1.1, 1.3, 1.5, 1.4, 1.1, 0.9, 0.8, 0.8, 0.8, 0.8, 0.9, 1.0, 1.2, 1.4, 1.4,
  1.3, 1.2, 1.1, 1.0, 1.0,
]);
// Heat-pump demand weight per month (cold months dominate).
const HP_MONTH = [1.8, 1.6, 1.2, 0.7, 0.3, 0.1, 0.05, 0.05, 0.2, 0.7, 1.3, 1.7];

/** [month(0-11), hourOfDay(0-23)] for each hour of a non-leap year. */
function hourCalendar(): { month: number; hod: number }[] {
  const out: { month: number; hod: number }[] = [];
  for (let m = 0; m < 12; m++) {
    for (let d = 0; d < DAYS_IN_MONTH[m]; d++) {
      for (let h = 0; h < 24; h++) out.push({ month: m, hod: h });
    }
  }
  return out;
}

const CALENDAR = hourCalendar();

/** Hourly consumption (kWh) for the year from demand components. */
export function hourlyConsumption(c: DemandComponents): number[] {
  // Heat-pump energy per month, normalized to heatPumpKwh over the year.
  const hpMonthTotal = HP_MONTH.reduce((a, w, m) => a + w * DAYS_IN_MONTH[m], 0) || 1;
  const baseDaily = c.baseKwh / 365;
  const evDaily = c.eCarKwh / 365;

  return CALENDAR.map(({ month, hod }) => {
    const base = baseDaily * BASE_DAY[hod];
    const ev = evDaily * EV_DAY[hod];
    const hpDay = (c.heatPumpKwh * HP_MONTH[month]) / hpMonthTotal; // kWh that day
    const hp = hpDay * HP_DAY[hod];
    return base + ev + hp;
  });
}

/** Hourly PV production (kWh) scaled so each month equals its PVGIS total. */
export function hourlyProduction(monthlyPvKwh: number[], lat: number, lng: number): number[] {
  // Clear-sky-ish weight = max(0, sin(elevation)) at each hour (local ~CET).
  const weights = CALENDAR.map((_, h) => {
    const date = new Date(Date.UTC(2025, 0, 1, 0, 0, 0) + h * 3_600_000 - 3_600_000); // ~CET
    const { elevationDeg } = sunPosition(date, lat, lng);
    return Math.max(0, Math.sin((elevationDeg * Math.PI) / 180));
  });

  // Sum weights per month, then scale each hour to hit the monthly target.
  const monthWeightSum = new Array(12).fill(0);
  CALENDAR.forEach((c, h) => (monthWeightSum[c.month] += weights[h]));

  return CALENDAR.map((c, h) => {
    const sum = monthWeightSum[c.month];
    return sum > 0 ? (weights[h] / sum) * (monthlyPvKwh[c.month] ?? 0) : 0;
  });
}
