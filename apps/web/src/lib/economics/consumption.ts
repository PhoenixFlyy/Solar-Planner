// Annual electricity demand estimate from a tiny wizard. Rough,
// BDEW-H0-informed figures (wiki/data-sources/bdew-slp.md) — MVP approximation;
// dedicated EV/heat-pump profiles are Phase 2.

export interface ConsumptionInputs {
  persons: number;
  eCar: boolean;
  heatPump: boolean;
}

const BASE_KWH = 600; // appliances/standby floor
const PER_PERSON_KWH = 900;
const ECAR_KWH = 2500; // ~12.000 km/yr
const HEATPUMP_KWH = 4500;

/** Annual demand split into components (drives the hourly load shapes). */
export interface DemandComponents {
  baseKwh: number;
  eCarKwh: number;
  heatPumpKwh: number;
  totalKwh: number;
}

export function demandComponents({ persons, eCar, heatPump }: ConsumptionInputs): DemandComponents {
  const baseKwh = BASE_KWH + PER_PERSON_KWH * Math.max(0, persons);
  const eCarKwh = eCar ? ECAR_KWH : 0;
  const heatPumpKwh = heatPump ? HEATPUMP_KWH : 0;
  return { baseKwh, eCarKwh, heatPumpKwh, totalKwh: baseKwh + eCarKwh + heatPumpKwh };
}

/** Estimated annual household demand in kWh. */
export function estimateAnnualDemand(inputs: ConsumptionInputs): number {
  return demandComponents(inputs).totalKwh;
}
