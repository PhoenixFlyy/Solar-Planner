// Economics model: self-consumption, autarky, CapEx, payback, 25-year
// cashflow. Self-consumption is a documented MVP heuristic (no hourly sim yet;
// Phase 2 adds hourly BDEW × PVGIS). Numbers are estimates — shown with the
// disclaimer.

export interface EconomicsInputs {
  annualDemandKwh: number;
  annualProductionKwh: number;
  monthlyProductionKwh: number[]; // 12
  kWp: number;
  storageKwh: number;

  electricityPriceEurPerKwh?: number;
  feedInTariffEurPerKwh?: number;
  pricePerKwpEur?: number;
  pricePerStorageKwhEur?: number;
  baseCostEur?: number;
  subsidyEur?: number;
  years?: number;
  priceInflation?: number; // electricity price growth per year
  degradation?: number; // PV output loss per year
  /** If set (e.g. from the hourly simulation), overrides the heuristic. */
  selfConsumptionOverrideKwh?: number;
}

export interface CashflowPoint {
  year: number;
  net: number; // savings that year (negative in year 0 = CapEx)
  cumulative: number;
}

export interface EconomicsResult {
  capexEur: number;
  selfConsumptionKwh: number;
  feedInKwh: number;
  gridImportKwh: number;
  selfConsumptionRate: number; // of production
  autarky: number; // of demand
  annualSavingsEur: number;
  paybackYear: number | null;
  cashflow: CashflowPoint[];
  monthlyProductionKwh: number[];
}

const DEFAULTS = {
  electricityPriceEurPerKwh: 0.35,
  feedInTariffEurPerKwh: 0.08,
  pricePerKwpEur: 1500,
  pricePerStorageKwhEur: 800,
  baseCostEur: 2000,
  subsidyEur: 0,
  years: 25,
  priceInflation: 0.03,
  degradation: 0.005,
};

const STORAGE_CYCLES_PER_YEAR = 300;
const BASE_DIRECT_SELF_USE = 0.3; // ~30% of production used directly w/o storage

export function computeEconomics(inputs: EconomicsInputs): EconomicsResult {
  const o = { ...DEFAULTS, ...inputs };
  const demand = Math.max(0, o.annualDemandKwh);
  const production = Math.max(0, o.annualProductionKwh);

  // Prefer an externally-simulated self-consumption (hourly sim); else fall
  // back to the heuristic: direct self-use + a storage contribution.
  let selfConsumptionKwh: number;
  if (o.selfConsumptionOverrideKwh !== undefined) {
    selfConsumptionKwh = Math.max(0, Math.min(o.selfConsumptionOverrideKwh, demand, production));
  } else {
    const directSelfUse = Math.min(demand, production * BASE_DIRECT_SELF_USE);
    const remainingSurplus = Math.max(0, production - directSelfUse);
    const remainingDemand = Math.max(0, demand - directSelfUse);
    const storageShift = Math.min(
      o.storageKwh * STORAGE_CYCLES_PER_YEAR,
      remainingSurplus,
      remainingDemand,
    );
    selfConsumptionKwh = directSelfUse + storageShift;
  }
  const feedInKwh = Math.max(0, production - selfConsumptionKwh);
  const gridImportKwh = Math.max(0, demand - selfConsumptionKwh);

  const capexEur =
    o.baseCostEur +
    o.kWp * o.pricePerKwpEur +
    o.storageKwh * o.pricePerStorageKwhEur -
    o.subsidyEur;

  const annualSavingsEur =
    selfConsumptionKwh * o.electricityPriceEurPerKwh + feedInKwh * o.feedInTariffEurPerKwh;

  // 25-year cashflow: savings grow with price inflation, production degrades.
  const cashflow: CashflowPoint[] = [{ year: 0, net: -capexEur, cumulative: -capexEur }];
  let cumulative = -capexEur;
  let paybackYear: number | null = null;
  for (let year = 1; year <= o.years; year++) {
    const priceFactor = (1 + o.priceInflation) ** (year - 1);
    const outputFactor = (1 - o.degradation) ** (year - 1);
    const net =
      (selfConsumptionKwh * o.electricityPriceEurPerKwh * priceFactor +
        feedInKwh * o.feedInTariffEurPerKwh) *
      outputFactor;
    cumulative += net;
    if (paybackYear === null && cumulative >= 0) paybackYear = year;
    cashflow.push({ year, net, cumulative });
  }

  return {
    capexEur,
    selfConsumptionKwh,
    feedInKwh,
    gridImportKwh,
    selfConsumptionRate: production > 0 ? selfConsumptionKwh / production : 0,
    autarky: demand > 0 ? selfConsumptionKwh / demand : 0,
    annualSavingsEur,
    paybackYear,
    cashflow,
    monthlyProductionKwh: inputs.monthlyProductionKwh,
  };
}
