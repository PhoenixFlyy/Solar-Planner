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

/** Estimated annual household demand in kWh. */
export function estimateAnnualDemand({ persons, eCar, heatPump }: ConsumptionInputs): number {
  return (
    BASE_KWH +
    PER_PERSON_KWH * Math.max(0, persons) +
    (eCar ? ECAR_KWH : 0) +
    (heatPump ? HEATPUMP_KWH : 0)
  );
}
