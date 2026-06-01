import { describe, expect, it } from "vitest";

import { demandComponents } from "@/lib/economics/consumption";
import { HOURS_PER_YEAR } from "./profiles";
import { simulateYear, type SimInput } from "./simulate";

const monthlyPv = [200, 300, 450, 600, 750, 800, 820, 760, 560, 380, 220, 170];

function input(storageKwh: number): SimInput {
  return {
    monthlyPvKwh: monthlyPv,
    demand: demandComponents({ persons: 3, eCar: true, heatPump: true }),
    storageKwh,
    lat: 52.52,
    lng: 13.405,
  };
}

describe("simulateYear", () => {
  it("simulation_producesFullYearOfHours", () => {
    const r = simulateYear(input(0));
    expect(r.hourly.production).toHaveLength(HOURS_PER_YEAR);
    expect(r.hourly.consumption).toHaveLength(HOURS_PER_YEAR);
  });

  it("simulation_productionMatchesPvgisMonthlyTotal", () => {
    const r = simulateYear(input(0));
    expect(r.productionKwh).toBeCloseTo(
      monthlyPv.reduce((a, b) => a + b, 0),
      3,
    );
  });

  it("simulation_demandMatchesComponents", () => {
    const r = simulateYear(input(0));
    expect(r.demandKwh).toBeCloseTo(
      demandComponents({ persons: 3, eCar: true, heatPump: true }).totalKwh,
      3,
    );
  });

  it("simulation_energyBalance_selfPlusGridEqualsDemand", () => {
    const r = simulateYear(input(8));
    expect(r.selfConsumptionKwh + r.gridImportKwh).toBeCloseTo(r.demandKwh, 3);
  });

  it("simulation_selfPlusFeedInNotAboveProduction", () => {
    const r = simulateYear(input(8));
    expect(r.selfConsumptionKwh + r.feedInKwh).toBeLessThanOrEqual(r.productionKwh + 1e-6);
  });

  it("simulation_moreStorage_raisesSelfConsumption", () => {
    const none = simulateYear(input(0));
    const big = simulateYear(input(12));
    expect(big.selfConsumptionKwh).toBeGreaterThan(none.selfConsumptionKwh);
    expect(big.autarky).toBeLessThanOrEqual(1 + 1e-9);
    expect(big.autarky).toBeGreaterThan(0);
  });

  it("simulation_noProductionAtNight", () => {
    const r = simulateYear(input(0));
    // Hour 0 (~midnight CET, 1 Jan) has no sun.
    expect(r.hourly.production[0]).toBe(0);
  });
});
