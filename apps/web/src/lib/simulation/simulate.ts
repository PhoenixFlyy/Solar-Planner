// Hourly energy-balance + battery dispatch over a year. Replaces the M1.6
// self-consumption heuristic with a real (if synthetic-profile) simulation,
// and produces the hourly series for CSV export.
import type { DemandComponents } from "@/lib/economics/consumption";
import { hourlyConsumption, hourlyProduction, HOURS_PER_YEAR } from "./profiles";

const ROUND_TRIP_EFFICIENCY = 0.92;

export interface SimInput {
  monthlyPvKwh: number[]; // 12, from PVGIS
  demand: DemandComponents;
  storageKwh: number;
  lat: number;
  lng: number;
}

export interface HourlySeries {
  production: number[];
  consumption: number[];
  self: number[]; // PV used on site (direct + from battery)
  gridImport: number[];
  feedIn: number[];
  soc: number[]; // battery state of charge, kWh
}

export interface SimResult {
  productionKwh: number;
  demandKwh: number;
  selfConsumptionKwh: number;
  feedInKwh: number;
  gridImportKwh: number;
  autarky: number; // self / demand
  selfConsumptionRate: number; // self / production
  hourly: HourlySeries;
}

export function simulateYear(input: SimInput): SimResult {
  const production = hourlyProduction(input.monthlyPvKwh, input.lat, input.lng);
  const consumption = hourlyConsumption(input.demand);
  const cap = Math.max(0, input.storageKwh);

  const series: HourlySeries = {
    production,
    consumption,
    self: new Array(HOURS_PER_YEAR).fill(0),
    gridImport: new Array(HOURS_PER_YEAR).fill(0),
    feedIn: new Array(HOURS_PER_YEAR).fill(0),
    soc: new Array(HOURS_PER_YEAR).fill(0),
  };

  let soc = 0;
  let selfTotal = 0;
  let feedInTotal = 0;
  let gridTotal = 0;

  for (let h = 0; h < HOURS_PER_YEAR; h++) {
    const prod = production[h];
    const cons = consumption[h];
    const direct = Math.min(prod, cons);
    let self = direct;
    let surplus = prod - direct;
    let deficit = cons - direct;

    if (surplus > 0 && cap > 0) {
      const charge = Math.min(surplus, cap - soc);
      soc += charge * ROUND_TRIP_EFFICIENCY;
      surplus -= charge;
    }
    if (deficit > 0 && soc > 0) {
      const discharge = Math.min(deficit, soc);
      soc -= discharge;
      self += discharge;
      deficit -= discharge;
    }

    series.self[h] = self;
    series.feedIn[h] = surplus;
    series.gridImport[h] = deficit;
    series.soc[h] = soc;

    selfTotal += self;
    feedInTotal += surplus;
    gridTotal += deficit;
  }

  const productionKwh = production.reduce((a, b) => a + b, 0);
  const demandKwh = consumption.reduce((a, b) => a + b, 0);

  return {
    productionKwh,
    demandKwh,
    selfConsumptionKwh: selfTotal,
    feedInKwh: feedInTotal,
    gridImportKwh: gridTotal,
    autarky: demandKwh > 0 ? selfTotal / demandKwh : 0,
    selfConsumptionRate: productionKwh > 0 ? selfTotal / productionKwh : 0,
    hourly: series,
  };
}
