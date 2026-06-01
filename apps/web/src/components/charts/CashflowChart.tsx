"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { CashflowPoint } from "@/lib/economics/model";

export interface CashflowChartProps {
  cashflow: CashflowPoint[];
  paybackYear: number | null;
}

/** Cumulative cashflow over the system lifetime, with a payback marker. */
export function CashflowChart({ cashflow, paybackYear }: CashflowChartProps) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={cashflow} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
        <XAxis dataKey="year" tick={{ fontSize: 12 }} />
        <YAxis
          tick={{ fontSize: 12 }}
          width={56}
          tickFormatter={(v) => `${Math.round(v / 1000)}k`}
        />
        <Tooltip formatter={(value) => `${Math.round(Number(value)).toLocaleString("de-DE")} €`} />
        <ReferenceLine y={0} stroke="#78716c" />
        {paybackYear !== null && (
          <ReferenceLine x={paybackYear} stroke="#16a34a" strokeDasharray="4 2" />
        )}
        <Line type="monotone" dataKey="cumulative" stroke="#f59e0b" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
