// XLSX export (SheetJS). Detail tables: overview, monthly yield, cashflow.
import * as XLSX from "xlsx";

import type { ExportLabels, PlanSummary } from "./summary";

const MONTHS = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

export function buildXlsxBlob(summary: PlanSummary, labels: ExportLabels): Blob {
  const wb = XLSX.utils.book_new();

  const overview: (string | number)[][] = [
    [labels.metric, labels.value],
    [labels.address, summary.address],
    [labels.template, summary.templateName],
    ["kWp", Number(summary.kWp.toFixed(2))],
    [labels.modules, summary.panelCount],
    [labels.annualYield, Math.round(summary.annualKwh)],
  ];
  if (summary.economics) {
    const e = summary.economics;
    overview.push(
      [labels.autarky, `${Math.round(e.autarky * 100)} %`],
      [labels.selfConsumption, `${Math.round(e.selfConsumptionRate * 100)} %`],
      [labels.payback, e.paybackYear ?? labels.paybackNone],
      [labels.annualSavings, Math.round(e.annualSavingsEur)],
      [labels.capex, Math.round(e.capexEur)],
    );
  }
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(overview), labels.overviewSheet);

  const monthly: (string | number)[][] = [[labels.month, "kWh"]];
  summary.monthlyKwh.forEach((kwh, i) =>
    monthly.push([MONTHS[i] ?? String(i + 1), Math.round(kwh)]),
  );
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(monthly), labels.monthlySheet);

  if (summary.economics) {
    const cashflow: (string | number)[][] = [[labels.year, labels.cumulative]];
    for (const p of summary.economics.cashflow) cashflow.push([p.year, Math.round(p.cumulative)]);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(cashflow), labels.cashflowSheet);
  }

  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  return new Blob([out], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
