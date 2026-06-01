// Shared shape passed to the PDF/XLSX builders.
import type { EconomicsResult } from "@/lib/economics/model";

export interface PlanSummary {
  address: string;
  templateName: string;
  kWp: number;
  panelCount: number;
  annualKwh: number;
  monthlyKwh: number[];
  economics: EconomicsResult | null;
}

export interface ExportLabels {
  title: string;
  address: string;
  template: string;
  modules: string;
  annualYield: string;
  autarky: string;
  selfConsumption: string;
  payback: string;
  paybackNone: string;
  annualSavings: string;
  capex: string;
  disclaimer: string;
  overviewSheet: string;
  monthlySheet: string;
  cashflowSheet: string;
  metric: string;
  value: string;
  month: string;
  year: string;
  cumulative: string;
}
