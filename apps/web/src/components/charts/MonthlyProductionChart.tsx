"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

export interface MonthlyProductionChartProps {
  monthlyKwh: number[];
}

/** Monthly PV production as bars. */
export function MonthlyProductionChart({ monthlyKwh }: MonthlyProductionChartProps) {
  const data = monthlyKwh.map((kwh, i) => ({ month: MONTHS[i] ?? String(i + 1), kwh }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} width={48} />
        <Tooltip
          formatter={(value) => `${Math.round(Number(value)).toLocaleString("de-DE")} kWh`}
        />
        <Bar dataKey="kwh" fill="#f59e0b" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
