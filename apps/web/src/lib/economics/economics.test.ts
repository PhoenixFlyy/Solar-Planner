import { describe, expect, it } from "vitest";

import { estimateAnnualDemand } from "./consumption";
import { computeEconomics, type EconomicsInputs } from "./model";

const base: EconomicsInputs = {
  annualDemandKwh: 4500,
  annualProductionKwh: 9000,
  monthlyProductionKwh: Array(12).fill(750),
  kWp: 9,
  storageKwh: 0,
};

describe("estimateAnnualDemand", () => {
  it("consumption_morePersons_increasesDemand", () => {
    expect(estimateAnnualDemand({ persons: 4, eCar: false, heatPump: false })).toBeGreaterThan(
      estimateAnnualDemand({ persons: 2, eCar: false, heatPump: false }),
    );
  });

  it("consumption_eCarAndHeatPump_addLoad", () => {
    const bare = estimateAnnualDemand({ persons: 3, eCar: false, heatPump: false });
    expect(estimateAnnualDemand({ persons: 3, eCar: true, heatPump: false })).toBeGreaterThan(bare);
    expect(estimateAnnualDemand({ persons: 3, eCar: false, heatPump: true })).toBeGreaterThan(bare);
  });
});

describe("computeEconomics", () => {
  it("economics_energyBalance_selfUsePlusFeedInEqualsProduction", () => {
    const r = computeEconomics(base);
    expect(r.selfConsumptionKwh + r.feedInKwh).toBeCloseTo(base.annualProductionKwh, 6);
    expect(r.selfConsumptionKwh).toBeLessThanOrEqual(base.annualDemandKwh + 1e-9);
  });

  it("economics_moreStorage_raisesAutarky", () => {
    const none = computeEconomics({ ...base, storageKwh: 0 });
    const big = computeEconomics({ ...base, storageKwh: 10 });
    expect(big.autarky).toBeGreaterThan(none.autarky);
    expect(big.autarky).toBeLessThanOrEqual(1 + 1e-9);
  });

  it("economics_capexIncludesKwpAndStorage", () => {
    const r = computeEconomics({ ...base, storageKwh: 5 });
    // 2000 base + 9*1500 + 5*800 = 19500
    expect(r.capexEur).toBeCloseTo(2000 + 9 * 1500 + 5 * 800, 6);
  });

  it("economics_cashflow_startsNegativeAndHasPayback", () => {
    const r = computeEconomics(base);
    expect(r.cashflow[0].cumulative).toBeLessThan(0);
    expect(r.cashflow).toHaveLength(26); // year 0..25
    expect(r.paybackYear).not.toBeNull();
    expect(r.paybackYear!).toBeGreaterThan(0);
  });

  it("economics_subsidy_lowersPayback", () => {
    const without = computeEconomics(base);
    const withSubsidy = computeEconomics({ ...base, subsidyEur: 5000 });
    expect(withSubsidy.capexEur).toBeLessThan(without.capexEur);
    expect(withSubsidy.paybackYear!).toBeLessThanOrEqual(without.paybackYear!);
  });
});
