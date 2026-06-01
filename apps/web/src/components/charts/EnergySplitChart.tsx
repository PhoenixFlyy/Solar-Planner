"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export interface EnergySplitChartProps {
  selfConsumptionKwh: number;
  feedInKwh: number;
  labels: { selfConsumption: string; feedIn: string };
}

const COLORS = ["#f59e0b", "#94a3b8"];

/** Production split: self-consumed vs grid feed-in. */
export function EnergySplitChart({ selfConsumptionKwh, feedInKwh, labels }: EnergySplitChartProps) {
  const data = [
    { name: labels.selfConsumption, value: Math.round(selfConsumptionKwh) },
    { name: labels.feedIn, value: Math.round(feedInKwh) },
  ];
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={45}
          outerRadius={75}
          paddingAngle={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => `${Number(value).toLocaleString("de-DE")} kWh`} />
      </PieChart>
    </ResponsiveContainer>
  );
}
