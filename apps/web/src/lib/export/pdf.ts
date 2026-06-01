// PDF summary export (jsPDF). Title + key figures + optional 3D screenshot +
// disclaimer (visible on every export — INITIAL_PROMPT Part 11).
import { jsPDF } from "jspdf";

import type { ExportLabels, PlanSummary } from "./summary";

export function buildPdfBlob(
  summary: PlanSummary,
  labels: ExportLabels,
  pngDataUrl?: string,
): Blob {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text(labels.title, 14, 20);

  doc.setFontSize(11);
  let y = 32;
  const line = (k: string, v: string) => {
    doc.text(`${k}: ${v}`, 14, y);
    y += 7;
  };
  line(labels.address, summary.address);
  line(labels.template, summary.templateName);
  line("kWp", summary.kWp.toFixed(1));
  line(labels.modules, String(summary.panelCount));
  line(labels.annualYield, `${Math.round(summary.annualKwh).toLocaleString("de-DE")} kWh`);

  if (summary.economics) {
    const e = summary.economics;
    line(labels.autarky, `${Math.round(e.autarky * 100)} %`);
    line(labels.payback, e.paybackYear ? `${e.paybackYear}` : labels.paybackNone);
    line(labels.annualSavings, `${Math.round(e.annualSavingsEur).toLocaleString("de-DE")} €`);
    line(labels.capex, `${Math.round(e.capexEur).toLocaleString("de-DE")} €`);
  }

  if (pngDataUrl) {
    try {
      doc.addImage(pngDataUrl, "PNG", 14, y + 4, 120, 80);
    } catch {
      // ignore an unusable screenshot
    }
  }

  doc.setFontSize(8);
  doc.text(labels.disclaimer, 14, 287, { maxWidth: 180 });

  return doc.output("blob");
}
