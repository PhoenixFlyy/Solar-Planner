// Hourly CSV (8760 rows) from a year simulation. Machine-readable header
// (English, dot decimals) for easy import into spreadsheets/tools.
import type { SimResult } from "@/lib/simulation/simulate";

export function buildHourlyCsv(sim: SimResult): string {
  const h = sim.hourly;
  const rows: string[] = [
    "hour,production_kwh,consumption_kwh,self_kwh,grid_import_kwh,feed_in_kwh,soc_kwh",
  ];
  for (let i = 0; i < h.production.length; i++) {
    rows.push(
      [
        i,
        h.production[i].toFixed(4),
        h.consumption[i].toFixed(4),
        h.self[i].toFixed(4),
        h.gridImport[i].toFixed(4),
        h.feedIn[i].toFixed(4),
        h.soc[i].toFixed(4),
      ].join(","),
    );
  }
  return rows.join("\n") + "\n";
}
